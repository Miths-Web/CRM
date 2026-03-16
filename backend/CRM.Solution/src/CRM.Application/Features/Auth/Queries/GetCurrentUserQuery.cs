using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Auth.DTOs;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CRM.Application.Features.Auth.Queries
{
    /// <summary>
    /// MediatR Query: Get the currently authenticated user profile.
    /// </summary>
    public record GetCurrentUserQuery(Guid UserId) : IRequest<UserProfileDto?>;

    public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, UserProfileDto?>
    {
        private readonly IAuthService _authService;

        public GetCurrentUserQueryHandler(IAuthService authService)
        {
            _authService = authService;
        }

        public async Task<UserProfileDto?> Handle(GetCurrentUserQuery query, CancellationToken cancellationToken)
        {
            return await _authService.GetUserProfileAsync(query.UserId);
        }
    }
}
