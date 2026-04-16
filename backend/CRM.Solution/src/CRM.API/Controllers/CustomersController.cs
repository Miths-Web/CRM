using CRM.Domain.Entities;
using System.Security.Claims;
using CRM.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Text.Encodings.Web;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/customers")]
    [Authorize]
    public class CustomersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public CustomersController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] Guid? companyId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _db.Customers.Where(c => !c.IsDelete);

            if (User.IsInRole("Sales Rep") && !User.IsInRole("Admin") && !User.IsInRole("Manager"))
            {
                var userIdStr = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (Guid.TryParse(userIdStr, out var userId))
                {
                    query = query.Where(c => c.AssignedToUserId == userId);
                }
            }
            if (companyId.HasValue) query = query.Where(c => c.CompanyId == companyId.Value);
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(c => c.FirstName.Contains(search) || (c.LastName != null && c.LastName.Contains(search)) || (c.Email != null && c.Email.Contains(search)));

            var total = await query.CountAsync();
            var items = await query
                .Include(c => c.Company)
                .Include(c => c.AssignedToUser)
                .Include(c => c.CreatedByUser)
                .Include(c => c.UpdatedByUser)
                .OrderBy(c => c.FirstName)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(c => new {
                    c.Id, c.FirstName, c.LastName, c.Email, c.PhoneNo,
                    c.Designation, c.CompanyId,
                    CompanyName = c.Company != null ? c.Company.CompanyName : null,
                    c.CreatedDate,
                    c.CreatedBy,
                    c.UpdatedDate,
                    c.UpdatedBy,
                    c.AssignedToUserId,
                    AssignedToUserName = c.AssignedToUser != null ? c.AssignedToUser.FirstName + " " + c.AssignedToUser.LastName : null,
                    CreatedByUserName = c.CreatedByUser != null ? c.CreatedByUser.FirstName + " " + c.CreatedByUser.LastName : null,
                    UpdatedByUserName = c.UpdatedByUser != null ? c.UpdatedByUser.FirstName + " " + c.UpdatedByUser.LastName : null
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var customer = await _db.Customers
                .Include(c => c.Company)
                .Include(c => c.AssignedToUser)
                .Include(c => c.CreatedByUser)
                .Include(c => c.UpdatedByUser)
                .Include(c => c.Addresses.Where(a => !a.IsDelete))
                .Where(c => c.Id == id && !c.IsDelete)
                .Select(c => new {
                    c.Id, c.FirstName, c.LastName, c.Email, c.PhoneNo, c.Designation,
                    c.AdharCardNo, c.PANNo, c.CompanyId,
                    CompanyName = c.Company != null ? c.Company.CompanyName : null,
                    c.CreatedDate,
                    c.CreatedBy,
                    c.UpdatedDate,
                    c.UpdatedBy,
                    c.AssignedToUserId,
                    AssignedToUserName = c.AssignedToUser != null ? c.AssignedToUser.FirstName + " " + c.AssignedToUser.LastName : null,
                    CreatedByUserName = c.CreatedByUser != null ? c.CreatedByUser.FirstName + " " + c.CreatedByUser.LastName : null,
                    UpdatedByUserName = c.UpdatedByUser != null ? c.UpdatedByUser.FirstName + " " + c.UpdatedByUser.LastName : null,
                    Addresses = c.Addresses.Select(a => new {
                        a.Id, a.AddressType, a.AddressLine1, a.AddressLine2,
                        a.City, a.State, a.Pincode, a.Country, a.IsDefault
                    })
                })
                .FirstOrDefaultAsync();

            if (customer == null) return NotFound();
            return Ok(customer);
        }

        // ── Explicit DTO to avoid entity binding issues with navigation props ──
        public record CustomerRequestDto(
            [property: JsonPropertyName("companyId")] Guid? CompanyId,
            [property: JsonPropertyName("firstName")] string FirstName,
            [property: JsonPropertyName("lastName")] string? LastName,
            [property: JsonPropertyName("email")] string? Email,
            [property: JsonPropertyName("phoneNo")] string? PhoneNo,
            [property: JsonPropertyName("designation")] string? Designation,
            [property: JsonPropertyName("department")] string? Department,
            [property: JsonPropertyName("adharCardNo")] string? AdharCardNo,
            [property: JsonPropertyName("pANNo")] string? PANNo,
            [property: JsonPropertyName("assignedToUserId")] Guid? AssignedToUserId
        );

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CustomerRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FirstName))
                return BadRequest(new { message = "First name is required." });

            // XSS Prevention (Bug #10 Fix): Encode string fields before saving
            var enc = HtmlEncoder.Default;
            var customer = new CustomerMaster
            {
                CompanyId        = dto.CompanyId,
                FirstName        = enc.Encode(dto.FirstName),
                LastName         = dto.LastName != null ? enc.Encode(dto.LastName) : null,
                Email            = dto.Email,  // Email intentionally not HTML-encoded
                PhoneNo          = dto.PhoneNo,
                Designation      = dto.Designation != null ? enc.Encode(dto.Designation) : null,
                AdharCardNo      = dto.AdharCardNo,
                PANNo            = dto.PANNo,
                AssignedToUserId = dto.AssignedToUserId,
                CreatedDate      = DateTime.UtcNow,
                UpdatedDate      = DateTime.UtcNow
            };
            _db.Customers.Add(customer);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = customer.Id }, new { customer.Id, customer.FirstName, customer.LastName });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CustomerRequestDto dto)
        {
            var customer = await _db.Customers.FindAsync(id);
            if (customer == null || customer.IsDelete) return NotFound();

            // XSS Prevention (Bug #10 Fix): Encode string fields before saving
            var enc = HtmlEncoder.Default;
            customer.CompanyId        = dto.CompanyId;
            customer.FirstName        = enc.Encode(dto.FirstName ?? string.Empty);
            customer.LastName         = dto.LastName != null ? enc.Encode(dto.LastName) : null;
            customer.Email            = dto.Email;
            customer.PhoneNo          = dto.PhoneNo;
            customer.Designation      = dto.Designation != null ? enc.Encode(dto.Designation) : null;
            customer.AdharCardNo      = dto.AdharCardNo;
            customer.PANNo            = dto.PANNo;
            customer.AssignedToUserId = dto.AssignedToUserId;
            customer.UpdatedDate      = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Customer updated." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var customer = await _db.Customers.FindAsync(id);
            if (customer == null || customer.IsDelete) return NotFound();
            customer.IsDelete    = true;
            customer.UpdatedDate = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Customer deleted." });
        }

        // POST api/customers/{id}/addresses
        [HttpPost("{id}/addresses")]
        public async Task<IActionResult> AddAddress(Guid id, [FromBody] CustomerAddress dto)
        {
            if (!await _db.Customers.AnyAsync(c => c.Id == id && !c.IsDelete))
                return NotFound();

            var address = new CustomerAddress
            {
                CustomerId   = id,
                AddressType  = dto.AddressType,
                AddressLine1 = dto.AddressLine1,
                AddressLine2 = dto.AddressLine2,
                City         = dto.City,
                State        = dto.State,
                Pincode      = dto.Pincode,
                Country      = dto.Country ?? "India",
                IsDefault    = dto.IsDefault,
                CreatedDate  = DateTime.UtcNow
            };
            _db.CustomerAddresses.Add(address);
            await _db.SaveChangesAsync();
            return Ok(new { address.Id, message = "Address added." });
        }
    }
}
