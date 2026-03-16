using CRM.Domain.Entities;
using CRM.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/invoices")]
    [Authorize]
    public class InvoicesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public InvoicesController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] Guid? customerId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _db.Invoices.Where(i => !i.IsDelete);
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(i => i.PaymentStatus == status);
            if (customerId.HasValue) query = query.Where(i => i.CustomerId == customerId.Value);

            var total = await query.CountAsync();
            var items = await query
                .Include(i => i.Customer).Include(i => i.Company)
                .OrderByDescending(i => i.InvoiceDate)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(i => new {
                    i.Id, i.InvoiceNumber, i.PaymentStatus, i.InvoiceDate, i.DueDate,
                    i.TotalAmount, i.PaidAmount, DueAmount = i.TotalAmount - i.PaidAmount,
                    CustomerName = i.Customer != null ? $"{i.Customer.FirstName} {i.Customer.LastName}" : null,
                    CompanyName  = i.Company != null ? i.Company.CompanyName : null
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var invoice = await _db.Invoices
                .Include(i => i.Customer).Include(i => i.Company)
                .Include(i => i.BillingAddress)
                .Include(i => i.Order).ThenInclude(o => o!.OrderItems).ThenInclude(oi => oi.Product)
                .Include(i => i.Payments)
                .Where(i => i.Id == id && !i.IsDelete)
                .Select(i => new {
                    i.Id, i.InvoiceNumber, i.PaymentStatus, i.InvoiceDate, i.DueDate,
                    i.SubTotal, i.TaxAmount, i.DiscountAmount, i.TotalAmount, i.PaidAmount,
                    DueAmount = i.TotalAmount - i.PaidAmount,
                    i.Notes, i.TermsConditions,
                    CustomerName = i.Customer != null ? $"{i.Customer.FirstName} {i.Customer.LastName}" : null,
                    CompanyName  = i.Company != null ? i.Company.CompanyName : null,
                    GSTNo        = i.Company != null ? i.Company.GSTNo : null,
                    BillingAddress = i.BillingAddress != null ? new {
                        i.BillingAddress.AddressLine1, i.BillingAddress.City,
                        i.BillingAddress.State, i.BillingAddress.Pincode
                    } : null,
                    OrderItems = i.Order != null ? i.Order.OrderItems.Select(oi => new {
                        ProductName = oi.Product != null ? oi.Product.ProductName : null,
                        oi.Quantity, oi.UnitPrice, oi.DiscountPct, oi.TaxRate, oi.LineTotal
                    }) : null,
                    Payments = i.Payments.Select(p => new { p.Id, p.Amount, p.PaymentMode, p.PaymentDate, p.TransactionRef })
                })
                .FirstOrDefaultAsync();

            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest req)
        {
            var order = await _db.Orders.FindAsync(req.OrderId);
            if (order == null) return BadRequest("Order not found.");

            // BUG-009 FIX: Race condition se bachne ke liye GUID suffix use karo
            var invoiceNum  = $"INV-{DateTime.UtcNow:yyyy}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";

            var invoice = new Invoice {
                InvoiceNumber    = invoiceNum,
                OrderId          = req.OrderId,
                CustomerId       = order.CustomerId,
                CompanyId        = order.CompanyId,
                BillingAddressId = req.BillingAddressId,
                DueDate          = req.DueDate,
                SubTotal         = order.SubTotal,
                TaxAmount        = order.TaxAmount,
                DiscountAmount   = order.DiscountAmount,
                TotalAmount      = order.TotalAmount,
                PaidAmount       = 0,
                PaymentStatus    = "Unpaid",
                Notes            = req.Notes,
                TermsConditions  = req.TermsConditions,
                InvoiceDate      = DateTime.UtcNow,
                CreatedDate      = DateTime.UtcNow,
                UpdatedDate      = DateTime.UtcNow
            };

            _db.Invoices.Add(invoice);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = invoice.Id }, new { invoice.Id, invoice.InvoiceNumber });
        }

        // POST api/invoices/{id}/payment  — Record payment against invoice
        [HttpPost("{id}/payment")]
        public async Task<IActionResult> RecordPayment(Guid id, [FromBody] Payment dto)
        {
            var invoice = await _db.Invoices.FindAsync(id);
            if (invoice == null || invoice.IsDelete) return NotFound();

            // BUG-008 FIX: Overpayment check — due amount se zyada payment allowed nahi
            var dueAmount = invoice.TotalAmount - invoice.PaidAmount;
            if (dto.Amount <= 0)
                return BadRequest(new { message = "Payment amount must be greater than zero." });
            if (dto.Amount > dueAmount)
                return BadRequest(new { message = $"Payment amount (₹{dto.Amount}) exceeds the due amount (₹{dueAmount})." });

            var payment = new Payment {
                InvoiceId      = id,
                Amount         = dto.Amount,
                PaymentMode    = dto.PaymentMode,
                TransactionRef = dto.TransactionRef,
                Remarks        = dto.Remarks,
                PaymentDate    = DateTime.UtcNow,
                CreatedDate    = DateTime.UtcNow
            };

            _db.Payments.Add(payment);

            // Update invoice paid amount and status
            invoice.PaidAmount  += dto.Amount;
            invoice.PaymentStatus = invoice.PaidAmount >= invoice.TotalAmount ? "Paid"
                                  : invoice.PaidAmount > 0                   ? "PartiallyPaid"
                                                                              : "Unpaid";
            invoice.UpdatedDate   = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Payment recorded.", invoice.PaymentStatus, invoice.PaidAmount, DueAmount = invoice.TotalAmount - invoice.PaidAmount });
        }
    }

    public class CreateInvoiceRequest
    {
        public Guid OrderId { get; set; }
        public Guid? BillingAddressId { get; set; }
        public DateTime DueDate { get; set; }
        public string? Notes { get; set; }
        public string? TermsConditions { get; set; }
    }
}
