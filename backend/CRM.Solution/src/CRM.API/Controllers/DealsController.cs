using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Deals.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
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

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var deals = await _dealService.GetPagedDealsAsync(pageNumber, pageSize);
            return Ok(deals);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var deal = await _dealService.GetDealByIdAsync(id);
            if (deal == null) return NotFound();
            return Ok(deal);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDealDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var createdDeal = await _dealService.CreateDealAsync(model);
            return CreatedAtAction(nameof(GetById), new { id = createdDeal.Id }, createdDeal);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateDealDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

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
