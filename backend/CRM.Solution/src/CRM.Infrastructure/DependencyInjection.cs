using CRM.Application.Common.Interfaces;
using CRM.Infrastructure.Data;
using CRM.Infrastructure.Repositories;
using CRM.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CRM.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

            // ─── Database (SQL Server) ─────────────────────────────────────────
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString));

            // ─── Repositories ──────────────────────────────────────────────────
            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            services.AddScoped<ILeadRepository, LeadRepository>();
            services.AddScoped<IDealRepository, DealRepository>();
            services.AddScoped<ITaskRepository, TaskRepository>();
            services.AddScoped<IEventRepository, EventRepository>();
            services.AddScoped<IEmailRepository, EmailRepository>();
            services.AddScoped<INoteRepository, NoteRepository>();
            services.AddScoped<IDocumentRepository, DocumentRepository>();

            // ─── Services ──────────────────────────────────────────────────────
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<ILeadService, LeadService>();
            services.AddScoped<IDealService, DealService>();
            services.AddScoped<ITaskService, TaskService>();
            services.AddScoped<IEventService, EventService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<INoteService, NoteService>();
            services.AddScoped<IDocumentService, DocumentService>();
            services.AddSingleton<FileStorageService>();

            // NOTE: JWT Authentication is configured in Program.cs
            // to support HttpOnly cookies for SignalR + API.
            // Do NOT add AddAuthentication here — it will conflict.

            return services;
        }
    }
}
