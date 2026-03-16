using CRM.Domain.Common;
using System;
using System.Collections.Generic;

namespace CRM.Domain.Entities
{
    public class CompanyMaster : BaseEntity
    {
        public string CompanyName { get; set; } = string.Empty;
        public string? CompanyAddress { get; set; }
        public string? OwnerFirstName { get; set; }
        public string? OwnerLastName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNo { get; set; }
        public string? Website { get; set; }
        public string? GSTNo { get; set; }
        public string? PANNo { get; set; }
        public string? IndustryType { get; set; }
        public string? LogoUrl { get; set; }
        public bool IsDelete { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public Guid? CreatedBy { get; set; }
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
        public Guid? UpdatedBy { get; set; }

        // Navigation
        public User? CreatedByUser { get; set; }
        public User? UpdatedByUser { get; set; }
        public ICollection<CustomerMaster> Customers { get; set; } = new List<CustomerMaster>();
        public ICollection<Deal> Deals { get; set; } = new List<Deal>();
        public ICollection<OrderMaster> Orders { get; set; } = new List<OrderMaster>();
    }
}
