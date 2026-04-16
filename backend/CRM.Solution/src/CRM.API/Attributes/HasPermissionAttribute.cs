using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using CRM.Infrastructure.Data;

namespace CRM.API.Attributes
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, Inherited = true, AllowMultiple = true)]
    public class HasPermissionAttribute : TypeFilterAttribute
    {
        public HasPermissionAttribute(string module, string permission) : base(typeof(HasPermissionFilter))
        {
            Arguments = new object[] { module, permission };
        }
    }

    public class HasPermissionFilter : IAsyncAuthorizationFilter
    {
        private readonly string _module;
        private readonly string _permission;

        public HasPermissionFilter(string module, string permission)
        {
            _module = module;
            _permission = permission;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            // If the user isn't authenticated, the framework's [Authorize] will handle it
            if (!context.HttpContext.User.Identity.IsAuthenticated) return;

            // Extract the user's role(s) from JWT token claims
            var roleClaims = context.HttpContext.User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type == "role")
                .Select(c => c.Value)
                .ToList();

            // 1. SUPER ADMIN RULE: If "Admin" role exists, allow EVERYTHING!
            if (roleClaims.Contains("Admin", StringComparer.OrdinalIgnoreCase))
            {
                return; // Authorization Passed
            }

            // If user has no roles and is not Admin, forbid.
            if (!roleClaims.Any())
            {
                context.Result = new ForbidResult();
                return;
            }

            // 2. CHECK ROLE PERMISSIONS IN THE DATABASE
            var dbContext = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();

            // Let's get the Role objects that match the user's claims
            var userRolesIds = await dbContext.Roles
                .Where(r => roleClaims.Contains(r.Name))
                .Select(r => r.Id)
                .ToListAsync();

            if (!userRolesIds.Any())
            {
                context.Result = new ForbidResult();
                return;
            }

            // Now check if ANY of these roles has the requested Module + Permission
            var hasPermission = await dbContext.RolePermissions.AnyAsync(p =>
                userRolesIds.Contains(p.RoleId) &&
                p.Module == _module &&
                p.Permission == _permission);

            if (!hasPermission)
            {
                // Return 403 Forbidden with a little contextual message
                context.Result = new ObjectResult(new { message = $"Access Denied. You do not have '{_permission}' permission for module '{_module}'." }) 
                { 
                    StatusCode = 403 
                };
            }
        }
    }
}
