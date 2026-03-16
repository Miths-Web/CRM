using CRM.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LiveChatController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public LiveChatController(ApplicationDbContext db)
        {
            _db = db;
        }

        // ══════════════ VISITOR ENDPOINTS (No auth needed) ══════════════════

        /// <summary>GET /api/livechat/widget-config — Widget configuration for frontend</summary>
        [HttpGet("widget-config")]
        public IActionResult GetWidgetConfig()
        {
            // This config is embedded in the website chat widget
            return Ok(new
            {
                CompanyName    = "Dhwiti CRM",
                WelcomeMessage = "Hi! How can we help you today?",
                OfflineMessage = "We're currently offline. Leave us a message!",
                PrimaryColor   = "#6366f1",
                Position       = "bottom-right",
                HubUrl         = "/hubs/livechat"
            });
        }

        // ══════════════ AGENT ENDPOINTS (Auth required) ══════════════════════

        /// <summary>GET /api/livechat/sessions — All sessions (Agents: Admin, Manager, Sales Rep, Support Agent)</summary>
        [HttpGet("sessions")]
        [Authorize(Roles = "Admin,Manager,Sales Rep,Support Agent")]
        public async Task<IActionResult> GetSessions([FromQuery] string? status = null)
        {
            var query = _db.LiveChatSessions
                .Include(s => s.AssignedAgent)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(s => s.Status == status);

            var sessions = await query
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    s.Id, s.VisitorName, s.VisitorEmail,
                    s.Subject, s.Status, s.CreatedAt, s.AcceptedAt, s.ClosedAt,
                    AgentName    = s.AssignedAgent != null ? $"{s.AssignedAgent.FirstName} {s.AssignedAgent.LastName}" : null,
                    s.Rating, s.RatingComment
                })
                .ToListAsync();

            return Ok(sessions);
        }

        /// <summary>GET /api/livechat/sessions/{id}/messages — Session messages (all agents)</summary>
        [HttpGet("sessions/{id:guid}/messages")]
        [Authorize(Roles = "Admin,Manager,Sales Rep,Support Agent")]
        public async Task<IActionResult> GetSessionMessages(Guid id)
        {
            var session = await _db.LiveChatSessions.FindAsync(id);
            if (session == null) return NotFound();

            var messages = await _db.LiveChatMessages
                .Include(m => m.Agent)
                .Where(m => m.SessionId == id)
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    m.SenderType,
                    SenderName = m.SenderType == "Agent" && m.Agent != null
                        ? $"{m.Agent.FirstName} {m.Agent.LastName}"
                        : m.SenderType == "Visitor" ? session.VisitorName : "System",
                    m.SentAt,
                    m.IsRead
                })
                .ToListAsync();

            return Ok(new { session = new { session.Id, session.VisitorName, session.Status }, messages });
        }

        /// <summary>POST /api/livechat/sessions/{id}/convert-to-customer — Convert visitor to CRM Customer (Admin, Manager, Sales Rep)</summary>
        [HttpPost("sessions/{id:guid}/convert-to-customer")]
        [Authorize(Roles = "Admin,Manager,Sales Rep")]
        public async Task<IActionResult> ConvertToCustomer(Guid id)
        {
            var session = await _db.LiveChatSessions.FindAsync(id);
            if (session == null) return NotFound();
            if (session.CreatedCustomerId.HasValue)
                return BadRequest(new { message = "Already converted to customer." });

            var hostIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            Guid.TryParse(hostIdStr, out var currentUserId);

            var company = new Domain.Entities.CompanyMaster
            {
                CompanyName = $"{session.VisitorName} Company",
                Email       = session.VisitorEmail,
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = DateTime.UtcNow,
                CreatedBy   = currentUserId
            };
            _db.Companies.Add(company);
            await _db.SaveChangesAsync();

            var customer = new Domain.Entities.CustomerMaster
            {
                CompanyId   = company.Id,
                FirstName   = session.VisitorName.Split(' ').FirstOrDefault() ?? session.VisitorName,
                LastName    = session.VisitorName.Contains(' ')
                                ? string.Join(' ', session.VisitorName.Split(' ').Skip(1)) : "",
                Email       = session.VisitorEmail,
                PhoneNo     = session.VisitorPhone,
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = DateTime.UtcNow,
                CreatedBy   = currentUserId
            };
            _db.Customers.Add(customer);

            session.CreatedCustomerId = customer.Id;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message    = "Visitor converted to CRM Customer!",
                customerId = customer.Id,
                companyId  = company.Id,
                customer.FirstName, customer.LastName, customer.Email
            });
        }

        /// <summary>GET /api/livechat/stats — Live chat statistics (Admin & Manager)</summary>
        [HttpGet("stats")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetStats()
        {
            var stats = new
            {
                TotalSessions    = await _db.LiveChatSessions.CountAsync(),
                WaitingSessions  = await _db.LiveChatSessions.CountAsync(s => s.Status == "Waiting"),
                ActiveSessions   = await _db.LiveChatSessions.CountAsync(s => s.Status == "Active"),
                ClosedToday      = await _db.LiveChatSessions.CountAsync(s => s.Status == "Closed" && s.ClosedAt >= DateTime.Today),
                AverageRating    = await _db.LiveChatSessions.Where(s => s.Rating > 0).AverageAsync(s => (double?)s.Rating) ?? 0,
                ConvertedLeads   = await _db.LiveChatSessions.CountAsync(s => s.CreatedCustomerId != null)
            };
            return Ok(stats);
        }
    }
}
