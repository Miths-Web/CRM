using CRM.Domain.Common;
using System;
using System.Collections.Generic;

namespace CRM.Domain.Entities
{
    public class Invoice : BaseEntity
    {
        public string InvoiceNumber { get; set; } = string.Empty; // INV-2024-0001
        public Guid OrderId { get; set; }
        public Guid CustomerId { get; set; }
        public Guid CompanyId { get; set; }
        public Guid? BillingAddressId { get; set; }
        public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
        public DateTime DueDate { get; set; }
        public decimal SubTotal { get; set; } = 0;
        public decimal TaxAmount { get; set; } = 0;
        public decimal DiscountAmount { get; set; } = 0;
        public decimal TotalAmount { get; set; } = 0;
        public decimal PaidAmount { get; set; } = 0;
        // DueAmount = TotalAmount - PaidAmount (computed in service)
        public string PaymentStatus { get; set; } = "Unpaid";
        // Unpaid, PartiallyPaid, Paid, Overdue, Cancelled
        public string? Notes { get; set; }
        public string? TermsConditions { get; set; }
        public bool IsDelete { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public Guid? CreatedBy { get; set; }
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
        public Guid? UpdatedBy { get; set; }

        // Computed property
        public decimal DueAmount => TotalAmount - PaidAmount;

        // Navigation
        public OrderMaster? Order { get; set; }
        public CustomerMaster? Customer { get; set; }
        public CompanyMaster? Company { get; set; }
        public CustomerAddress? BillingAddress { get; set; }
        public User? CreatedByUser { get; set; }
        public User? UpdatedByUser { get; set; }
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
