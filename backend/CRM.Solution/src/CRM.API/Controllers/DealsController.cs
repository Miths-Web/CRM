using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Deals.DTOs;
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
    public class DealsController : ControllerBase
    {
        private readonly IDealService _dealService;

        public DealsController(IDealService dealService)
        {
            _dealService = dealService;
        }

        /// <summary>
        /// GET /api/deals — Role-aware:
        /// Admin/Manager = sabke deals | Sales Rep = sirf apne assigned deals
        /// Issue #3 FIX: Permission matrix enforce kiya
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid.TryParse(userIdStr, out var userId);

            // Admin aur Manager sabke deals dekh sakte hain
            if (User.IsInRole("Admin") || User.IsInRole("Manager"))
            {
                var allDeals = await _dealService.GetPagedDealsAsync(pageNumber, pageSize);
                return Ok(allDeals);
            }

            // Sales Rep sirf apne assigned deals dekhe
            if (User.IsInRole("Sales Rep"))
            {
                if (userId == Guid.Empty) return Unauthorized();
                var myDeals = await _dealService.GetPagedDealsByUserAsync(userId, pageNumber, pageSize);
                return Ok(myDeals);
            }

            return Ok(Array.Empty<object>());
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var deal = await _dealService.GetDealByIdAsync(id);
            if (deal == null) return NotFound();

            // Sales Rep sirf apna deal dekhe
            if (User.IsInRole("Sales Rep"))
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                Guid.TryParse(userIdStr, out var userId);
                if (deal.AssignedToUserId != userId)
                    return Forbid();
            }

            return Ok(deal);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDealDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Sales Rep ka deal automatically unhe assign ho
            if (User.IsInRole("Sales Rep") && model.AssignedToUserId == null)
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (Guid.TryParse(userIdStr, out var userId))
                    model.AssignedToUserId = userId;
            }

            var createdDeal = await _dealService.CreateDealAsync(model);
            return CreatedAtAction(nameof(GetById), new { id = createdDeal.Id }, createdDeal);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateDealDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Sales Rep sirf apna deal update kare
            if (User.IsInRole("Sales Rep"))
            {
                var existing = await _dealService.GetDealByIdAsync(id);
                if (existing == null) return NotFound();
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                Guid.TryParse(userIdStr, out var userId);
                if (existing.AssignedToUserId != userId)
                    return Forbid();
            }

            try
            {
                await _dealService.UpdateDealAsync(id, model);
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
            await _dealService.DeleteDealAsync(id);
            return NoContent();
        }

        [HttpPut("{id:guid}/stage")]
        public async Task<IActionResult> UpdateStage(Guid id, [FromBody] int stageId)
        {
            try
            {
                await _dealService.UpdateDealStageAsync(id, stageId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("stages")]
        public async Task<IActionResult> GetDealStages()
        {
            var stages = await _dealService.GetAllDealStagesAsync();
            return Ok(stages);
        }
    }
}
