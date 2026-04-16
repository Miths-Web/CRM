using CRM.Domain.Common;
using System;

namespace CRM.Domain.Entities
{
    /// <summary>
    /// QuoteItem — Quote ke andar ek product/service line item.
    /// Invoice ke OrderItem jaisa hi, lekin Quote ke liye.
    /// </summary>
    public class QuoteItem : BaseEntity
    {
        public Guid    QuoteId     { get; set; }
        public Guid?   ProductId   { get; set; }
        public string  Description { get; set; } = string.Empty;
        public decimal Quantity    { get; set; } = 1;
        public decimal UnitPrice   { get; set; } = 0;
        public decimal DiscountPct { get; set; } = 0;  // 0-100
        public decimal TaxRate     { get; set; } = 0;  // 0-100 (e.g. 18 for GST 18%)
        public decimal LineTotal   { get; set; } = 0;  // Computed: (Qty * UnitPrice) - discount + tax

        // Navigation
        public Quote?   Quote   { get; set; }
        public Product? Product { get; set; }
    }
}
