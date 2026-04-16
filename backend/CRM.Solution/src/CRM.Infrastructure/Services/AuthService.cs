using CRM.Application.Common.Exceptions;
using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Auth.DTOs;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace CRM.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _config;

        public AuthService(ApplicationDbContext context, ITokenService tokenService, IConfiguration config)
        {
            _context     = context;
            _tokenService = tokenService;
            _config      = config;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return new AuthResponseDto { Success = false, Message = "Email is already registered." };

            var roleName = !string.IsNullOrEmpty(request.Role) ? request.Role : "Viewer";
            var assignedRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
            
            if (assignedRole == null)
            {
                // Create the role if it does not exist in the database yet
                assignedRole = new Role 
                { 
                    Name = roleName, 
                    Description = $"System automatically created {roleName} role." 
                };
                _context.Roles.Add(assignedRole);
            }

            var user = new User
            {
                FirstName    = request.FirstName,
                LastName     = request.LastName,
                Email        = request.Email,
                Phone        = request.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                IsActive     = true,
                CreatedAt    = DateTime.UtcNow,
                UpdatedAt    = DateTime.UtcNow
            };

            if (assignedRole != null)
                user.Roles.Add(assignedRole);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new AuthResponseDto { Success = true, Message = "User registered successfully." };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
        {
            var user = await _context.Users
                .Include(u => u.Roles)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            // --- Account Lockout Check ---
            if (user != null && user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
            {
                var remaining = (int)(user.LockoutEnd.Value - DateTime.UtcNow).TotalMinutes + 1;
                return new AuthResponseDto
                {
                    Success = false,
                    Message = $"Account is temporarily locked due to multiple failed login attempts. Please try again after {remaining} minute(s)."
                };
            }

            // --- Validate password ---
            bool passwordValid = user != null && BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

            if (user == null || !passwordValid)
            {
                // Increment failed attempts for SECURITY (don't reveal if email exists)
                if (user != null)
                {
                    user.FailedLoginAttempts++;
                    if (user.FailedLoginAttempts >= 5)
                    {
                        user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);
                        user.FailedLoginAttempts = 0; // Reset counter
                        await _context.SaveChangesAsync();
                        return new AuthResponseDto
                        {
                            Success = false,
                            Message = "Account locked for 15 minutes due to 5 consecutive failed login attempts."
                        };
                    }
                    await _context.SaveChangesAsync();
                }
                return new AuthResponseDto { Success = false, Message = "Invalid email or password." };
            }

            if (!user.IsActive)
                return new AuthResponseDto { Success = false, Message = "Account is deactivated. Contact administrator." };

            // --- Success: Reset lockout counters ---
            user.FailedLoginAttempts = 0;
            user.LockoutEnd          = null;

            // Generate tokens
            var accessToken  = _tokenService.GenerateAccessToken(user);
            var refreshToken = _tokenService.GenerateRefreshToken();

            var durationDays = int.TryParse(_config["Jwt:RefreshTokenDurationDays"], out var d) ? d : 7;
            user.RefreshToken       = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(durationDays);
            user.LastLogin          = DateTime.UtcNow;
            user.UpdatedAt          = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var expiryMinutes = int.TryParse(_config["Jwt:DurationInMinutes"], out var m) ? m : 60;

            var roleIds = user.Roles.Select(r => r.Id).ToList();
            var permissions = await _context.RolePermissions
                .Where(p => roleIds.Contains(p.RoleId))
                .Select(p => p.Module + "." + p.Permission)
                .ToListAsync();

            return new AuthResponseDto
            {
                Success      = true,
                Message      = "Login successful.",
                AccessToken  = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt    = DateTime.UtcNow.AddMinutes(expiryMinutes),
                User         = new UserProfileDto
                {
                    Id        = user.Id,
                    FirstName = user.FirstName,
                    LastName  = user.LastName,
                    Email     = user.Email,
                    AvatarUrl = user.AvatarUrl,
                    Roles     = user.Roles.Select(r => r.Name).ToArray(),
                    Permissions = permissions.ToArray()
                }
            };
        }

        public async Task<UserProfileDto?> GetUserProfileAsync(Guid userId)
        {
            var user = await _context.Users
                .Include(u => u.Roles)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return null;

            var roleIds = user.Roles.Select(r => r.Id).ToList();
            var permissions = await _context.RolePermissions
                .Where(p => roleIds.Contains(p.RoleId))
                .Select(p => p.Module + "." + p.Permission)
                .ToListAsync();

            return new UserProfileDto
            {
                Id        = user.Id,
                FirstName = user.FirstName,
                LastName  = user.LastName,
                Email     = user.Email,
                AvatarUrl = user.AvatarUrl,
                Roles     = user.Roles.Select(r => r.Name).ToArray(),
                Permissions = permissions.ToArray()
            };
        }

        public async Task<AuthResponseDto> ChangePasswordAsync(Guid userId, ChangePasswordRequestDto request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return new AuthResponseDto { Success = false, Message = "User not found." };

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                return new AuthResponseDto { Success = false, Message = "Current password is incorrect." };

            user.PasswordHash       = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.RefreshToken       = null;           // Revoke all sessions on password change
            user.RefreshTokenExpiry = null;
            user.UpdatedAt          = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return new AuthResponseDto { Success = true, Message = "Password changed successfully. Please login again." };
        }
    }
}
