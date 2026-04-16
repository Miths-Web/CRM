using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Leads.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using CRM.API.Attributes;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LeadsController : ControllerBase
    {
        private readonly ILeadService _leadService;

        public LeadsController(ILeadService leadService)
        {
            _leadService = leadService;
        }

        /// <summary>
        /// GET /api/leads — Role-aware:
        /// Admin/Manager = sabke leads | Sales Rep = sirf apne assigned leads | Support/Viewer = empty list
        /// Issue #3 FIX: Permission matrix enforce kiya
        /// </summary>
        [HttpGet]
        [HasPermission("Leads", "Read")]
        public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid.TryParse(userIdStr, out var userId);

            // Admin aur Manager sabke leads dekh sakte hain
            if (User.IsInRole("Admin") || User.IsInRole("Manager"))
            {
                var allLeads = await _leadService.GetPagedLeadsAsync(pageNumber, pageSize);
                return Ok(allLeads);
            }

            // Sales Rep sirf apne assigned leads dekhe
            if (User.IsInRole("Sales Rep"))
            {
                if (userId == Guid.Empty) return Unauthorized();
                var myLeads = await _leadService.GetPagedLeadsByUserAsync(userId, pageNumber, pageSize);
                return Ok(myLeads);
            }

            // Support Agent aur Viewer ke liye leads nahi (pehle se route guard hai, extra safety)
            return Ok(Array.Empty<object>());
        }

        [HttpGet("{id:guid}")]
        [HasPermission("Leads", "Read")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var lead = await _leadService.GetLeadByIdAsync(id);
            if (lead == null) return NotFound();

            // Sales Rep sirf apna lead dekhe
            if (User.IsInRole("Sales Rep"))
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                Guid.TryParse(userIdStr, out var userId);
                if (lead.AssignedToUserId != userId)
                    return Forbid();
            }

            return Ok(lead);
        }

        [HttpPost]
        [HasPermission("Leads", "Create")]
        public async Task<IActionResult> Create([FromBody] CreateLeadDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Sales Rep apna userId automatically assign ho
            if (User.IsInRole("Sales Rep") && model.AssignedToUserId == null)
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (Guid.TryParse(userIdStr, out var userId))
                    model.AssignedToUserId = userId;
            }

            var createdLead = await _leadService.CreateLeadAsync(model);
            return CreatedAtAction(nameof(GetById), new { id = createdLead.Id }, createdLead);
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin,Manager,Sales Rep")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLeadDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Sales Rep sirf apna lead update kare
            if (User.IsInRole("Sales Rep") && !User.IsInRole("Admin") && !User.IsInRole("Manager"))
            {
                var existing = await _leadService.GetLeadByIdAsync(id);
                if (existing == null) return NotFound();
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                Guid.TryParse(userIdStr, out var userId);
                if (existing.AssignedToUserId != userId)
                    return Forbid();
            }

            try
            {
                await _leadService.UpdateLeadAsync(id, model);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _leadService.DeleteLeadAsync(id);
            return NoContent();
        }

        [HttpPost("{id:guid}/convert")]
        [Authorize(Roles = "Admin,Manager,Sales Rep")]
        public async Task<IActionResult> ConvertLead(Guid id)
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

                await _leadService.ConvertLeadAsync(id, userId);
                return Ok(new { Message = "Lead converted successfully to Contact." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }
}
