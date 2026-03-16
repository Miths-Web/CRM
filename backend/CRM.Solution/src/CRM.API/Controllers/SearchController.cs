using CRM.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SearchController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET /api/search?q=john&types=contacts,leads,deals
        /// Global full-text search across all CRM entities.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GlobalSearch(
            [FromQuery] string q,
            [FromQuery] string? types = null,
            [FromQuery] int limit = 10)
        {
            if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
                return BadRequest(new { message = "Search query must be at least 2 characters." });

            q = q.Trim().ToLower();
            var searchTypes = types?.Split(',').Select(t => t.Trim().ToLower()).ToHashSet()
                           ?? new HashSet<string> { "contacts", "leads", "deals", "tasks" };

            var results = new
            {
                Query   = q,
                Contacts = searchTypes.Contains("contacts") ? await _context.Customers
                    .Where(c => !c.IsDelete &&
                               (c.FirstName.ToLower().Contains(q) ||
                                (c.LastName != null && c.LastName.ToLower().Contains(q)) ||
                                (c.Email != null && c.Email.ToLower().Contains(q))))
                    .Take(limit)
                    .Select(c => new { c.Id, Name = c.FirstName + " " + c.LastName, c.Email, Type = "Customer" })
                    .ToListAsync() : null,

                Leads = searchTypes.Contains("leads") ? await _context.Leads
                    .Where(l => l.Title.ToLower().Contains(q) ||
                                (l.FirstName != null && l.FirstName.ToLower().Contains(q)) ||
                                (l.LastName  != null && l.LastName.ToLower().Contains(q)) ||
                                (l.Company   != null && l.Company.ToLower().Contains(q)))
                    .Take(limit)
                    .Select(l => new { l.Id, l.Title, Name = l.FirstName + " " + l.LastName, l.Company, Status = l.Status.ToString(), Type = "Lead" })
                    .ToListAsync() : null,

                Deals = searchTypes.Contains("deals") ? await _context.Deals
                    .Where(d => d.Title.ToLower().Contains(q))
                    .Take(limit)
                    .Select(d => new { d.Id, d.Title, d.Value, Status = d.Status.ToString(), Type = "Deal" })
                    .ToListAsync() : null,

                Tasks = searchTypes.Contains("tasks") ? await _context.CrmTasks
                    .Where(t => t.Title.ToLower().Contains(q) ||
                                (t.Description != null && t.Description.ToLower().Contains(q)))
                    .Take(limit)
                    .Select(t => new { t.Id, t.Title, Status = t.Status.ToString(), t.DueDate, Type = "Task" })
                    .ToListAsync() : null,

                Notes = searchTypes.Contains("notes") ? await _context.Notes
                    .Where(n => n.Title.ToLower().Contains(q) ||
                                n.Content.ToLower().Contains(q))
                    .Take(limit)
                    .Select(n => new { n.Id, n.Title, n.IsPinned, Type = "Note" })
                    .ToListAsync() : null
            };

            return Ok(results);
        }
    }
}
