using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CRM.Application.Common.Behaviors
{
    /// <summary>
    /// Pipeline Behavior: Catches any unhandled exceptions from handlers.
    /// Logs the error with full details and re-throws so the global
    /// ExceptionMiddleware can return a clean error response to the client.
    /// </summary>
    public class UnhandledExceptionBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : notnull
    {
        private readonly ILogger<UnhandledExceptionBehavior<TRequest, TResponse>> _logger;

        public UnhandledExceptionBehavior(ILogger<UnhandledExceptionBehavior<TRequest, TResponse>> logger)
        {
            _logger = logger;
        }

        public async Task<TResponse> Handle(
            TRequest request,
            RequestHandlerDelegate<TResponse> next,
            CancellationToken cancellationToken)
        {
            try
            {
                return await next();
            }
            catch (Exception ex)
            {
                var requestName = typeof(TRequest).Name;
                _logger.LogError(
                    ex,
                    "[CRM Exception] Unhandled exception for request {RequestName}: {@Request}",
                    requestName,
                    request);
                throw;
            }
        }
    }
}
