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
    [Route("api/companies")]
    [Authorize]
    public class CompaniesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public CompaniesController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _db.Companies.Where(c => !c.IsDelete);
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(c => c.CompanyName.Contains(search) || (c.Email != null && c.Email.Contains(search)));

            var total = await query.CountAsync();
            var items = await query
                .OrderBy(c => c.CompanyName)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(c => new {
                    c.Id, c.CompanyName, c.Email, c.PhoneNo, c.GSTNo,
                    c.IndustryType, c.Website, c.LogoUrl,
                    c.OwnerFirstName, c.OwnerLastName, c.CreatedDate,
                    CustomerCount = c.Customers.Count(cu => !cu.IsDelete)
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var company = await _db.Companies
                .Include(c => c.Customers.Where(cu => !cu.IsDelete))
                .Where(c => c.Id == id && !c.IsDelete)
                .Select(c => new {
                    c.Id, c.CompanyName, c.CompanyAddress, c.OwnerFirstName, c.OwnerLastName,
                    c.Email, c.PhoneNo, c.Website, c.GSTNo, c.PANNo,
                    c.IndustryType, c.LogoUrl, c.CreatedDate,
                    Customers = c.Customers.Select(cu => new { cu.Id, cu.FirstName, cu.LastName, cu.Email, cu.Designation })
                })
                .FirstOrDefaultAsync();

            if (company == null) return NotFound();
            return Ok(company);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CompanyMaster dto)
        {
            var company = new CompanyMaster
            {
                CompanyName    = dto.CompanyName,
                CompanyAddress = dto.CompanyAddress,
                OwnerFirstName = dto.OwnerFirstName,
                OwnerLastName  = dto.OwnerLastName,
                Email          = dto.Email,
                PhoneNo        = dto.PhoneNo,
                Website        = dto.Website,
                GSTNo          = dto.GSTNo,
                PANNo          = dto.PANNo,
                IndustryType   = dto.IndustryType,
                LogoUrl        = dto.LogoUrl,
                CreatedDate    = DateTime.UtcNow,
                UpdatedDate    = DateTime.UtcNow
            };
            _db.Companies.Add(company);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = company.Id }, new { company.Id, company.CompanyName });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CompanyMaster dto)
        {
            var company = await _db.Companies.FindAsync(id);
            if (company == null || company.IsDelete) return NotFound();

            company.CompanyName    = dto.CompanyName;
            company.CompanyAddress = dto.CompanyAddress;
            company.OwnerFirstName = dto.OwnerFirstName;
            company.OwnerLastName  = dto.OwnerLastName;
            company.Email          = dto.Email;
            company.PhoneNo        = dto.PhoneNo;
            company.Website        = dto.Website;
            company.GSTNo          = dto.GSTNo;
            company.PANNo          = dto.PANNo;
            company.IndustryType   = dto.IndustryType;
            company.LogoUrl        = dto.LogoUrl;
            company.UpdatedDate    = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Company updated." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var company = await _db.Companies.FindAsync(id);
            if (company == null || company.IsDelete) return NotFound();
            company.IsDelete    = true;
            company.UpdatedDate = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Company deleted." });
        }
    }
}
