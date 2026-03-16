using CRM.Domain.Common;
using System;
using System.Collections.Generic;

namespace CRM.Domain.Entities
{
    /// <summary>A live chat session between a website visitor (client) and a support agent</summary>
    public class LiveChatSession : AuditableEntity
    {
        public string VisitorName { get; set; } = "Visitor";
        public string? VisitorEmail { get; set; }
        public string? VisitorPhone { get; set; }
        public string SessionToken { get; set; } = string.Empty;  // Unique token for visitor
        public string Status { get; set; } = "Waiting";           // Waiting, Active, Closed
        public Guid? AssignedAgentId { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public string? Subject { get; set; }
        public int Rating { get; set; } = 0;                      // Visitor rating 1-5
        public string? RatingComment { get; set; }

        // Link to CRM records (created if visitor converts to customer)
        public Guid? CreatedCustomerId { get; set; }  // Updated from CreatedContactId

        public User? AssignedAgent { get; set; }
        public ICollection<LiveChatMessage> Messages { get; set; } = new List<LiveChatMessage>();
    }

    /// <summary>Individual message within a LiveChatSession</summary>
    public class LiveChatMessage : BaseEntity
    {
        public Guid SessionId { get; set; }
        public string SenderType { get; set; } = "Visitor";  // Visitor, Agent, System
        public Guid? AgentId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string MessageType { get; set; } = "Text";    // Text, File, Image
        public string? FileUrl { get; set; }
        public bool IsRead { get; set; } = false;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public LiveChatSession? Session { get; set; }
        public User? Agent { get; set; }
    }
}
