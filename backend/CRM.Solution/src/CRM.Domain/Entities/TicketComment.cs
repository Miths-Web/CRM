using CRM.Domain.Common;
using System;

namespace CRM.Domain.Entities
{
    public class TicketComment : BaseEntity
    {
        public Guid TicketId { get; set; }
        public Guid UserId { get; set; }
        public string CommentText { get; set; } = string.Empty;
        public bool IsInternal { get; set; } = false; // If true, only visible to CRM staff, not the customer
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Ticket? Ticket { get; set; }
        public User? User { get; set; }
    }
}
