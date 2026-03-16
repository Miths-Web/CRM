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
    [Route("api/products")]
    [Authorize]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public ProductsController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? category, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _db.Products.Where(p => !p.IsDelete && p.IsActive);
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(p => p.ProductName.Contains(search) || (p.SKU != null && p.SKU.Contains(search)));
            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(p => p.Category == category);

            var total = await query.CountAsync();
            var items = await query
                .OrderBy(p => p.ProductName)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(p => new {
                    p.Id, p.ProductName, p.SKU, p.Category, p.UnitPrice,
                    p.TaxRate, p.Unit, p.StockQuantity, p.IsActive, p.Description
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
                    p.Id, p.ProductName, p.SKU, p.Category, p.Description,
                    p.UnitPrice, p.TaxRate, p.Unit, p.StockQuantity, p.IsActive
                })
                .FirstOrDefaultAsync();

            if (product == null) return NotFound();
            return Ok(product);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Create([FromBody] Product dto)
        {
            var product = new Product
            {
                ProductName   = dto.ProductName,
                SKU           = dto.SKU,
                Category      = dto.Category,
                Description   = dto.Description,
                UnitPrice     = dto.UnitPrice,
                TaxRate       = dto.TaxRate,
                Unit          = dto.Unit,
                StockQuantity = dto.StockQuantity,
                IsActive      = true,
                CreatedDate   = DateTime.UtcNow,
                UpdatedDate   = DateTime.UtcNow
            };
            _db.Products.Add(product);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, new { product.Id, product.ProductName });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Product dto)
        {
            var product = await _db.Products.FindAsync(id);
            if (product == null || product.IsDelete) return NotFound();

            product.ProductName   = dto.ProductName;
            product.SKU           = dto.SKU;
            product.Category      = dto.Category;
            product.Description   = dto.Description;
            product.UnitPrice     = dto.UnitPrice;
            product.TaxRate       = dto.TaxRate;
            product.Unit          = dto.Unit;
            product.StockQuantity = dto.StockQuantity;
            product.IsActive      = dto.IsActive;
            product.UpdatedDate   = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Product updated." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var product = await _db.Products.FindAsync(id);
            if (product == null || product.IsDelete) return NotFound();
            product.IsDelete    = true;
            product.UpdatedDate = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Product deleted." });
        }

        // GET api/products/categories
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
