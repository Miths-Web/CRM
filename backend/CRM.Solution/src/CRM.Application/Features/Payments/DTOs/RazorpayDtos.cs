using System;

namespace CRM.Application.Features.Payments.DTOs
{
    public class CreateRazorpayOrderRequest
    {
        public Guid InvoiceId { get; set; }
    }

    public class VerifyRazorpayPaymentRequest
    {
        public Guid InvoiceId { get; set; }
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string RazorpayPaymentId { get; set; } = string.Empty;
        public string RazorpaySignature { get; set; } = string.Empty;
    }
}
