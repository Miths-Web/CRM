using System;

namespace CRM.Domain.Entities
{
    public class Feedback
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CustomerId { get; set; }
        public CustomerMaster Customer { get; set; }
        
        public int Rating { get; set; } // 1-5 stars
        public string Category { get; set; } // Support, Product, General
        public string Subject { get; set; }
        public string Comments { get; set; }
        
        public string Status { get; set; } = "New"; // New, InReview, Resolved
        public Guid? AssignedToUserId { get; set; }
        public User AssignedToUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
