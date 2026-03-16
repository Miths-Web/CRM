using CRM.Application.Features.Reports;
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
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>GET /api/reports/dashboard — Full CRM dashboard KPIs (Admin, Manager, Sales Rep)</summary>
        [HttpGet("dashboard")]
        [Authorize(Roles = "Admin,Manager,Sales Rep")]
        public async Task<IActionResult> GetDashboard()
        {
            var totalContacts = await _context.Customers.CountAsync(c => !c.IsDelete);
            var totalLeads    = await _context.Leads.CountAsync();
            var totalDeals    = await _context.Deals.CountAsync();
            var openTasks     = await _context.CrmTasks.CountAsync(t => !t.IsCompleted);
            var overdueTasks  = await _context.CrmTasks.CountAsync(t => !t.IsCompleted && t.DueDate < DateTime.UtcNow);
            var upcomingEvents = await _context.Events.CountAsync(e => e.StartDateTime > DateTime.UtcNow);

            var pipelineValue  = await _context.Deals.Where(d => d.Status == Domain.Enums.DealStatus.Open).SumAsync(d => (decimal?)d.Value) ?? 0;
            var closedWonValue = await _context.Deals.Where(d => d.Status == Domain.Enums.DealStatus.Won).SumAsync(d => (decimal?)d.Value) ?? 0;

            var totalLeadsCount    = await _context.Leads.CountAsync();
            var convertedLeads     = await _context.Leads.CountAsync(l => l.Status == Domain.Enums.LeadStatus.Converted);
            var leadConversionRate = totalLeadsCount > 0 ? Math.Round((double)convertedLeads / totalLeadsCount * 100, 1) : 0;

            var totalClosedDeals = await _context.Deals.CountAsync(d =>
                d.Status == Domain.Enums.DealStatus.Won || d.Status == Domain.Enums.DealStatus.Lost);
            var wonDeals     = await _context.Deals.CountAsync(d => d.Status == Domain.Enums.DealStatus.Won);
            var dealWinRate  = totalClosedDeals > 0 ? Math.Round((double)wonDeals / totalClosedDeals * 100, 1) : 0;
            var avgDealSize  = wonDeals > 0 ? closedWonValue / wonDeals : 0;

            var topDeals = await _context.Deals
                .Where(d => d.Status == Domain.Enums.DealStatus.Open)
                .Include(d => d.Stage)
                .Include(d => d.Company)
                .OrderByDescending(d => d.Value)
                .Take(5)
                .Select(d => new TopDealDto
                {
                    Id          = d.Id,
                    Title       = d.Title,
                    Value       = d.Value,
                    StageName   = d.Stage != null ? d.Stage.Name : "—",
                    CompanyName = d.Company != null ? d.Company.CompanyName : null
                })
                .ToListAsync();

            var dashboard = new DashboardDto
            {
                TotalContacts      = totalContacts,
                TotalLeads         = totalLeads,
                TotalDeals         = totalDeals,
                OpenTasks          = openTasks,
                OverdueTasks       = overdueTasks,
                UpcomingEvents     = upcomingEvents,
                TotalPipelineValue = pipelineValue,
                TotalClosedWonValue = closedWonValue,
                AverageDealSize    = avgDealSize,
                LeadConversionRate = leadConversionRate,
                DealWinRate        = dealWinRate,
                TopDeals           = topDeals
            };

            return Ok(dashboard);
        }

        /// <summary>GET /api/reports/sales — Monthly sales breakdown (Admin & Manager only)</summary>
        [HttpGet("sales")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetSalesReport([FromQuery] int year = 0)
        {
            if (year == 0) year = DateTime.UtcNow.Year;

            var deals = await _context.Deals
                .Where(d => d.Status == Domain.Enums.DealStatus.Won
                         && d.ActualCloseDate.HasValue
                         && d.ActualCloseDate.Value.Year == year)
                .ToListAsync();

            var monthlyBreakdown = Enumerable.Range(1, 12).Select(month => new MonthlySalesDto
            {
                Month      = new DateTime(year, month, 1).ToString("MMMM"),
                Revenue    = deals.Where(d => d.ActualCloseDate!.Value.Month == month).Sum(d => d.Value),
                DealsCount = deals.Count(d => d.ActualCloseDate!.Value.Month == month)
            }).ToList();

            var lostDeals = await _context.Deals.CountAsync(d =>
                d.Status == Domain.Enums.DealStatus.Lost
                && d.ActualCloseDate.HasValue
                && d.ActualCloseDate.Value.Year == year);

            var report = new SalesReportDto
            {
                Period           = year.ToString(),
                Revenue          = deals.Sum(d => d.Value),
                DealsWon         = deals.Count,
                DealsLost        = lostDeals,
                MonthlyBreakdown = monthlyBreakdown
            };

            return Ok(report);
        }

        /// <summary>GET /api/reports/leads — Lead source breakdown (Admin, Manager, Sales Rep)</summary>
        [HttpGet("leads")]
        [Authorize(Roles = "Admin,Manager,Sales Rep")]
        public async Task<IActionResult> GetLeadReport()
        {
            var bySource = await _context.Leads
                .GroupBy(l => l.Source)
                .Select(g => new { Source = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            var byStatus = await _context.Leads
                .GroupBy(l => l.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            return Ok(new { BySource = bySource, ByStatus = byStatus });
        }
    }
}
