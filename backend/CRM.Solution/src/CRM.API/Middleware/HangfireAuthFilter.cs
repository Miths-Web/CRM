using Hangfire.Dashboard;

namespace CRM.API.Middleware
{
    /// <summary>
    /// Hangfire Dashboard auth filter — only allows Admin role to view job dashboard.
    /// Without this, the /hangfire URL is publicly accessible!
    /// </summary>
    public class HangfireAuthFilter : IDashboardAuthorizationFilter
    {
        public bool Authorize(DashboardContext context)
        {
            var httpContext = context.GetHttpContext();
            // Only allow authenticated Admins
            return httpContext.User?.Identity?.IsAuthenticated == true
                && httpContext.User.IsInRole("Admin");
        }
    }
}
