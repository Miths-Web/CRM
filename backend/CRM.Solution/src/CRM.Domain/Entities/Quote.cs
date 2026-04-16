using CRM.Domain.Common;
using System;
using System.Collections.Generic;

namespace CRM.Domain.Entities
{
    /// <summary>
    /// Quote — Customer ko bheja gaya formal price proposal.
    /// B2B Sales Flow: Lead → Deal → Quote → (Approved) → Order → Invoice → Payment
    /// </summary>
    public class Quote : AuditableEntity
    {
        public string QuoteNumber { get; set; } = string.Empty;  // QUO-2026-0001
        public string Title       { get; set; } = string.Empty;

        // Links (Deal se ya directly Customer/Company se generate ho sakta hai)
        public Guid? DealId      { get; set; }
        public Guid? CustomerId  { get; set; }
        public Guid? CompanyId   { get; set; }

        // Validity
        public DateTime QuoteDate   { get; set; } = DateTime.UtcNow;
        public DateTime ValidUntil  { get; set; } = DateTime.UtcNow.AddDays(30);

        // Financials
        public decimal SubTotal       { get; set; } = 0;
        public decimal DiscountAmount { get; set; } = 0;
        public decimal TaxAmount      { get; set; } = 0;
        public decimal TotalAmount    { get; set; } = 0;

        // Status: Draft → Sent → Accepted / Rejected / Expired
        public string Status { get; set; } = "Draft";

        public string? Notes           { get; set; }
        public string? TermsConditions { get; set; }
        public Guid?   AssignedToUserId { get; set; }

        // Created By (from AuditableEntity: CreatedByUserId, UpdatedByUserId, CreatedAt, UpdatedAt)

        // Navigation Properties
        public Deal?           Deal           { get; set; }
        public CustomerMaster? Customer       { get; set; }
        public CompanyMaster?  Company        { get; set; }
        public User?           AssignedToUser { get; set; }
        public User?           CreatedByUser  { get; set; }
        public User?           UpdatedByUser  { get; set; }

        public ICollection<QuoteItem> Items { get; set; } = new List<QuoteItem>();
    }
}
