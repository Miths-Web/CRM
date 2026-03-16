using CRM.Application.Features.Auth.DTOs;
using System;
using System.Threading.Tasks;

namespace CRM.Application.Common.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
        Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
        Task<UserProfileDto?> GetUserProfileAsync(Guid userId);
        Task<AuthResponseDto> ChangePasswordAsync(Guid userId, ChangePasswordRequestDto request);
    }
}
