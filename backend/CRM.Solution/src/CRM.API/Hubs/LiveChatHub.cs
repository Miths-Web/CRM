using CRM.Infrastructure.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CRM.API.Hubs
{
    /// <summary>
    /// FEATURE 3: Live Client Chat Hub
    /// Endpoint: /hubs/livechat
    /// 
    /// How it works:
    ///   Visitor Side  → starts session → sends messages
    ///   Agent Side    → sees incoming sessions → accepts → replies
    ///   Both sides communicate in real-time via SignalR
    /// </summary>
    public class LiveChatHub : Hub
    {
        private readonly ApplicationDbContext _db;

        public LiveChatHub(ApplicationDbContext db)
        {
            _db = db;
        }

        // ═══════════════════════ VISITOR METHODS ═══════════════════════════

        /// <summary>Visitor starts a new chat session from website widget</summary>
        public async Task StartSession(string visitorName, string? visitorEmail, string? subject)
        {
            var token = $"visitor_{Guid.NewGuid():N}";

            var session = new Domain.Entities.LiveChatSession
            {
                VisitorName   = visitorName,
                VisitorEmail  = visitorEmail,
                Subject       = subject ?? "General Inquiry",
                SessionToken  = token,
                Status        = "Waiting",
                CreatedAt     = DateTime.UtcNow,
                UpdatedAt     = DateTime.UtcNow
            };
            _db.LiveChatSessions.Add(session);
            await _db.SaveChangesAsync();

            // Join session room
            await Groups.AddToGroupAsync(Context.ConnectionId, $"session_{session.Id}");

            // Notify all available agents
            await Clients.Group("agents").SendAsync("NewChatSession", new
            {
                sessionId    = session.Id,
                visitorName,
                visitorEmail,
                subject      = session.Subject,
                startedAt    = session.CreatedAt
            });

            // Confirm to visitor
            await Clients.Caller.SendAsync("SessionStarted", new
            {
                sessionId    = session.Id,
                sessionToken = token,
                message      = "Thank you! An agent will join you shortly."
            });
        }

        /// <summary>Visitor sends a message</summary>
        public async Task VisitorSendMessage(Guid sessionId, string token, string content)
        {
            var session = await _db.LiveChatSessions.FindAsync(sessionId);
            if (session == null || session.SessionToken != token) return;

            var msg = new Domain.Entities.LiveChatMessage
            {
                SessionId  = sessionId,
                SenderType = "Visitor",
                Content    = content,
                SentAt     = DateTime.UtcNow
            };
            _db.LiveChatMessages.Add(msg);
            await _db.SaveChangesAsync();

            await Clients.Group($"session_{sessionId}").SendAsync("ReceiveLiveMessage", new
            {
                id         = msg.Id,
                senderType = "Visitor",
                senderName = session.VisitorName,
                content,
                sentAt     = msg.SentAt
            });
        }

        // ═══════════════════════ AGENT METHODS ═════════════════════════════

        /// <summary>Agent joins the agents group to receive session notifications</summary>
        public async Task AgentConnect()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "agents");

            // Send all waiting sessions to the newly connected agent
            var waiting = await _db.LiveChatSessions
                .Where(s => s.Status == "Waiting")
                .Select(s => new
                {
                    s.Id, s.VisitorName, s.VisitorEmail,
                    s.Subject, s.CreatedAt, s.Status
                })
                .ToListAsync();

            await Clients.Caller.SendAsync("WaitingSessions", waiting);
        }

        /// <summary>Agent accepts a chat session</summary>
        public async Task AcceptSession(Guid sessionId)
        {
            var agentIdStr = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                          ?? Context.User?.FindFirstValue("sub");
            if (!Guid.TryParse(agentIdStr, out var agentId)) return;

            var session = await _db.LiveChatSessions
                .Include(s => s.AssignedAgent)
                .FirstOrDefaultAsync(s => s.Id == sessionId);
            if (session == null || session.Status != "Waiting") return;

            var agent = await _db.Users.FindAsync(agentId);
            if (agent == null) return;

            session.Status          = "Active";
            session.AssignedAgentId = agentId;
            session.AcceptedAt      = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            // Agent joins session room
            await Groups.AddToGroupAsync(Context.ConnectionId, $"session_{sessionId}");

            // System message to visitor
            await Clients.Group($"session_{sessionId}").SendAsync("ReceiveLiveMessage", new
            {
                senderType = "System",
                content    = $"{agent.FirstName} {agent.LastName} has joined the chat.",
                sentAt     = DateTime.UtcNow
            });

            // Notify other agents session is taken
            await Clients.Group("agents").SendAsync("SessionAccepted", new { sessionId, agentId });
        }

        /// <summary>Agent sends a message</summary>
        public async Task AgentSendMessage(Guid sessionId, string content)
        {
            var agentIdStr = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                          ?? Context.User?.FindFirstValue("sub");
            if (!Guid.TryParse(agentIdStr, out var agentId)) return;

            var agent = await _db.Users.FindAsync(agentId);
            if (agent == null) return;

            var msg = new Domain.Entities.LiveChatMessage
            {
                SessionId  = sessionId,
                SenderType = "Agent",
                AgentId    = agentId,
                Content    = content,
                SentAt     = DateTime.UtcNow
            };
            _db.LiveChatMessages.Add(msg);
            await _db.SaveChangesAsync();

            await Clients.Group($"session_{sessionId}").SendAsync("ReceiveLiveMessage", new
            {
                id         = msg.Id,
                senderType = "Agent",
                senderName = $"{agent.FirstName} {agent.LastName}",
                content,
                sentAt     = msg.SentAt
            });
        }

        /// <summary>Close a session (agent or visitor can close)</summary>
        public async Task CloseSession(Guid sessionId)
        {
            var session = await _db.LiveChatSessions.FindAsync(sessionId);
            if (session == null) return;

            session.Status   = "Closed";
            session.ClosedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await Clients.Group($"session_{sessionId}").SendAsync("SessionClosed", new
            {
                sessionId,
                closedAt = session.ClosedAt,
                message  = "Chat session has ended. Thank you!"
            });
        }

        /// <summary>Visitor submits a satisfaction rating (1-5)</summary>
        public async Task RateSession(Guid sessionId, string token, int rating, string? comment)
        {
            var session = await _db.LiveChatSessions.FindAsync(sessionId);
            if (session == null || session.SessionToken != token) return;

            session.Rating        = Math.Clamp(rating, 1, 5);
            session.RatingComment  = comment;
            await _db.SaveChangesAsync();

            await Clients.Caller.SendAsync("RatingSubmitted", new { message = "Thank you for your feedback!" });
        }
    }
}
