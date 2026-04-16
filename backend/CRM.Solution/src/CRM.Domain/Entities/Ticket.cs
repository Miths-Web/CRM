using CRM.Domain.Common;
using System;
using System.Collections.Generic;

namespace CRM.Domain.Entities
{
    public class Ticket : BaseEntity
    {
        public string TicketNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "Open"; // Open, InProgress, Resolved, Closed
        public string Priority { get; set; } = "Medium"; // Low, Medium, High, Urgent
        public Guid? CustomerId { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public Guid CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public CustomerMaster? Customer { get; set; }
        public User? AssignedToUser { get; set; }
        public User? CreatedByUser { get; set; }
        public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();
    }
}
