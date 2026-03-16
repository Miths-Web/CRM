using CRM.Application.Common.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace CRM.API.Middleware
{
    /// <summary>
    /// Global exception handler middleware.
    /// Catches ALL unhandled exceptions, logs them, and returns structured JSON error responses.
    /// In Development: shows full stack trace. In Production: hides internal details (security!).
    /// </summary>
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            int statusCode;
            string title;
            string message;

            // Map specific exception types to HTTP status codes
            switch (exception)
            {
                case NotFoundException notFound:
                    statusCode = (int)HttpStatusCode.NotFound;                 // 404
                    title   = "Not Found";
                    message = notFound.Message;
                    _logger.LogWarning("Not found: {Message}", notFound.Message);
                    break;

                case BusinessException business:
                    statusCode = (int)HttpStatusCode.BadRequest;               // 400
                    title   = "Business Rule Violation";
                    message = business.Message;
                    _logger.LogWarning("Business rule: {Message}", business.Message);
                    break;

                case ForbiddenException forbidden:
                    statusCode = (int)HttpStatusCode.Forbidden;                // 403
                    title   = "Forbidden";
                    message = forbidden.Message;
                    _logger.LogWarning("Forbidden: {Message}", forbidden.Message);
                    break;

                case CRM.Application.Common.Exceptions.ValidationException validation:
                    statusCode = StatusCodes.Status422UnprocessableEntity;     // 422
                    title   = "Validation Error";
                    message = validation.Message;
                    _logger.LogWarning("Validation: {Message}", validation.Message);
                    break;

                case ConflictException conflict:
                    statusCode = (int)HttpStatusCode.Conflict;                 // 409
                    title   = "Conflict";
                    message = conflict.Message;
                    _logger.LogWarning("Conflict: {Message}", conflict.Message);
                    break;

                case UnauthorizedAccessException:
                    statusCode = (int)HttpStatusCode.Unauthorized;             // 401
                    title   = "Unauthorized";
                    message = "Authentication is required to access this resource.";
                    _logger.LogWarning("Unauthorized access attempt.");
                    break;

                default:
                    statusCode = (int)HttpStatusCode.InternalServerError;      // 500
                    title   = "Internal Server Error";
                    message = "An unexpected error occurred. Please try again later.";
                    // Log the full exception for 500 errors (not exposed to client)
                    _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);
                    break;
            }

            context.Response.ContentType = "application/json";
            context.Response.StatusCode  = statusCode;

            // Build the error response
            var errorResponse = new
            {
                StatusCode = statusCode,
                Title      = title,
                Message    = message,
                // Show stack trace ONLY in Development — NEVER in Production
                Detail     = _env.IsDevelopment() ? exception.ToString() : null,
                Timestamp  = DateTime.UtcNow,
                Path       = context.Request.Path.Value
            };

            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse, options));
        }
    }
}
