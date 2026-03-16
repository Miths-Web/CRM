using CRM.Domain.Common;
using CRM.Domain.Enums;
using System;
using System.Collections.Generic;

namespace CRM.Domain.Entities
{
    public class Lead : AuditableEntity
    {
        public string Title { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Company { get; set; }
        public string? JobTitle { get; set; }
        public LeadStatus Status { get; set; } = LeadStatus.New;
        public LeadSource? Source { get; set; }
        public int Score { get; set; } = 0;
        public decimal? EstimatedValue { get; set; }
        public string? Description { get; set; }

        public Guid? AssignedToUserId { get; set; }

        // Conversion: Lead → Customer + Company + Deal
        public Guid? ConvertedToCustomerId { get; set; }
        public Guid? ConvertedToCompanyId { get; set; }
        public Guid? ConvertedToDealId { get; set; }
        public DateTime? ConvertedAt { get; set; }

        // Navigation
        public User? AssignedToUser { get; set; }
        public CustomerMaster? ConvertedToCustomer { get; set; }
        public CompanyMaster? ConvertedToCompany { get; set; }
        public Deal? ConvertedToDeal { get; set; }
        public ICollection<Note> Notes { get; set; } = new List<Note>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
    }
}
