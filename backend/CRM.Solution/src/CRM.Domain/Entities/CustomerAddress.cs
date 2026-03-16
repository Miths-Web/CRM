using CRM.Domain.Common;
using System;

namespace CRM.Domain.Entities
{
    public class CustomerAddress : BaseEntity
    {
        public Guid CustomerId { get; set; }
        public string AddressType { get; set; } = "BILLING"; // BILLING, SHIPPING, OFFICE, OTHER
        public string AddressLine1 { get; set; } = string.Empty;
        public string? AddressLine2 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }
        public string Country { get; set; } = "India";
        public bool IsDefault { get; set; } = false;
        public bool IsDelete { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public Guid? CreatedBy { get; set; }

        // Navigation
        public CustomerMaster? Customer { get; set; }
        public User? CreatedByUser { get; set; }
    }
}
