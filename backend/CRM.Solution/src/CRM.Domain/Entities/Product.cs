using CRM.Domain.Common;
using System;
using System.Collections.Generic;

namespace CRM.Domain.Entities
{
    public class Product : BaseEntity
    {
        public string ProductName { get; set; } = string.Empty;
        public string? SKU { get; set; }
        public string? Category { get; set; }
        public string? Description { get; set; }
        public decimal UnitPrice { get; set; } = 0;
        public decimal TaxRate { get; set; } = 18.00m; // Default 18% GST
        public string? Unit { get; set; }              // Piece, KG, Litre, Hours
        public int StockQuantity { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public bool IsDelete { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public Guid? CreatedBy { get; set; }
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
        public Guid? UpdatedBy { get; set; }

        // Navigation
        public User? CreatedByUser { get; set; }
        public User? UpdatedByUser { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
