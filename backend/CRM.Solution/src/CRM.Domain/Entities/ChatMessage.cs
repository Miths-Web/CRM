using CRM.Domain.Common;
using System;

namespace CRM.Domain.Entities
{
    /// <summary>Internal team-to-team chat messages</summary>
    public class ChatMessage : AuditableEntity
    {
        public Guid SenderId { get; set; }
        public Guid? ReceiverId { get; set; }       // null = group/broadcast
        public string? RoomId { get; set; }          // e.g. "deal_abc123", "team_general"
        public string Content { get; set; } = string.Empty;
        public string MessageType { get; set; } = "Text"; // Text, File, Image
        public string? FileUrl { get; set; }
        public bool IsRead { get; set; } = false;
        public DateTime? ReadAt { get; set; }
        public bool IsDeleted { get; set; } = false;

        public User? Sender { get; set; }
        public User? Receiver { get; set; }
    }
}
