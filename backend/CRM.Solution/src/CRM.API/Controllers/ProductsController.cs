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
    // ─── DTO: matches the Angular frontend model exactly ─────────────────────────
    public class ProductDto
    {
        public string ProductName { get; set; } = string.Empty;
        public string? Sku { get; set; }
        public string? Category { get; set; }
        public string? Description { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TaxRatePercent { get; set; } = 18;   // maps to Product.TaxRate
        public string? Unit { get; set; }
        public int StockQuantity { get; set; }
        public bool IsActive { get; set; } = true;
    }

    [ApiController]
    [Route("api/products")]
    [Authorize]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public ProductsController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] string? category,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            // Admin can also see inactive products; others only see active ones
            var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");
            var query = isAdmin
                ? _db.Products.Where(p => !p.IsDelete)
                : _db.Products.Where(p => !p.IsDelete && p.IsActive);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(p => p.ProductName.Contains(search) || (p.SKU != null && p.SKU.Contains(search)));
            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(p => p.Category == category);

            var total = await query.CountAsync();
            var items = await query
                .OrderBy(p => p.ProductName)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(p => new {
                    p.Id,
                    p.ProductName,
                    sku           = p.SKU,
                    p.Category,
                    p.UnitPrice,
                    taxRatePercent = p.TaxRate,   // ← frontend uses taxRatePercent
                    p.Unit,
                    p.StockQuantity,
                    p.IsActive,
                    p.Description
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var product = await _db.Products
                .Where(p => p.Id == id && !p.IsDelete)
                .Select(p => new {
                    p.Id,
                    p.ProductName,
                    sku            = p.SKU,
                    p.Category,
                    p.Description,
                    p.UnitPrice,
                    taxRatePercent = p.TaxRate,   // ← frontend uses taxRatePercent
                    p.Unit,
                    p.StockQuantity,
                    p.IsActive
                })
                .FirstOrDefaultAsync();

            if (product == null) return NotFound();
            return Ok(product);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Create([FromBody] ProductDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var product = new Product
            {
                ProductName   = dto.ProductName,
                SKU           = dto.Sku,
                Category      = dto.Category,
                Description   = dto.Description,
                UnitPrice     = dto.UnitPrice,
                TaxRate       = dto.TaxRatePercent,   // ← correctly mapped
                Unit          = dto.Unit,
                StockQuantity = dto.StockQuantity,
                IsActive      = dto.IsActive,
                CreatedDate   = DateTime.UtcNow,
                UpdatedDate   = DateTime.UtcNow
            };
            _db.Products.Add(product);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, new { product.Id, product.ProductName });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ProductDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var product = await _db.Products.FindAsync(id);
            if (product == null || product.IsDelete) return NotFound();

            product.ProductName   = dto.ProductName;
            product.SKU           = dto.Sku;
            product.Category      = dto.Category;
            product.Description   = dto.Description;
            product.UnitPrice     = dto.UnitPrice;
            product.TaxRate       = dto.TaxRatePercent;   // ← correctly mapped
            product.Unit          = dto.Unit;
            product.StockQuantity = dto.StockQuantity;
            product.IsActive      = dto.IsActive;
            product.UpdatedDate   = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Product updated successfully." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Delete(Guid id)
        {
            Console.WriteLine($"\n\n=== DELETE ENDPOINT HIT FOR {id} ===\n\n");
            var product = await _db.Products.FindAsync(id);
            if (product == null || product.IsDelete) 
            {
                Console.WriteLine("PRODUCT NOT FOUND OR ALREADY DELETED");
                return NotFound();
            }
            product.IsDelete    = true;
            product.UpdatedDate = DateTime.UtcNow;
            try { await _db.SaveChangesAsync(); Console.WriteLine("SAVED SUCCESSFULLY"); } catch(Exception e) { Console.WriteLine("ERROR: " + e.Message); throw; }
            return Ok(new { message = "Product deleted." });
        }

        [AllowAnonymous]
        [HttpGet("test-delete/{id}")]
        public async Task<IActionResult> TestDelete(Guid id)
        {
            var product = await _db.Products.FindAsync(id);
            if (product == null || product.IsDelete) return Ok("NOT FOUND OR DELETED");
            product.IsDelete = true;
            try { 
                await _db.SaveChangesAsync(); 
                return Ok("DELETED SUCCESSFULLY"); 
            } 
            catch(Exception e) { 
                return Ok("ERROR SAVING: " + e.Message + " | " + e.InnerException?.Message); 
            }
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var cats = await _db.Products
                .Where(p => !p.IsDelete && p.Category != null)
                .Select(p => p.Category!)
                .Distinct()
                .ToListAsync();
            return Ok(cats);
        }
    }
}
