using CRM.Domain.Common;
using System;

namespace CRM.Domain.Entities
{
    public class Note : AuditableEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Category { get; set; }
        public bool IsPinned { get; set; } = false;
        
        public Guid? RelatedCustomerId { get; set; }   // Updated from RelatedContactId
        public Guid? RelatedLeadId { get; set; }
        public Guid? RelatedDealId { get; set; }

        public CustomerMaster? RelatedCustomer { get; set; }  // Updated from Contact
        public Lead? RelatedLead { get; set; }
        public Deal? RelatedDeal { get; set; }
    }
}
