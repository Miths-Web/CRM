using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Events.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;

        public EventsController(IEventService eventService)
        {
            _eventService = eventService;
        }

        [HttpGet]
        public async Task<IActionResult> GetEvents([FromQuery] DateTime? start, [FromQuery] DateTime? end)
        {
            var sDate = start ?? DateTime.UtcNow.AddDays(-30);
            var eDate = end ?? DateTime.UtcNow.AddDays(30);

            var events = await _eventService.GetEventsInRangeAsync(sDate, eDate);
            return Ok(events);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var evt = await _eventService.GetEventByIdAsync(id);
            if (evt == null) return NotFound();
            return Ok(evt);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEventDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var createdEvent = await _eventService.CreateEventAsync(model);
            return CreatedAtAction(nameof(GetById), new { id = createdEvent.Id }, createdEvent);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateEventDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                await _eventService.UpdateEventAsync(id, model);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _eventService.DeleteEventAsync(id);
            return NoContent();
        }

        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcoming([FromQuery] int count = 5)
        {
            var events = await _eventService.GetUpcomingEventsAsync(count);
            return Ok(events);
        }
    }
}
