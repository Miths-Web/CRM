using CRM.Application.Common.Interfaces;
using CRM.Application.Features.KnowledgeBase.DTOs;
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
    public class KnowledgeBaseController : ControllerBase
    {
        private readonly IKnowledgeBaseService _kbService;

        public KnowledgeBaseController(IKnowledgeBaseService kbService)
        {
            _kbService = kbService;
        }

        // --- Categories ---
        [HttpGet("categories")]
        [AllowAnonymous] // Anyone can see categories for KB
        public async Task<IActionResult> GetCategories()
        {
            return Ok(await _kbService.GetAllCategoriesAsync());
        }

        [HttpPost("categories")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateArticleCategoryDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _kbService.CreateCategoryAsync(model);
            return Ok(result);
        }

        [HttpPut("categories/{id:guid}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateArticleCategoryDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            await _kbService.UpdateCategoryAsync(id, model);
            return NoContent();
        }

        [HttpDelete("categories/{id:guid}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteCategory(Guid id)
        {
            await _kbService.DeleteCategoryAsync(id);
            return NoContent();
        }

        // --- Articles ---
        [HttpGet("articles")]
        [AllowAnonymous]
        public async Task<IActionResult> GetArticles([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 100)
        {
            bool isStaff = User.Identity?.IsAuthenticated == true && 
                (User.IsInRole("Admin") || User.IsInRole("Manager") || User.IsInRole("Support Agent") || User.IsInRole("Sales Rep"));
            
            // If internal staff, show all articles. If public/customer, show only published.
            var articles = await _kbService.GetPagedArticlesAsync(pageNumber, pageSize, publicOnly: !isStaff);
            return Ok(articles);
        }

        [HttpGet("articles/{id:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetArticleById(Guid id)
        {
            var article = await _kbService.GetArticleByIdAsync(id);
            if (article == null) return NotFound();

            bool isStaff = User.Identity?.IsAuthenticated == true && 
                (User.IsInRole("Admin") || User.IsInRole("Manager") || User.IsInRole("Support Agent") || User.IsInRole("Sales Rep"));

            if (!article.IsPublished && !isStaff)
                return Forbid();

            // Fire and forget view count increment
            _ = _kbService.IncrementViewCountAsync(id);

            return Ok(article);
        }

        [HttpPost("articles")]
        [Authorize(Roles = "Admin,Manager,Support Agent")]
        public async Task<IActionResult> CreateArticle([FromBody] CreateArticleDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var created = await _kbService.CreateArticleAsync(model, userId);
            return CreatedAtAction(nameof(GetArticleById), new { id = created.Id }, created);
        }

        [HttpPut("articles/{id:guid}")]
        [Authorize(Roles = "Admin,Manager,Support Agent")]
        public async Task<IActionResult> UpdateArticle(Guid id, [FromBody] UpdateArticleDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            await _kbService.UpdateArticleAsync(id, model, userId);
            return NoContent();
        }

        [HttpDelete("articles/{id:guid}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteArticle(Guid id)
        {
            await _kbService.DeleteArticleAsync(id);
            return NoContent();
        }
    }
}
