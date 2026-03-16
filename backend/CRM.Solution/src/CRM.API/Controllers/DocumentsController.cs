using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Documents.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DocumentsController : ControllerBase
    {
        private readonly IDocumentService _documentService;

        public DocumentsController(IDocumentService documentService)
        {
            _documentService = documentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var docs = await _documentService.GetPagedDocumentsAsync(pageNumber, pageSize);
            return Ok(docs);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var doc = await _documentService.GetDocumentByIdAsync(id);
            if (doc == null) return NotFound();
            return Ok(doc);
        }

        // Normally we use [FromForm] and IFormFile, but for simplified DTO, relying on JSON for now.
        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromBody] UploadDocumentDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var uploadedDoc = await _documentService.UploadDocumentAsync(model);
                return CreatedAtAction(nameof(GetById), new { id = uploadedDoc.Id }, uploadedDoc);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                await _documentService.DeleteDocumentAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }
}
