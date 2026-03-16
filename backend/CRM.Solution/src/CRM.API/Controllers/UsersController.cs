using CRM.Application.Features.Users;
using CRM.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Auth.DTOs;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuthService _authService;

        public UsersController(ApplicationDbContext context, IAuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        /// <summary>GET /api/users — Admin only, list all users</summary>
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users
                .Include(u => u.Roles)
                .Select(u => new UserDto
                {
                    Id         = u.Id,
                    FirstName  = u.FirstName,
                    LastName   = u.LastName,
                    Email      = u.Email,
                    Phone      = u.Phone,
                    AvatarUrl  = u.AvatarUrl,
                    IsActive   = u.IsActive,
                    LastLogin  = u.LastLogin,
                    CreatedAt  = u.CreatedAt,
                    Roles      = u.Roles.Select(r => r.Name).ToList()
                })
                .ToListAsync();

            return Ok(users);
        }

        /// <summary>POST /api/users — Admin only, create a user with a specific role</summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] RegisterRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Admin is allowed to specify Roles in the backend, we don't nullify it here.
            var response = await _authService.RegisterAsync(dto);
            if (!response.Success) return BadRequest(new { message = response.Message });

            return Ok(response);
        }

        /// <summary>GET /api/users/profile — Get logged-in user</summary>
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            return await GetById(userId);
        }

        /// <summary>PUT /api/users/profile — Update logged-in user</summary>
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            return await Update(userId, dto);
        }

        /// <summary>POST /api/users/change-password — Change own password</summary>
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var response = await _authService.ChangePasswordAsync(userId, dto);
            if (!response.Success) return BadRequest(new { message = response.Message });

            return Ok(response);
        }

        /// <summary>GET /api/users/{id} — Get single user</summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var user = await _context.Users
                .Include(u => u.Roles)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound(new { message = "User not found." });

            return Ok(new UserDto
            {
                Id        = user.Id,
                FirstName = user.FirstName,
                LastName  = user.LastName,
                Email     = user.Email,
                Phone     = user.Phone,
                AvatarUrl = user.AvatarUrl,
                IsActive  = user.IsActive,
                LastLogin = user.LastLogin,
                CreatedAt = user.CreatedAt,
                Roles     = user.Roles.Select(r => r.Name).ToList()
            });
        }

        /// <summary>PUT /api/users/{id} — Update user profile</summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found." });

            if (dto.FirstName != null) user.FirstName = dto.FirstName;
            if (dto.LastName  != null) user.LastName  = dto.LastName;
            if (dto.Phone     != null) user.Phone     = dto.Phone;
            if (dto.AvatarUrl != null) user.AvatarUrl = dto.AvatarUrl;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>PATCH /api/users/{id}/deactivate — Admin only, deactivate a user</summary>
        [HttpPatch("{id:guid}/deactivate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Deactivate(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found." });

            user.IsActive  = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>PATCH /api/users/{id}/toggle-status — Admin only, toggle active</summary>
        [HttpPatch("{id:guid}/toggle-status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleStatus(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found." });

            user.IsActive  = !user.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>PUT /api/users/{id}/role — Admin only, change user role</summary>
        [HttpPut("{id:guid}/role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateUserRoleDto dto)
        {
            var user = await _context.Users
                .Include(u => u.Roles)
                .FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound(new { message = "User not found." });

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == dto.RoleName);
            if (role == null) return BadRequest(new { message = $"Role '{dto.RoleName}' does not exist." });

            user.Roles.Clear();
            user.Roles.Add(role);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return NoContent();
        }
        /// <summary>POST /api/users/{id}/unlock — Admin only, unlock a locked account</summary>
        [HttpPost("{id:guid}/unlock")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UnlockAccount(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found." });

            user.LockoutEnd          = null;
            user.FailedLoginAttempts = 0;
            user.UpdatedAt           = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Account for {user.Email} has been unlocked successfully." });
        }
    }
}
