using CRM.Domain.Common;
using CRM.Domain.Enums;
using System;
using System.Collections.Generic;

namespace CRM.Domain.Entities
{
    public class Deal : AuditableEntity
    {
        public string Title { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public string Currency { get; set; } = "INR";
        public int? StageId { get; set; }
        public int Probability { get; set; } = 0;
        public DateTime? ExpectedCloseDate { get; set; }
        public DateTime? ActualCloseDate { get; set; }
        public DealStatus Status { get; set; } = DealStatus.Open;
        public string? LostReason { get; set; }
        public Guid? CustomerId { get; set; }    // Contact → Customer
        public Guid? CompanyId { get; set; }     // CompanyName → CompanyId (FK)
        public string? Description { get; set; }
        public Guid? AssignedToUserId { get; set; }

        // Navigation
        public DealStage? Stage { get; set; }
        public CustomerMaster? Customer { get; set; }
        public CompanyMaster? Company { get; set; }
        public User? AssignedToUser { get; set; }
        public ICollection<Note> Notes { get; set; } = new List<Note>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
        public ICollection<OrderMaster> Orders { get; set; } = new List<OrderMaster>();
    }
}
