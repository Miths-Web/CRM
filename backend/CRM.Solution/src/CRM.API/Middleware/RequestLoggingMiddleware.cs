using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Threading.Tasks;

namespace CRM.API.Middleware
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var sw = Stopwatch.StartNew();
            _logger.LogInformation($"Handling request: {context.Request.Method} {context.Request.Path}");

            await _next(context);

            sw.Stop();
            _logger.LogInformation($"Finished handling request. Status Code: {context.Response.StatusCode} in {sw.ElapsedMilliseconds}ms");
        }
    }
}
