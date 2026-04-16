using CRM.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/payments")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public PaymentsController(ApplicationDbContext db) => _db = db;

        /// <summary>
        /// GET api/payments — All recorded payments with customer & invoice info
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var query = _db.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i!.Customer)
                .Include(p => p.Invoice)
                    .ThenInclude(i => i!.Company)
                .Include(p => p.Invoice)
                    .ThenInclude(i => i!.Order)
                        .ThenInclude(o => o!.OrderItems)
                            .ThenInclude(oi => oi.Product)
                .OrderByDescending(p => p.PaymentDate);

            var total = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new {
                    p.Id,
                    p.Amount,
                    p.PaymentMode,
                    p.TransactionRef,
                    p.Remarks,
                    p.PaymentDate,
                    InvoiceNumber = p.Invoice != null ? p.Invoice.InvoiceNumber : null,
                    InvoiceTotal  = p.Invoice != null ? p.Invoice.TotalAmount : 0,
                    PaymentStatus = p.Invoice != null ? p.Invoice.PaymentStatus : null,
                    CustomerName  = p.Invoice != null && p.Invoice.Customer != null
                        ? $"{p.Invoice.Customer.FirstName} {p.Invoice.Customer.LastName}" : null,
                    CompanyName   = p.Invoice != null && p.Invoice.Company != null
                        ? p.Invoice.Company.CompanyName : null,
                    OrderNumber   = p.Invoice != null && p.Invoice.Order != null
                        ? p.Invoice.Order.OrderNumber : null,
                    Products      = p.Invoice != null && p.Invoice.Order != null
                        ? p.Invoice.Order.OrderItems.Select(oi => new {
                            Name = oi.Product != null ? oi.Product.ProductName : "Custom",
                            oi.Quantity,
                            oi.UnitPrice,
                            oi.LineTotal
                        }) : null
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, items });
        }

        /// <summary>
        /// POST api/payments/razorpay/create-order — Creates an order on Razorpay for an unpaid Invoice
        /// </summary>
        [HttpPost("razorpay/create-order")]
        public async Task<IActionResult> CreateRazorpayOrder(
            [FromBody] CRM.Application.Features.Payments.DTOs.CreateRazorpayOrderRequest request,
            [FromServices] CRM.Application.Interfaces.IPaymentGatewayService paymentGateway)
        {
            var invoice = await _db.Invoices.FirstOrDefaultAsync(i => i.Id == request.InvoiceId && !i.IsDelete);
            if (invoice == null) return NotFound(new { message = "Invoice not found or deleted." });

            if (invoice.DueAmount <= 0) return BadRequest(new { message = "Invoice is already fully paid." });

            var response = await paymentGateway.CreateOrderAsync(invoice.InvoiceNumber, invoice.DueAmount);
            return Ok(response);
        }

        /// <summary>
        /// POST api/payments/razorpay/verify — Verifies signature and records payment
        /// </summary>
        [HttpPost("razorpay/verify")]
        public async Task<IActionResult> VerifyRazorpayPayment(
            [FromBody] CRM.Application.Features.Payments.DTOs.VerifyRazorpayPaymentRequest request,
            [FromServices] CRM.Application.Interfaces.IPaymentGatewayService paymentGateway)
        {
            var isValid = paymentGateway.VerifyPaymentSignature(request.RazorpayOrderId, request.RazorpayPaymentId, request.RazorpaySignature);

            if (!isValid) return BadRequest(new { message = "Payment signature verification failed." });

            var invoice = await _db.Invoices.FirstOrDefaultAsync(i => i.Id == request.InvoiceId && !i.IsDelete);
            if (invoice == null) return NotFound(new { message = "Invoice not found." });

            var amountToPay = invoice.DueAmount;

            var payment = new CRM.Domain.Entities.Payment
            {
                InvoiceId = invoice.Id,
                Amount = amountToPay,
                PaymentMode = "Online",
                TransactionRef = request.RazorpayPaymentId,
                Remarks = $"Razorpay Order: {request.RazorpayOrderId}",
                PaymentDate = System.DateTime.UtcNow,
                CreatedDate = System.DateTime.UtcNow
            };

            // Safely get user ID
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                payment.CreatedBy = userId;
                payment.ReceivedBy = userId;
            }

            _db.Payments.Add(payment);

            // Update Invoice
            invoice.PaidAmount += amountToPay;
            invoice.PaymentStatus = invoice.DueAmount <= 0 ? "Paid" : "PartiallyPaid";
            invoice.UpdatedDate = System.DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Payment verified and recorded successfully.", paymentId = payment.Id });
        }
    }
}
