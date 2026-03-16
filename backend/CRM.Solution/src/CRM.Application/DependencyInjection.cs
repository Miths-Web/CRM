using CRM.Application.Common.Behaviors;
using CRM.Application.Common.Mappings;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace CRM.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            var assembly = Assembly.GetExecutingAssembly();

            // AutoMapper - scans MappingProfile automatically
            services.AddAutoMapper(cfg => cfg.AddMaps(assembly));

            // MediatR - scans all IRequestHandler<> implementations
            services.AddMediatR(cfg =>
            {
                cfg.RegisterServicesFromAssembly(assembly);

                // Pipeline Behaviors (execute in order):
                // 1. Log the request
                cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
                // 2. Monitor performance
                cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(PerformanceBehavior<,>));
                // 3. Validate the request data
                cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
                // 4. Catch unhandled exceptions
                cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(UnhandledExceptionBehavior<,>));
            });

            // FluentValidation - auto-registers all validators in this assembly
            services.AddValidatorsFromAssembly(assembly);

            return services;
        }
    }
}
