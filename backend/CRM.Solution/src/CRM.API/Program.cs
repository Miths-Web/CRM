using CRM.Application.Common.Exceptions;
using CRM.Infrastructure;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System;
using System.Text;
using System.Text.Json.Serialization;
using CRM.API.Middleware;
using CRM.API.Hubs;
using CRM.Application.Common.Interfaces;
using CRM.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// ─── Controllers & JSON ───────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

// ─── Infrastructure (DB, Repos, Services) ────────────────────────────────────
builder.Services.AddInfrastructure(config);

// ─── Caching ─────────────────────────────────────────────────────────────────
var redisConn = config.GetConnectionString("Redis");
if (!string.IsNullOrEmpty(redisConn))
{
    builder.Services.AddStackExchangeRedisCache(opt => opt.Configuration = redisConn);
    builder.Services.AddSingleton<ICacheService, RedisCacheService>();
}
else
{
    builder.Services.AddMemoryCache();
    builder.Services.AddSingleton<ICacheService, InMemoryCacheService>(); 
}

// ─── Hangfire (Background Jobs) ──────────────────────────────────────────────
var dbConn = config.GetConnectionString("DefaultConnection")!;
builder.Services.AddHangfire(cfg => cfg
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(dbConn, new SqlServerStorageOptions 
    { 
        SchemaName = "Hangfire"
    }));
builder.Services.AddHangfireServer();

// ─── Health Checks ───────────────────────────────────────────────────────────
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy("API is running"))
    .AddSqlServer(dbConn, name: "SQL Server", failureStatus: HealthStatus.Degraded, tags: new[] { "db" });

// ─── CORS (AllowCredentials required for SignalR) ────────────────────────────
builder.Services.AddCors(options =>
    options.AddPolicy("DhwitiCRMPolicy", policy =>
        policy.WithOrigins(
            config.GetSection("AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:4200", "http://localhost:3000", "http://localhost:5284" })
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

// ─── Swagger ─────────────────────────────────────────────────────────────────
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Dhwiti CRM API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            Array.Empty<string>()
        }
    });
});

// ─── JWT Authentication ──────────────────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = config["Jwt:Issuer"],
            ValidAudience            = config["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(config["Jwt:Key"]!))
        };

        // Allow SignalR to receive token via query string and API via HttpOnly Cookie
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var hubToken = ctx.Request.Query["access_token"];
                var path  = ctx.HttpContext.Request.Path;

                // BUG-003 FIX: SignalR aur API ke liye alag priority chain
                // 1. Hub path pe query string token sabse pehle
                if (!string.IsNullOrEmpty(hubToken) && path.StartsWithSegments("/hubs"))
                {
                    ctx.Token = hubToken;
                }
                // 2. Sirf regular API calls ke liye cookies check karo (hub token ko override mat karo)
                else if (ctx.Request.Cookies.TryGetValue("X-Access-Token", out var xAccessTokenCookie))
                {
                    ctx.Token = xAccessTokenCookie;
                }
                else if (ctx.Request.Cookies.TryGetValue("access_token", out var accessTokenCookie))
                {
                    ctx.Token = accessTokenCookie;
                }
                
                return System.Threading.Tasks.Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();

// ─── Rate Limiting ───────────────────────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("GlobalPolicy", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
    });

    options.AddFixedWindowLimiter("AuthPolicy", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
    // On rate limit exceeded → return 429 with message
    options.OnRejected = async (ctx, _) =>
    {
        ctx.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await ctx.HttpContext.Response.WriteAsJsonAsync(new { message = "Too many requests. Please slow down and try again later." });
    };
});

// ─── SignalR ──────────────────────────────────────────────────────────────────
builder.Services.AddSignalR();
// NotificationHub service (inject from anywhere to push real-time alerts)
builder.Services.AddSingleton<INotificationService, NotificationService>();

// ─── Build ───────────────────────────────────────────────────────────────────
var app = builder.Build();

// ─── Middleware Pipeline (ORDER IS CRITICAL!) ────────────────────────────────
app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<AuditLogMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Dhwiti CRM API v1"));
}

app.UseHttpsRedirection();

// ─── Security Headers ────────────────────────────────────────────────────────
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    context.Response.Headers.Append("Content-Security-Policy",
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; " +
        "connect-src 'self' wss: ws:; " +
        "frame-src https://meet.jit.si; " +
        "font-src 'self';");
    if (!app.Environment.IsDevelopment())
        context.Response.Headers.Append("Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload");
    await next();
});

app.UseCors("DhwitiCRMPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers().RequireRateLimiting("GlobalPolicy");

// ─── Map SignalR Hubs & HealthChecks ─────────────────────────────────────────
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<LiveChatHub>("/hubs/livechat");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHealthChecks("/health");

// ─── Hangfire Dashboard (protected) ──────────────────────────────────────────
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireAuthFilter() }
});

app.Run();
