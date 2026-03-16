using CRM.Domain.Common;
using System;

namespace CRM.Domain.Entities
{
    public class OrderItem : BaseEntity
    {
        public Guid OrderId { get; set; }
        public Guid ProductId { get; set; }
        public decimal Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }       // Price at time of order
        public decimal DiscountPct { get; set; } = 0;
        public decimal TaxRate { get; set; } = 18;
        public decimal LineTotal { get; set; }        // Final line amount

        // Navigation
        public OrderMaster? Order { get; set; }
        public Product? Product { get; set; }
    }
}
