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
            if (companyId.HasValue) query = query.Where(c => c.CompanyId == companyId.Value);
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(c => c.FirstName.Contains(search) || (c.LastName != null && c.LastName.Contains(search)) || (c.Email != null && c.Email.Contains(search)));

            var total = await query.CountAsync();
            var items = await query
                .Include(c => c.Company)
                .OrderBy(c => c.FirstName)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(c => new {
                    c.Id, c.FirstName, c.LastName, c.Email, c.PhoneNo,
                    c.Designation, c.CompanyId,
                    CompanyName = c.Company != null ? c.Company.CompanyName : null,
                    c.CreatedDate
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var customer = await _db.Customers
                .Include(c => c.Company)
                .Include(c => c.Addresses.Where(a => !a.IsDelete))
                .Where(c => c.Id == id && !c.IsDelete)
                .Select(c => new {
                    c.Id, c.FirstName, c.LastName, c.Email, c.PhoneNo, c.Designation,
                    c.AdharCardNo, c.PANNo, c.CompanyId,
                    CompanyName = c.Company != null ? c.Company.CompanyName : null,
                    c.CreatedDate,
                    Addresses = c.Addresses.Select(a => new {
                        a.Id, a.AddressType, a.AddressLine1, a.AddressLine2,
                        a.City, a.State, a.Pincode, a.Country, a.IsDefault
                    })
                })
                .FirstOrDefaultAsync();

            if (customer == null) return NotFound();
            return Ok(customer);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CustomerMaster dto)
        {
            var customer = new CustomerMaster
            {
                CompanyId       = dto.CompanyId,
                FirstName       = dto.FirstName,
                LastName        = dto.LastName,
                Email           = dto.Email,
                PhoneNo         = dto.PhoneNo,
                Designation     = dto.Designation,
                AdharCardNo     = dto.AdharCardNo,
                PANNo           = dto.PANNo,
                AssignedToUserId = dto.AssignedToUserId,
                CreatedDate     = DateTime.UtcNow,
                UpdatedDate     = DateTime.UtcNow
            };
            _db.Customers.Add(customer);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = customer.Id }, new { customer.Id, customer.FirstName, customer.LastName });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CustomerMaster dto)
        {
            var customer = await _db.Customers.FindAsync(id);
            if (customer == null || customer.IsDelete) return NotFound();

            customer.CompanyId        = dto.CompanyId;
            customer.FirstName        = dto.FirstName;
            customer.LastName         = dto.LastName;
            customer.Email            = dto.Email;
            customer.PhoneNo          = dto.PhoneNo;
            customer.Designation      = dto.Designation;
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
