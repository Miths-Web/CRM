using CRM.Domain.Common;
using System;
using System.Collections.Generic;

namespace CRM.Domain.Entities
{
    public class CustomerMaster : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNo { get; set; }
        public string? Designation { get; set; }
        public string? AdharCardNo { get; set; }
        public string? PANNo { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public bool IsDelete { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public Guid? CreatedBy { get; set; }
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
        public Guid? UpdatedBy { get; set; }

        // Navigation
        public CompanyMaster? Company { get; set; }
        public User? AssignedToUser { get; set; }
        public User? CreatedByUser { get; set; }
        public User? UpdatedByUser { get; set; }
        public ICollection<CustomerAddress> Addresses { get; set; } = new List<CustomerAddress>();
        public ICollection<Deal> Deals { get; set; } = new List<Deal>();
        public ICollection<OrderMaster> Orders { get; set; } = new List<OrderMaster>();
    }
}
