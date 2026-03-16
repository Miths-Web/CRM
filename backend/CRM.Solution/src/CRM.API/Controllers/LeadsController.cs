using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Leads.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

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

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var leads = await _leadService.GetPagedLeadsAsync(pageNumber, pageSize);
            return Ok(leads);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var lead = await _leadService.GetLeadByIdAsync(id);
            if (lead == null) return NotFound();
            return Ok(lead);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateLeadDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var createdLead = await _leadService.CreateLeadAsync(model);
            return CreatedAtAction(nameof(GetById), new { id = createdLead.Id }, createdLead);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLeadDto model)  // BUG-011 FIX
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

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
