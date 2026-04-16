using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Quotes.DTOs;
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
    public class QuotesController : ControllerBase
    {
        private readonly IQuoteService _quoteService;

        public QuotesController(IQuoteService quoteService)
        {
            _quoteService = quoteService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid.TryParse(userIdStr, out var userId);

            // Admins & Managers see all quotes
            if (User.IsInRole("Admin") || User.IsInRole("Manager"))
            {
                var allQuotes = await _quoteService.GetPagedQuotesAsync(pageNumber, pageSize);
                return Ok(allQuotes);
            }

            // Sales Reps see their own assigned quotes
            if (User.IsInRole("Sales Rep"))
            {
                if (userId == Guid.Empty) return Unauthorized();
                var myQuotes = await _quoteService.GetPagedQuotesByUserAsync(userId, pageNumber, pageSize);
                return Ok(myQuotes);
            }

            return Ok(Array.Empty<object>());
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var quote = await _quoteService.GetQuoteByIdAsync(id);
            if (quote == null) return NotFound();

            if (User.IsInRole("Sales Rep"))
            {
                var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
                Guid.TryParse(userIdStr, out var userId);
                if (quote.AssignedToUserId != userId) 
                    return Forbid();
            }

            return Ok(quote);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateQuoteDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var createdQuote = await _quoteService.CreateQuoteAsync(model, userId);
            return CreatedAtAction(nameof(GetById), new { id = createdQuote.Id }, createdQuote);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateQuoteDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            if (User.IsInRole("Sales Rep"))
            {
                var existingQuote = await _quoteService.GetQuoteByIdAsync(id);
                if (existingQuote == null) return NotFound();
                if (existingQuote.AssignedToUserId != userId) return Forbid();
            }

            try
            {
                await _quoteService.UpdateQuoteAsync(id, model, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPatch("{id:guid}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateQuoteStatusDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            if (User.IsInRole("Sales Rep"))
            {
                var existingQuote = await _quoteService.GetQuoteByIdAsync(id);
                if (existingQuote == null) return NotFound();
                if (existingQuote.AssignedToUserId != userId) return Forbid();
            }

            try
            {
                await _quoteService.UpdateQuoteStatusAsync(id, model.Status, userId);
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
            await _quoteService.DeleteQuoteAsync(id);
            return NoContent();
        }

        [HttpPost("{id:guid}/generate-order")]
        [Authorize(Roles = "Admin,Manager,Sales Rep")]
        public async Task<IActionResult> GenerateOrder(Guid id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            if (User.IsInRole("Sales Rep"))
            {
                var existingQuote = await _quoteService.GetQuoteByIdAsync(id);
                if (existingQuote == null) return NotFound();
                if (existingQuote.AssignedToUserId != userId) return Forbid();
            }

            try
            {
                await _quoteService.GenerateOrderFromQuoteAsync(id, userId);
                return Ok(new { Message = "Order generated successfully from Quote." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }
}
