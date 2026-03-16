using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Auth.DTOs;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace CRM.Application.Features.Auth.Commands
{
    /// <summary>
    /// MediatR Command: Login an existing user.
    /// </summary>
    public record LoginCommand(LoginRequestDto Request) : IRequest<AuthResponseDto>;

    public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
    {
        private readonly IAuthService _authService;

        public LoginCommandHandler(IAuthService authService)
        {
            _authService = authService;
        }

        public async Task<AuthResponseDto> Handle(LoginCommand command, CancellationToken cancellationToken)
        {
            return await _authService.LoginAsync(command.Request);
        }
    }
}
