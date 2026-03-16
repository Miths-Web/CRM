using CRM.Infrastructure.Data;
using ClosedXML.Excel;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ImportExportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ImportExportController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ===================== EXPORT =====================

        /// <summary>GET /api/importexport/leads/export/csv — Export all leads to CSV</summary>
        [HttpGet("leads/export/csv")]
        public async Task<IActionResult> ExportLeadsCsv()
        {
            var leads = await _context.Leads.AsNoTracking().ToListAsync();
            var stream = new MemoryStream();
            var writer = new StreamWriter(stream, leaveOpen: true);
            var csv    = new CsvWriter(writer, CultureInfo.InvariantCulture);

            csv.WriteHeader<LeadCsvRow>();
            await csv.NextRecordAsync();
            foreach (var l in leads)
            {
                csv.WriteRecord(new LeadCsvRow
                {
                    Title = l.Title, FirstName = l.FirstName, LastName = l.LastName,
                    Email = l.Email, Phone = l.Phone, Company = l.Company,
                    Status = l.Status.ToString(), Source = l.Source?.ToString(),
                    EstimatedValue = l.EstimatedValue, CreatedAt = l.CreatedAt
                });
                await csv.NextRecordAsync();
            }
            await writer.FlushAsync();
            stream.Position = 0;
            return File(stream, "text/csv", $"leads_{DateTime.UtcNow:yyyyMMdd}.csv");
        }

        /// <summary>GET /api/importexport/customers/export/csv — Export all customers to CSV</summary>
        [HttpGet("customers/export/csv")]
        public async Task<IActionResult> ExportCustomersCsv()
        {
            var customers = await _context.Customers.Include(c => c.Company).AsNoTracking().ToListAsync();
            var stream   = new MemoryStream();
            var writer   = new StreamWriter(stream, leaveOpen: true);
            var csv      = new CsvWriter(writer, CultureInfo.InvariantCulture);

            csv.WriteHeader<CustomerCsvRow>();
            await csv.NextRecordAsync();
            foreach (var c in customers)
            {
                csv.WriteRecord(new CustomerCsvRow
                {
                    FirstName = c.FirstName, LastName = c.LastName,
                    Email = c.Email, Phone = c.PhoneNo, CompanyName = c.Company?.CompanyName,
                    CreatedAt = c.CreatedDate
                });
                await csv.NextRecordAsync();
            }
            await writer.FlushAsync();
            stream.Position = 0;
            return File(stream, "text/csv", $"customers_{DateTime.UtcNow:yyyyMMdd}.csv");
        }

        /// <summary>GET /api/importexport/leads/export/excel — Export all leads to Excel</summary>
        [HttpGet("leads/export/excel")]
        public async Task<IActionResult> ExportLeadsExcel()
        {
            var leads = await _context.Leads.AsNoTracking().ToListAsync();
            using var workbook  = new XLWorkbook();
            var sheet = workbook.Worksheets.Add("Leads");

            // Headers
            var headers = new[] { "Title","First Name","Last Name","Email","Phone","Company","Status","Source","Value","Created At" };
            for (int i = 0; i < headers.Length; i++)
            {
                sheet.Cell(1, i + 1).Value = headers[i];
                sheet.Cell(1, i + 1).Style.Font.Bold = true;
                sheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#4472C4");
                sheet.Cell(1, i + 1).Style.Font.FontColor = XLColor.White;
            }

            // Data rows
            for (int row = 0; row < leads.Count; row++)
            {
                var l = leads[row];
                sheet.Cell(row + 2, 1).Value  = l.Title;
                sheet.Cell(row + 2, 2).Value  = l.FirstName;
                sheet.Cell(row + 2, 3).Value  = l.LastName;
                sheet.Cell(row + 2, 4).Value  = l.Email;
                sheet.Cell(row + 2, 5).Value  = l.Phone;
                sheet.Cell(row + 2, 6).Value  = l.Company;
                sheet.Cell(row + 2, 7).Value  = l.Status.ToString();
                sheet.Cell(row + 2, 8).Value  = l.Source?.ToString();
                sheet.Cell(row + 2, 9).Value  = (double?)l.EstimatedValue ?? 0;
                sheet.Cell(row + 2, 10).Value = l.CreatedAt.ToString("yyyy-MM-dd");
            }

            sheet.Columns().AdjustToContents();

            var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;
            return File(stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"leads_{DateTime.UtcNow:yyyyMMdd}.xlsx");
        }

        // ===================== IMPORT =====================

        /// <summary>POST /api/importexport/leads/import/csv — Import leads from CSV file</summary>
        [HttpPost("leads/import/csv")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> ImportLeadsCsv(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded." });
            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Only CSV files are allowed." });

            var imported = 0;
            var errors   = new List<string>();

            using var reader = new StreamReader(file.OpenReadStream());
            using var csv    = new CsvReader(reader, CultureInfo.InvariantCulture);

            var records = csv.GetRecords<LeadCsvRow>().ToList();
            foreach (var (row, idx) in records.Select((r, i) => (r, i + 2)))
            {
                if (string.IsNullOrWhiteSpace(row.Title))
                {
                    errors.Add($"Row {idx}: Title is required.");
                    continue;
                }

                _context.Leads.Add(new Domain.Entities.Lead
                {
                    Title          = row.Title,
                    FirstName      = row.FirstName,
                    LastName       = row.LastName,
                    Email          = row.Email,
                    Phone          = row.Phone,
                    Company        = row.Company,
                    EstimatedValue = row.EstimatedValue,
                    CreatedAt      = DateTime.UtcNow,
                    UpdatedAt      = DateTime.UtcNow
                });
                imported++;
            }

            await _context.SaveChangesAsync();

            return Ok(new { Imported = imported, Errors = errors, TotalRows = records.Count });
        }

        // ===================== CSV ROW MODELS =====================
        private class LeadCsvRow
        {
            public string? Title { get; set; }
            public string? FirstName { get; set; }
            public string? LastName { get; set; }
            public string? Email { get; set; }
            public string? Phone { get; set; }
            public string? Company { get; set; }
            public string? Status { get; set; }
            public string? Source { get; set; }
            public decimal? EstimatedValue { get; set; }
            public DateTime CreatedAt { get; set; }
        }

        private class CustomerCsvRow
        {
            public string? FirstName { get; set; }
            public string? LastName { get; set; }
            public string? Email { get; set; }
            public string? Phone { get; set; }
            public string? CompanyName { get; set; }
            public DateTime CreatedAt { get; set; }
        }
    }
}
