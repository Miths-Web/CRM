using CRM.Domain.Common;
using System;

namespace CRM.Domain.Entities
{
    public class Document : AuditableEntity
    {
        public string FileName { get; set; } = string.Empty;
        public string? OriginalFileName { get; set; }
        public string? FilePath { get; set; }
        public long? FileSize { get; set; }
        public string? MimeType { get; set; }
        public string? Category { get; set; }
        
        public Guid? RelatedCustomerId { get; set; }   // Updated from RelatedContactId
        public Guid? RelatedLeadId { get; set; }
        public Guid? RelatedDealId { get; set; }
        public Guid? RelatedNoteId { get; set; }

        public CustomerMaster? RelatedCustomer { get; set; }  // Updated
        public Lead? RelatedLead { get; set; }
        public Deal? RelatedDeal { get; set; }
        public Note? RelatedNote { get; set; }
    }
}
