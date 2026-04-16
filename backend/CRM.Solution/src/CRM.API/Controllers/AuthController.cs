using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Auth.DTOs;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using CRM.Infrastructure.Data;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimiting("AuthPolicy")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ApplicationDbContext _context;

        public AuthController(IAuthService authService, ApplicationDbContext context)
        {
            _authService = authService;
            _context     = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            // Security: Prevent public users from injecting a Role. Public registration ALWAYS defaults to "Viewer".
            request.Role = null; 
            
            var response = await _authService.RegisterAsync(request);
            if (!response.Success)
            {
                return BadRequest(new { message = response.Message });
            }

            return Ok(response);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _authService.LoginAsync(request);
            if (!response.Success)
            {
                return Unauthorized(new { message = response.Message });
            }

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,   // For HTTPS
                SameSite = SameSiteMode.None,
                Expires = response.ExpiresAt
            };
            
            Response.Cookies.Append("X-Access-Token", response.AccessToken!, cookieOptions);
            
            // SECURITY FIX: Store Refresh Token securely via HttpOnly cookie
            if (!string.IsNullOrEmpty(response.RefreshToken))
            {
                Response.Cookies.Append("X-Refresh-Token", response.RefreshToken, cookieOptions);
            }

            // SECURITY FIX: Clear tokens from the response body to prevent XSS leakage
            response.AccessToken = null;
            response.RefreshToken = null;

            return Ok(response);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            var deleteOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None
            };
            Response.Cookies.Delete("X-Access-Token", deleteOptions);
            Response.Cookies.Delete("X-Refresh-Token", deleteOptions); // BUG-004 FIX: Refresh token bhi delete karo
            return Ok(new { success = true, message = "Logged out successfully" });
        }

        [HttpGet("is-setup")]
        public async Task<IActionResult> IsSetupDone()
        {
            bool hasAdmin = await _context.Users.AnyAsync(u => u.Roles.Any(r => r.Name == "Admin"));
            return Ok(new { isSetupDone = hasAdmin });
        }

        [HttpPost("setup")]
        public async Task<IActionResult> Setup([FromBody] RegisterRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if setup already done
            bool hasAdmin = await _context.Users.AnyAsync(u => u.Roles.Any(r => r.Name == "Admin"));
            if (hasAdmin)
            {
                return BadRequest(new { message = "Initial setup is already complete. Admin already exists." });
            }

            request.Role = "Admin";
            var response = await _authService.RegisterAsync(request);
            if (!response.Success)
            {
                return BadRequest(new { message = response.Message });
            }

            return Ok(response);
        }
        [HttpGet("me")]
        public IActionResult GetMe()
        {
            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
            var isInAdmin = User.IsInRole("Admin");
            var isInAdminLower = User.IsInRole("admin");
            var isInManager = User.IsInRole("Manager");
            return Ok(new { claims, isInAdmin, isInAdminLower, isInManager, identityName = User.Identity?.Name });
        }
    }
}
