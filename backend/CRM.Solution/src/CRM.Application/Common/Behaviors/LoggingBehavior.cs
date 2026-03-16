using MediatR;
using Microsoft.Extensions.Logging;
using System.Threading;
using System.Threading.Tasks;

namespace CRM.Application.Common.Behaviors
{
    /// <summary>
    /// Pipeline Behavior: Logs every incoming request and its completion.
    /// Useful for audit trails and debugging in production.
    /// </summary>
    public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : notnull
    {
        private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

        public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
        {
            _logger = logger;
        }

        public async Task<TResponse> Handle(
            TRequest request,
            RequestHandlerDelegate<TResponse> next,
            CancellationToken cancellationToken)
        {
            var requestName = typeof(TRequest).Name;

            _logger.LogInformation(
                "[CRM Request] Handling {RequestName}: {@Request}",
                requestName,
                request);

            var response = await next();

            _logger.LogInformation(
                "[CRM Request] Handled {RequestName} successfully.",
                requestName);

            return response;
        }
    }
}
