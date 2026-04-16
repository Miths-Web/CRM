using CRM.Domain.Common;
using System;
using System.Collections.Generic;

namespace CRM.Domain.Entities
{
    public class OrderMaster : BaseEntity
    {
        public string OrderNumber { get; set; } = string.Empty;  // ORD-2024-0001
        public Guid? DealId { get; set; }
        public Guid CustomerId { get; set; }
        public Guid? CompanyId { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public DateTime? ExpectedDelivery { get; set; }
        public string Status { get; set; } = "Pending";
        // Pending, Confirmed, Processing, Dispatched, Delivered, Cancelled
        public decimal SubTotal { get; set; } = 0;
        public decimal TaxAmount { get; set; } = 0;
        public decimal DiscountAmount { get; set; } = 0;
        public decimal TotalAmount { get; set; } = 0;
        public string? Notes { get; set; }
        public bool IsDelete { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public Guid? CreatedBy { get; set; }
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
        public Guid? UpdatedBy { get; set; }

        // Navigation
        public Deal? Deal { get; set; }
        public CustomerMaster? Customer { get; set; }
        public CompanyMaster? Company { get; set; }
        public User? CreatedByUser { get; set; }
        public User? UpdatedByUser { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
}
