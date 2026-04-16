using CRM.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Razorpay.Api;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace CRM.Infrastructure.Services
{
    public class RazorpayService : IPaymentGatewayService
    {
        private readonly string _keyId;
        private readonly string _keySecret;

        public RazorpayService(IConfiguration config)
        {
            _keyId = config["Razorpay:KeyId"] ?? throw new ArgumentNullException("Razorpay:KeyId is missing");
            _keySecret = config["Razorpay:KeySecret"] ?? throw new ArgumentNullException("Razorpay:KeySecret is missing");
        }

        public Task<RazorpayOrderResponse> CreateOrderAsync(string receiptId, decimal amountInINR)
        {
            // Amount in paise (multiply by 100)
            int amountInPaise = (int)Math.Round(amountInINR * 100);

            var client = new RazorpayClient(_keyId, _keySecret);

            var options = new Dictionary<string, object>
            {
                { "amount", amountInPaise },
                { "currency", "INR" },
                { "receipt", receiptId },
                { "payment_capture", 1 } // Auto capture
            };

            // Order is a Razorpay API internal concept
            Order order = client.Order.Create(options);

            var response = new RazorpayOrderResponse
            {
                OrderId = order["id"].ToString(),
                AmountInPaise = amountInPaise,
                Currency = "INR",
                KeyId = _keyId
            };

            return Task.FromResult(response);
        }

        public bool VerifyPaymentSignature(string razorpayOrderId, string razorpayPaymentId, string signature)
        {
            try
            {
                string payload = razorpayOrderId + "|" + razorpayPaymentId;
                string generatedSignature = GetHMACSHA256(payload, _keySecret);

                return generatedSignature.Equals(signature, StringComparison.InvariantCultureIgnoreCase);
            }
            catch (Exception)
            {
                return false;
            }
        }

        private string GetHMACSHA256(string payload, string secret)
        {
            byte[] secretBytes = Encoding.UTF8.GetBytes(secret);
            byte[] payloadBytes = Encoding.UTF8.GetBytes(payload);

            using (var hmacsha256 = new HMACSHA256(secretBytes))
            {
                byte[] hashmessage = hmacsha256.ComputeHash(payloadBytes);
                // Convert bytes to hex string
                return BitConverter.ToString(hashmessage).Replace("-", "").ToLower();
            }
        }
    }
}
