using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

namespace CRM.Application.Common.Behaviors
{
    /// <summary>
    /// Pipeline Behavior: Monitors request performance.
    /// If a request takes longer than 500ms, a WARNING is logged.
    /// This helps identify slow queries and bottlenecks early.
    /// </summary>
    public class PerformanceBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : notnull
    {
        private readonly Stopwatch _timer;
        private readonly ILogger<PerformanceBehavior<TRequest, TResponse>> _logger;
        private const int SlowRequestThresholdMs = 500;

        public PerformanceBehavior(ILogger<PerformanceBehavior<TRequest, TResponse>> logger)
        {
            _timer = new Stopwatch();
            _logger = logger;
        }

        public async Task<TResponse> Handle(
            TRequest request,
            RequestHandlerDelegate<TResponse> next,
            CancellationToken cancellationToken)
        {
            _timer.Start();

            var response = await next();

            _timer.Stop();

            var elapsedMs = _timer.ElapsedMilliseconds;

            if (elapsedMs > SlowRequestThresholdMs)
            {
                var requestName = typeof(TRequest).Name;
                _logger.LogWarning(
                    "[CRM Performance] Slow request detected: {RequestName} took {ElapsedMs}ms. Request: {@Request}",
                    requestName,
                    elapsedMs,
                    request);
            }

            return response;
        }
    }
}
