using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Auth.DTOs;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace CRM.Application.Features.Auth.Commands
{
    /// <summary>
    /// MediatR Command: Register a new user.
    /// Send via IMediator.Send(new RegisterCommand(...))
    /// </summary>
    public record RegisterCommand(RegisterRequestDto Request) : IRequest<AuthResponseDto>;

    public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponseDto>
    {
        private readonly IAuthService _authService;

        public RegisterCommandHandler(IAuthService authService)
        {
            _authService = authService;
        }

        public async Task<AuthResponseDto> Handle(RegisterCommand command, CancellationToken cancellationToken)
        {
            return await _authService.RegisterAsync(command.Request);
        }
    }
}
