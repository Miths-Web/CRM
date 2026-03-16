using CRM.Domain.Entities;
using CRM.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/orders")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public OrdersController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] Guid? customerId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _db.Orders.Where(o => !o.IsDelete);
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(o => o.Status == status);
            if (customerId.HasValue) query = query.Where(o => o.CustomerId == customerId.Value);

            var total = await query.CountAsync();
            var items = await query
                .Include(o => o.Customer)
                .Include(o => o.Company)
                .OrderByDescending(o => o.OrderDate)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(o => new {
                    o.Id, o.OrderNumber, o.Status, o.OrderDate, o.TotalAmount,
                    o.ExpectedDelivery, o.CustomerId,
                    CustomerName = o.Customer != null ? $"{o.Customer.FirstName} {o.Customer.LastName}" : null,
                    CompanyName  = o.Company != null ? o.Company.CompanyName : null,
                    ItemCount    = o.OrderItems.Count
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var order = await _db.Orders
                .Include(o => o.Customer).Include(o => o.Company)
                .Include(o => o.OrderItems).ThenInclude(i => i.Product)
                .Where(o => o.Id == id && !o.IsDelete)
                .Select(o => new {
                    o.Id, o.OrderNumber, o.Status, o.OrderDate, o.ExpectedDelivery,
                    o.SubTotal, o.TaxAmount, o.DiscountAmount, o.TotalAmount, o.Notes,
                    CustomerName = o.Customer != null ? $"{o.Customer.FirstName} {o.Customer.LastName}" : null,
                    CompanyName  = o.Company != null ? o.Company.CompanyName : null,
                    Items = o.OrderItems.Select(i => new {
                        i.Id, i.ProductId,
                        ProductName = i.Product != null ? i.Product.ProductName : null,
                        i.Quantity, i.UnitPrice, i.DiscountPct, i.TaxRate, i.LineTotal
                    })
                })
                .FirstOrDefaultAsync();

            if (order == null) return NotFound();
            return Ok(order);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
        {
            // BUG-010 FIX: Race condition se bachne ke liye GUID suffix use karo
            var orderNum  = $"ORD-{DateTime.UtcNow:yyyy}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";

            decimal subTotal = 0, taxTotal = 0;
            var items = new List<OrderItem>();

            foreach (var item in request.Items)
            {
                var product = await _db.Products.FindAsync(item.ProductId);
                if (product == null) return BadRequest($"Product {item.ProductId} not found.");

                var lineSubTotal = item.Quantity * item.UnitPrice * (1 - item.DiscountPct / 100);
                var lineTax      = lineSubTotal * (item.TaxRate / 100);
                var lineTotal    = lineSubTotal + lineTax;

                subTotal += lineSubTotal;
                taxTotal += lineTax;

                items.Add(new OrderItem {
                    ProductId   = item.ProductId,
                    Quantity    = item.Quantity,
                    UnitPrice   = item.UnitPrice,
                    DiscountPct = item.DiscountPct,
                    TaxRate     = item.TaxRate,
                    LineTotal   = lineTotal
                });
            }

            var order = new OrderMaster {
                OrderNumber      = orderNum,
                DealId           = request.DealId,
                CustomerId       = request.CustomerId,
                CompanyId        = request.CompanyId,
                ExpectedDelivery = request.ExpectedDelivery,
                Notes            = request.Notes,
                SubTotal         = subTotal,
                TaxAmount        = taxTotal,
                DiscountAmount   = request.DiscountAmount,
                TotalAmount      = subTotal + taxTotal - request.DiscountAmount,
                Status           = "Pending",
                CreatedDate      = DateTime.UtcNow,
                UpdatedDate      = DateTime.UtcNow,
                OrderItems       = items
            };

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, new { order.Id, order.OrderNumber, order.TotalAmount });
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest req)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null || order.IsDelete) return NotFound();
            order.Status      = req.Status;
            order.UpdatedDate = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = $"Order status updated to {req.Status}." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Cancel(Guid id)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null || order.IsDelete) return NotFound();
            order.Status      = "Cancelled";
            order.IsDelete    = true;
            order.UpdatedDate = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Order cancelled." });
        }
    }

    public class CreateOrderRequest
    {
        public Guid? DealId { get; set; }
        public Guid CustomerId { get; set; }
        public Guid CompanyId { get; set; }
        public DateTime? ExpectedDelivery { get; set; }
        public decimal DiscountAmount { get; set; } = 0;
        public string? Notes { get; set; }
        public List<OrderItemRequest> Items { get; set; } = new();
    }

    public class OrderItemRequest
    {
        public Guid ProductId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal DiscountPct { get; set; } = 0;
        public decimal TaxRate { get; set; } = 18;
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
