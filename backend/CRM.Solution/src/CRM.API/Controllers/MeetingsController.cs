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
    [Authorize]
    public class MeetingsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        // Jitsi server — free public server, no API key needed!
        private const string JitsiServer = "https://meet.jit.si";

        public MeetingsController(ApplicationDbContext db)
        {
            _db = db;
        }

        /// <summary>POST /api/meetings — Create a new Jitsi meeting room</summary>
        [HttpPost]
        public async Task<IActionResult> CreateMeeting([FromBody] CreateMeetingDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var hostIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            Guid.TryParse(hostIdStr, out var hostId);

            // Generate unique, human-readable room code
            var companyPrefix = "DhwitiCRM";
            var roomCode = $"{companyPrefix}-{dto.Title.Replace(" ", "-").ToLower()}-{Guid.NewGuid().ToString("N")[..8]}";

            // Jitsi URL — no API key, just append room name!
            var jitsiUrl = $"{JitsiServer}/{roomCode}";

            var meeting = new Domain.Entities.MeetingRoom
            {
                Title            = dto.Title,
                RoomCode         = roomCode,
                JitsiUrl         = jitsiUrl,
                Password         = dto.Password,
                ScheduledAt      = dto.ScheduledAt,
                DurationMinutes  = dto.DurationMinutes,
                Description      = dto.Description,
                HostUserId       = hostId,
                RelatedCustomerId = dto.RelatedCustomerId,
                RelatedDealId    = dto.RelatedDealId,
                Status           = "Scheduled",
                CreatedAt        = DateTime.UtcNow,
                UpdatedAt        = DateTime.UtcNow
            };

            _db.MeetingRooms.Add(meeting);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = meeting.Id,
                title = meeting.Title,
                jitsiRoomName = meeting.RoomCode,
                startTime = meeting.ScheduledAt,
                endTime = meeting.ScheduledAt.AddMinutes(meeting.DurationMinutes),
                status = meeting.Status,
                description = meeting.Description,
                hostUserId = meeting.HostUserId,
                contactId = meeting.RelatedCustomerId,
                dealId = meeting.RelatedDealId,
                createdAt = meeting.CreatedAt,

                MeetingUrl       = jitsiUrl,
                HostLink         = $"{jitsiUrl}#config.startWithVideoMuted=false",
                GuestLink        = jitsiUrl,
                CalendarLink     = $"https://calendar.google.com/calendar/render?action=TEMPLATE&text={Uri.EscapeDataString(dto.Title)}&details={Uri.EscapeDataString($"Join: {jitsiUrl}")}&dates={dto.ScheduledAt:yyyyMMddTHHmmssZ}"
            });
        }

        /// <summary>GET /api/meetings — List all meetings (optionally upcoming only)</summary>
        [HttpGet]
        public async Task<IActionResult> GetMeetings([FromQuery] bool upcomingOnly = false)
        {
            var query = _db.MeetingRooms
                .Include(m => m.HostUser)
                .Include(m => m.RelatedCustomer)
                .Include(m => m.RelatedDeal)
                .AsQueryable();

            if (upcomingOnly)
                query = query.Where(m => m.ScheduledAt > DateTime.UtcNow && m.Status != "Ended");

            var meetings = await query
                .OrderByDescending(m => m.ScheduledAt)
                .Select(m => new
                {
                    id = m.Id, 
                    title = m.Title, 
                    jitsiRoomName = m.RoomCode,
                    startTime = m.ScheduledAt, 
                    endTime = m.ScheduledAt.AddMinutes(m.DurationMinutes),
                    status = m.Status,
                    description = m.Description,
                    hostUserId = m.HostUserId,
                    hostName     = m.HostUser != null ? $"{m.HostUser.FirstName} {m.HostUser.LastName}" : null,
                    contactId = m.RelatedCustomerId,
                    dealId = m.RelatedDealId,
                    createdAt = m.CreatedAt,
                    HasPassword  = m.Password != null
                })
                .ToListAsync();

            return Ok(meetings);
        }

        /// <summary>GET /api/meetings/{id} — Get single meeting with full details</summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var meeting = await _db.MeetingRooms
                .Include(m => m.HostUser)
                .Include(m => m.RelatedCustomer)
                .Include(m => m.RelatedDeal)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (meeting == null) return NotFound(new { message = "Meeting not found." });

            return Ok(new
            {
                id = meeting.Id, 
                title = meeting.Title, 
                jitsiRoomName = meeting.RoomCode,
                startTime = meeting.ScheduledAt, 
                endTime = meeting.ScheduledAt.AddMinutes(meeting.DurationMinutes),
                status = meeting.Status,
                description = meeting.Description,
                hostUserId = meeting.HostUserId,
                hostName     = meeting.HostUser != null ? $"{meeting.HostUser.FirstName} {meeting.HostUser.LastName}" : null,
                contactId = meeting.RelatedCustomerId,
                dealId = meeting.RelatedDealId,
                createdAt = meeting.CreatedAt,

                meeting.JitsiUrl, meeting.Password, meeting.RecordingUrl,
                // Share-ready links
                JoinLink     = meeting.JitsiUrl,
                GoogleCalendar = $"https://calendar.google.com/calendar/render?action=TEMPLATE&text={Uri.EscapeDataString(meeting.Title)}&details=Join+Meeting:+{Uri.EscapeDataString(meeting.JitsiUrl)}"
            });
        }

        /// <summary>PATCH /api/meetings/{id}/start — Mark meeting as Active</summary>
        [HttpPatch("{id:guid}/start")]
        public async Task<IActionResult> StartMeeting(Guid id)
        {
            var meeting = await _db.MeetingRooms.FindAsync(id);
            if (meeting == null) return NotFound();
            meeting.Status    = "Active";
            meeting.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Meeting started.", joinUrl = meeting.JitsiUrl });
        }

        /// <summary>PATCH /api/meetings/{id}/end — Mark meeting as Ended</summary>
        [HttpPatch("{id:guid}/end")]
        public async Task<IActionResult> EndMeeting(Guid id)
        {
            var meeting = await _db.MeetingRooms.FindAsync(id);
            if (meeting == null) return NotFound();
            meeting.Status    = "Ended";
            meeting.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Meeting ended." });
        }

        /// <summary>DELETE /api/meetings/{id} — Cancel a meeting</summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var meeting = await _db.MeetingRooms.FindAsync(id);
            if (meeting == null) return NotFound();
            _db.MeetingRooms.Remove(meeting);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }

    public class CreateMeetingDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Password { get; set; }
        public DateTime ScheduledAt { get; set; }
        public int DurationMinutes { get; set; } = 60;
        public string? Description { get; set; }
        public Guid? RelatedCustomerId { get; set; }
        public Guid? RelatedDealId { get; set; }
    }
}
