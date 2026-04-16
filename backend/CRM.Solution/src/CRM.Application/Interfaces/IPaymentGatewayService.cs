using System.Threading.Tasks;

namespace CRM.Application.Interfaces
{
    public class RazorpayOrderResponse
    {
        public string OrderId { get; set; } = string.Empty;
        public decimal AmountInPaise { get; set; }
        public string Currency { get; set; } = "INR";
        public string KeyId { get; set; } = string.Empty;
    }

    public interface IPaymentGatewayService
    {
        Task<RazorpayOrderResponse> CreateOrderAsync(string receiptId, decimal amountInINR);
        bool VerifyPaymentSignature(string razorpayOrderId, string razorpayPaymentId, string signature);
    }
}
