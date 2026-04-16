using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CRM.Application.Interfaces;
using CRM.Application.Features.Feedbacks.DTOs;
using CRM.API.Attributes;

namespace CRM.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbacksController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;

        public FeedbacksController(IFeedbackService feedbackService)
        {
            _feedbackService = feedbackService;
        }

        [HttpGet]
        [HasPermission("Feedbacks", "Read")]
        public async Task<IActionResult> GetAll()
        {
            var res = await _feedbackService.GetAllFeedbacksAsync();
            return Ok(res);
        }

        [HttpGet("{id}")]
        [HasPermission("Feedbacks", "Read")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                return Ok(await _feedbackService.GetFeedbackByIdAsync(id));
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPost]
        [HasPermission("Feedbacks", "Create")]
        public async Task<IActionResult> Create([FromBody] CreateFeedbackDto dto)
        {
            var res = await _feedbackService.CreateFeedbackAsync(dto);
            return Ok(res);
        }

        [HttpPut("{id}/status")]
        [HasPermission("Feedbacks", "Update")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateFeedbackDto dto)
        {
            try
            {
                await _feedbackService.UpdateFeedbackStatusAsync(id, dto);
                return Ok(new { message = "Feedback updated inside successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [HasPermission("Feedbacks", "Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _feedbackService.DeleteFeedbackAsync(id);
            return Ok(new { message = "Feedback deleted successfully." });
        }
    }
}
