using CRM.Domain.Common;
using System;

namespace CRM.Domain.Entities
{
    public class Payment : BaseEntity
    {
        public Guid InvoiceId { get; set; }
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
        public decimal Amount { get; set; }
        public string PaymentMode { get; set; } = "Online";
        // Cash, Cheque, Online, UPI, NEFT, RTGS, Card, Other
        public string? TransactionRef { get; set; }  // Bank UTR / reference number
        public string? Remarks { get; set; }
        public Guid? ReceivedBy { get; set; }
        public bool IsDelete { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public Guid? CreatedBy { get; set; }

        // Navigation
        public Invoice? Invoice { get; set; }
        public User? ReceivedByUser { get; set; }
        public User? CreatedByUser { get; set; }
    }
}
