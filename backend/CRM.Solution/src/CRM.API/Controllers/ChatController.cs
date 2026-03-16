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
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public ChatController(ApplicationDbContext db)
        {
            _db = db;
        }

        /// <summary>GET /api/chat/history/{userId} — Get private message history with a user</summary>
        [HttpGet("history/{userId:guid}")]
        public async Task<IActionResult> GetPrivateHistory(Guid userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var myId = GetCurrentUserId();

            var messages = await _db.ChatMessages
                .Include(m => m.Sender)
                .Where(m =>
                    (m.SenderId == myId && m.ReceiverId == userId) ||
                    (m.SenderId == userId && m.ReceiverId == myId))
                .OrderByDescending(m => m.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    m.SenderId,
                    SenderName = m.Sender != null ? $"{m.Sender.FirstName} {m.Sender.LastName}" : "Unknown",
                    m.IsRead,
                    m.ReadAt,
                    m.CreatedAt,
                    IsMine = m.SenderId == myId
                })
                .ToListAsync();

            return Ok(messages.OrderBy(m => m.CreatedAt));
        }

        /// <summary>GET /api/chat/room/{roomId} — Get room message history</summary>
        [HttpGet("room/{roomId}")]
        public async Task<IActionResult> GetRoomHistory(string roomId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var myId = GetCurrentUserId();

            var messages = await _db.ChatMessages
                .Include(m => m.Sender)
                .Where(m => m.RoomId == roomId)
                .OrderByDescending(m => m.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    m.SenderId,
                    SenderName = m.Sender != null ? $"{m.Sender.FirstName} {m.Sender.LastName}" : "Unknown",
                    m.RoomId,
                    m.CreatedAt,
                    IsMine = m.SenderId == myId
                })
                .ToListAsync();

            return Ok(messages.OrderBy(m => m.CreatedAt));
        }

        /// <summary>GET /api/chat/conversations — All users I have chatted with + unread count</summary>
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var myId = GetCurrentUserId();

            var conversations = await _db.ChatMessages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.ReceiverId == myId || m.SenderId == myId)
                .Where(m => m.RoomId == null)
                .GroupBy(m => m.SenderId == myId ? m.ReceiverId : m.SenderId)
                .Select(g => new
                {
                    UserId      = g.Key,
                    LastMessage = g.OrderByDescending(m => m.CreatedAt).First().Content,
                    LastAt      = g.OrderByDescending(m => m.CreatedAt).First().CreatedAt,
                    UnreadCount = g.Count(m => m.ReceiverId == myId && !m.IsRead)
                })
                .OrderByDescending(c => c.LastAt)
                .ToListAsync();

            return Ok(conversations);
        }

        /// <summary>GET /api/chat/unread-count — Total unread messages for current user</summary>
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var myId  = GetCurrentUserId();
            var count = await _db.ChatMessages.CountAsync(m => m.ReceiverId == myId && !m.IsRead);
            return Ok(new { unreadCount = count });
        }

        private Guid GetCurrentUserId()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");
            Guid.TryParse(idStr, out var id);
            return id;
        }
    }
}
