using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Tickets.DTOs;
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
    public class TicketsController : ControllerBase
    {
        private readonly ITicketService _ticketService;

        public TicketsController(ITicketService ticketService)
        {
            _ticketService = ticketService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 100)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid.TryParse(userIdStr, out var userId);

            if (User.IsInRole("Admin") || User.IsInRole("Manager") || User.IsInRole("Support Agent"))
            {
                var allTickets = await _ticketService.GetPagedTicketsAsync(pageNumber, pageSize);
                return Ok(allTickets);
            }

            var myTickets = await _ticketService.GetPagedTicketsByUserAsync(userId, pageNumber, pageSize);
            return Ok(myTickets);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var ticket = await _ticketService.GetTicketByIdAsync(id);
            if (ticket == null) return NotFound();

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid.TryParse(userIdStr, out var userId);

            if (!User.IsInRole("Admin") && !User.IsInRole("Manager") && !User.IsInRole("Support Agent"))
            {
                if (ticket.AssignedToUserId != userId && ticket.CreatedByUserId != userId)
                    return Forbid();
            }

            return Ok(ticket);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTicketDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var createdTicket = await _ticketService.CreateTicketAsync(model, userId);
            return CreatedAtAction(nameof(GetById), new { id = createdTicket.Id }, createdTicket);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTicketDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var ticket = await _ticketService.GetTicketByIdAsync(id);
            if (ticket == null) return NotFound();

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            if (!User.IsInRole("Admin") && !User.IsInRole("Manager") && !User.IsInRole("Support Agent"))
            {
                if (ticket.AssignedToUserId != userId && ticket.CreatedByUserId != userId)
                    return Forbid();
            }

            await _ticketService.UpdateTicketAsync(id, model, userId);
            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _ticketService.DeleteTicketAsync(id);
            return NoContent();
        }

        [HttpPost("{id:guid}/comments")]
        public async Task<IActionResult> AddComment(Guid id, [FromBody] CreateTicketCommentDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var ticket = await _ticketService.GetTicketByIdAsync(id);
            if (ticket == null) return NotFound();

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            if (!User.IsInRole("Admin") && !User.IsInRole("Manager") && !User.IsInRole("Support Agent"))
            {
                if (ticket.AssignedToUserId != userId && ticket.CreatedByUserId != userId)
                    return Forbid();
                model.IsInternal = false; // Normal users cannot make internal comments
            }

            var comment = await _ticketService.AddCommentAsync(id, model, userId);
            return Ok(comment);
        }
    }
}
