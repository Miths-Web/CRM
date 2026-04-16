using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Emails.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EmailsController : ControllerBase
    {
        private readonly IEmailService _emailService;

        public EmailsController(IEmailService emailService)
        {
            _emailService = emailService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var emails = await _emailService.GetPagedEmailsAsync(pageNumber, pageSize);
            return Ok(emails);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var email = await _emailService.GetEmailByIdAsync(id);
            if (email == null) return NotFound();
            return Ok(email);
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> SendEmail([FromBody] CreateEmailDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var createdEmail = await _emailService.SendEmailAsync(model);
                return CreatedAtAction(nameof(GetById), new { id = createdEmail.Id }, createdEmail);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await _emailService.DeleteEmailAsync(id);
            if (!success) return NotFound(new { Message = "Email not found." });
            return NoContent();
        }

        [HttpPatch("{id:guid}/star")]
        public async Task<IActionResult> ToggleStar(Guid id)
        {
            var email = await _emailService.ToggleStarAsync(id);
            if (email == null) return NotFound();
            return Ok(email);
        }

        [HttpPatch("{id:guid}/archive")]
        public async Task<IActionResult> Archive(Guid id)
        {
            var email = await _emailService.ArchiveEmailAsync(id);
            if (email == null) return NotFound();
            return Ok(email);
        }
    }
}
