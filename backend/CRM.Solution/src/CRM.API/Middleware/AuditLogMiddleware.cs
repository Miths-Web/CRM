using CRM.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;

namespace CRM.API.Middleware
{
    /// <summary>
    /// AuditLog Middleware — Intercepts all mutating API calls (POST/PUT/PATCH/DELETE)
    /// and records WHO did WHAT, WHEN, on WHICH entity into the AuditLogs table.
    /// This is critical for compliance and debugging in enterprise CRM systems.
    /// </summary>
    public class AuditLogMiddleware
    {
        private readonly RequestDelegate _next;

        public AuditLogMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext)
        {
            // Only audit mutating methods
            var method = context.Request.Method;
            if (method != "POST" && method != "PUT" && method != "PATCH" && method != "DELETE")
            {
                await _next(context);
                return;
            }

            // Only audit /api/ routes (skip Swagger, health, SignalR)
            var path = context.Request.Path.Value ?? "";
            if (!path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            await _next(context);

            // Only log successful operations (2xx responses)
            if (context.Response.StatusCode < 200 || context.Response.StatusCode >= 300) return;

            try
            {
                // Extract user from JWT claims
                var userIdStr = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                             ?? context.User.FindFirstValue("sub");
                Guid.TryParse(userIdStr, out var userId);

                // Parse entity name and ID from URL (e.g. /api/contacts/abc123)
                var segments  = path.Trim('/').Split('/');
                var entityName = segments.Length >= 2 ? segments[1] : "Unknown";
                Guid? entityId = null;
                if (segments.Length >= 3 && Guid.TryParse(segments[2], out var parsedId))
                    entityId = parsedId;

                var action = method switch
                {
                    "POST"   => "Created",
                    "PUT"    => "Updated",
                    "PATCH"  => "Patched",
                    "DELETE" => "Deleted",
                    _        => method
                };

                dbContext.AuditLogs.Add(new Domain.Entities.AuditLog
                {
                    UserId     = userId == Guid.Empty ? null : userId,
                    Action     = action,
                    EntityName = entityName,
                    EntityId   = entityId,
                    IpAddress  = context.Connection.RemoteIpAddress?.ToString(),
                    Changes    = $"Method:{method} Path:{path}",
                    CreatedAt  = DateTime.UtcNow
                });

                await dbContext.SaveChangesAsync();
            }
            catch
            {
                // Never let audit logging break the main request flow
            }
        }
    }
}
