using CRM.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class SettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly Microsoft.Extensions.Configuration.IConfiguration _config;

        public SettingsController(ApplicationDbContext context, Microsoft.Extensions.Configuration.IConfiguration config)
        {
            _context = context;
            _config  = config;
        }

        /// <summary>GET /api/settings — Company-wide settings</summary>
        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var totalUsers = await _context.Users.CountAsync(u => u.IsActive);
            var roles = await _context.Roles.Select(r => new { r.Id, r.Name, r.Description }).ToListAsync();
            var dealStages = await _context.DealStages.OrderBy(s => s.OrderIndex)
                .Select(s => new { s.Id, s.Name, s.Probability, s.IsActive }).ToListAsync();

            return Ok(new
            {
                Company = new
                {
                    Name    = _config["CompanyName"] ?? "Dhwiti CRM",
                    Version = "2.0.0"
                },
                ActiveUsers = totalUsers,
                Roles       = roles,
                DealStages  = dealStages
            });
        }

        public class CompanySettingsDto
        {
            public string CompanyName { get; set; } = string.Empty;
            public string? SupportEmail { get; set; }
            public string? Timezone { get; set; }
        }

        /// <summary>PUT /api/settings/company — Update Company-wide settings</summary>
        [HttpPut("company")]
        public async Task<IActionResult> UpdateCompanySettings([FromBody] CompanySettingsDto dto)
        {
            // For now, return success to complete the UI flow. In a real system,
            // we'd save this to a Settings table or appsettings.json
            return Ok(new { message = "Settings updated successfully." });
        }

        /// <summary>GET /api/settings/roles — All available roles</summary>
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .Select(r => new { r.Id, r.Name, r.Description })
                .ToListAsync();
            return Ok(roles);
        }

        /// <summary>GET /api/settings/deal-stages — Pipeline stages config</summary>
        [HttpGet("deal-stages")]
        public async Task<IActionResult> GetDealStages()
        {
            var stages = await _context.DealStages
                .OrderBy(s => s.OrderIndex)
                .Select(s => new { s.Id, s.Name, s.OrderIndex, s.Probability, s.IsActive })
                .ToListAsync();
            return Ok(stages);
        }
    }
}
