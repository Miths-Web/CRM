using CRM.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CRM.API.Hubs
{
    /// <summary>
    /// FEATURE 1: Internal Team Chat Hub
    /// Endpoint: /hubs/chat
    /// 
    /// How it works:
    ///   - User connects → auto-joins their personal room
    ///   - SendPrivateMessage → 1-to-1 chat
    ///   - SendRoomMessage   → group chat (e.g. deal_abc, team_general)
    ///   - MarkAsRead        → read receipts
    /// </summary>
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _db;

        public ChatHub(ApplicationDbContext db)
        {
            _db = db;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            if (userId != Guid.Empty)
            {
                // Join personal room (for direct messages)
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            }
            await base.OnConnectedAsync();
        }

        /// <summary>Send a private message to another user</summary>
        public async Task SendPrivateMessage(string receiverIdStr, string content)
        {
            if (!Guid.TryParse(receiverIdStr, out var receiverId)) return;

            var senderId = GetUserId();
            var sender   = await _db.Users.FindAsync(senderId);
            if (sender == null) return;

            // Save to database
            var msg = new Domain.Entities.ChatMessage
            {
                SenderId  = senderId,
                ReceiverId = receiverId,
                Content   = content,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.ChatMessages.Add(msg);
            await _db.SaveChangesAsync();

            var payload = new
            {
                id         = msg.Id,
                senderId   = senderId,
                senderName = $"{sender.FirstName} {sender.LastName}",
                content,
                sentAt     = msg.CreatedAt,
                type       = "private"
            };

            // Deliver to receiver and sender
            await Clients.Group($"user_{receiverId}").SendAsync("ReceiveMessage", payload);
            await Clients.Caller.SendAsync("ReceiveMessage", payload);
        }

        /// <summary>Send a message to a room (e.g. deal_abc123, team_general)</summary>
        public async Task SendRoomMessage(string roomId, string content)
        {
            var senderId = GetUserId();
            var sender   = await _db.Users.FindAsync(senderId);
            if (sender == null) return;

            var msg = new Domain.Entities.ChatMessage
            {
                SenderId  = senderId,
                RoomId    = roomId,
                Content   = content,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.ChatMessages.Add(msg);
            await _db.SaveChangesAsync();

            await Clients.Group(roomId).SendAsync("ReceiveMessage", new
            {
                id         = msg.Id,
                senderId,
                senderName = $"{sender.FirstName} {sender.LastName}",
                roomId,
                content,
                sentAt     = msg.CreatedAt,
                type       = "room"
            });
        }

        /// <summary>Join a specific chat room</summary>
        public async Task JoinRoom(string roomId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            await Clients.Caller.SendAsync("JoinedRoom", roomId);
        }

        /// <summary>Leave a chat room</summary>
        public async Task LeaveRoom(string roomId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
        }

        /// <summary>Mark messages as read (shows read receipt to sender)</summary>
        public async Task MarkAsRead(string senderIdStr)
        {
            if (!Guid.TryParse(senderIdStr, out var senderId)) return;
            var myId = GetUserId();

            var unread = await _db.ChatMessages
                .Where(m => m.SenderId == senderId && m.ReceiverId == myId && !m.IsRead)
                .ToListAsync();

            foreach (var m in unread)
            {
                m.IsRead = true;
                m.ReadAt = DateTime.UtcNow;
            }
            await _db.SaveChangesAsync();

            // Notify sender that messages were read
            await Clients.Group($"user_{senderId}").SendAsync("MessagesRead", new { readBy = myId });
        }

        /// <summary>Typing indicator</summary>
        public async Task Typing(string targetIdOrRoom, bool isTyping)
        {
            var userId = GetUserId();
            await Clients.Group(targetIdOrRoom).SendAsync("UserTyping", new { userId, isTyping });
        }

        private Guid GetUserId()
        {
            var idStr = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? Context.User?.FindFirstValue("sub");
            return Guid.TryParse(idStr, out var id) ? id : Guid.Empty;
        }
    }
}
