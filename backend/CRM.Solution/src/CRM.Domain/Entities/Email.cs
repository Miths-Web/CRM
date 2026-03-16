using CRM.Domain.Common;
using System;

namespace CRM.Domain.Entities
{
    public class Email : AuditableEntity
    {
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? FromEmail { get; set; }
        public string ToEmail { get; set; } = string.Empty;
        public string? CcEmails { get; set; } // JSON array
        public string? BccEmails { get; set; } // JSON array
        public string Status { get; set; } = "Draft"; // Draft, Scheduled, Sent, Failed
        
        public DateTime? ScheduledAt { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime? OpenedAt { get; set; }
        public DateTime? ClickedAt { get; set; }
        
        public Guid? TemplateId { get; set; }
        public Guid? RelatedCustomerId { get; set; }   // Updated from RelatedContactId
        public Guid? RelatedLeadId { get; set; }
        public Guid? RelatedDealId { get; set; }

        public EmailTemplate? Template { get; set; }
        public CustomerMaster? RelatedCustomer { get; set; }  // Updated from Contact
        public Lead? RelatedLead { get; set; }
        public Deal? RelatedDeal { get; set; }
    }
}
