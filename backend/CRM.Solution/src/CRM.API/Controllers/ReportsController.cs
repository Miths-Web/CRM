using CRM.Application.Features.Reports;
using CRM.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
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

        /// <summary>GET /api/reports/dashboard — Full CRM dashboard KPIs (All logged-in users)</summary>
        [HttpGet("dashboard")]
        // All authenticated roles can see KPIs
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

        /// <summary>GET /api/reports/sales — Monthly sales breakdown from Deals (kept for compatibility)</summary>
        [HttpGet("sales")]
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

            return Ok(new SalesReportDto
            {
                Period           = year.ToString(),
                Revenue          = deals.Sum(d => d.Value),
                DealsWon         = deals.Count,
                DealsLost        = lostDeals,
                MonthlyBreakdown = monthlyBreakdown
            });
        }

        /// <summary>GET /api/reports/business-summary — Real revenue from Orders, Invoices & Payments</summary>
        [HttpGet("business-summary")]
        public async Task<IActionResult> GetBusinessSummary([FromQuery] int year = 0)
        {
            if (year == 0) year = DateTime.UtcNow.Year;

            // ── Orders ──────────────────────────────────────────────
            var orders = await _context.Orders
                .Where(o => !o.IsDelete && o.OrderDate.Year == year)
                .ToListAsync();

            var totalOrderValue  = orders.Sum(o => o.TotalAmount);
            var totalOrderCount  = orders.Count;
            var draftOrders      = orders.Count(o => o.Status == "Draft");
            var confirmedOrders  = orders.Count(o => o.Status == "Confirmed");
            var activeOrders     = orders.Count(o => o.Status == "Active");
            var completedOrders  = orders.Count(o => o.Status == "Completed");
            var cancelledOrders  = orders.Count(o => o.Status == "Cancelled");

            // ── Invoices ─────────────────────────────────────────────
            var invoices = await _context.Invoices
                .Where(i => !i.IsDelete && i.InvoiceDate.Year == year)
                .ToListAsync();

            var totalBilled      = invoices.Sum(i => i.TotalAmount);
            var totalCollected   = invoices.Sum(i => i.PaidAmount);
            var totalOutstanding = totalBilled - totalCollected;
            var paidInvoices     = invoices.Count(i => i.PaymentStatus == "Paid");
            var unpaidInvoices   = invoices.Count(i => i.PaymentStatus == "Unpaid");
            var partialInvoices  = invoices.Count(i => i.PaymentStatus == "PartiallyPaid");

            // ── Payments ─────────────────────────────────────────────
            var payments = await _context.Payments
                .Where(p => p.PaymentDate.Year == year)
                .ToListAsync();

            var totalPaymentsReceived = payments.Sum(p => p.Amount);
            var totalPaymentCount     = payments.Count;

            // ── Monthly Breakdown (Orders by month) ─────────────────
            var monthlyOrders = Enumerable.Range(1, 12).Select(month => new
            {
                Month        = new DateTime(year, month, 1).ToString("MMM"),
                OrderValue   = orders.Where(o => o.OrderDate.Month == month).Sum(o => o.TotalAmount),
                OrderCount   = orders.Count(o => o.OrderDate.Month == month),
                InvoicedAmt  = invoices.Where(i => i.InvoiceDate.Month == month).Sum(i => i.TotalAmount),
                CollectedAmt = payments.Where(p => p.PaymentDate.Month == month).Sum(p => p.Amount)
            }).ToList();

            // ── Order Status Breakdown ───────────────────────────────
            var orderStatusBreakdown = new[]
            {
                new { Status = "Draft",     Count = draftOrders },
                new { Status = "Confirmed", Count = confirmedOrders },
                new { Status = "Active",    Count = activeOrders },
                new { Status = "Completed", Count = completedOrders },
                new { Status = "Cancelled", Count = cancelledOrders }
            };

            // ── Top 5 Customers by Revenue ───────────────────────────
            var topCustomers = await _context.Invoices
                .Where(i => !i.IsDelete && i.InvoiceDate.Year == year && i.CustomerId != Guid.Empty)
                .Include(i => i.Customer)
                .Where(i => i.Customer != null)
                .GroupBy(i => new { i.CustomerId, i.Customer!.FirstName, i.Customer.LastName })
                .Select(g => new {
                    CustomerName = g.Key.FirstName + " " + g.Key.LastName,
                    TotalBilled  = g.Sum(i => i.TotalAmount)
                })
                .OrderByDescending(x => x.TotalBilled)
                .Take(5)
                .ToListAsync();

            return Ok(new
            {
                Year              = year,
                // Orders
                TotalOrderValue   = totalOrderValue,
                TotalOrderCount   = totalOrderCount,
                DraftOrders       = draftOrders,
                ConfirmedOrders   = confirmedOrders,
                ActiveOrders      = activeOrders,
                CompletedOrders   = completedOrders,
                CancelledOrders   = cancelledOrders,
                // Invoices
                TotalBilled       = totalBilled,
                TotalCollected    = totalCollected,
                TotalOutstanding  = totalOutstanding,
                PaidInvoices      = paidInvoices,
                UnpaidInvoices    = unpaidInvoices,
                PartialInvoices   = partialInvoices,
                // Payments
                TotalPaymentsReceived = totalPaymentsReceived,
                TotalPaymentCount     = totalPaymentCount,
                // Charts
                MonthlyBreakdown      = monthlyOrders,
                OrderStatusBreakdown  = orderStatusBreakdown,
                // Top Customers
                TopCustomers          = topCustomers
            });

        }

        /// <summary>GET /api/reports/leads — Lead source breakdown (All logged-in users)</summary>
        [HttpGet("leads")]
        // All authenticated roles can see lead counts
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

        /// <summary>GET /api/reports/activity — Global recent activity feed (Dashboard timeline)</summary>
        [HttpGet("activity")]
        public async Task<IActionResult> GetRecentActivity()
        {
            // Instead of relying solely on AuditLogs, we gather recent real entities
            // to ensure there's always visual activity on the dashboard.
            var recentTasks = await _context.CrmTasks.Include(t => t.AssignedToUser)
                                .OrderByDescending(t => t.CreatedAt).Take(5).ToListAsync();
            var recentDeals = await _context.Deals.OrderByDescending(d => d.UpdatedAt).Take(5).ToListAsync();
            var recentLeads = await _context.Leads.OrderByDescending(l => l.CreatedAt).Take(5).ToListAsync();
            var recentCustomers = await _context.Customers.OrderByDescending(c => c.CreatedDate).Take(5).ToListAsync();

            var recentProducts = await _context.Products.OrderByDescending(p => p.CreatedDate).Take(5).ToListAsync();
            var recentCompanies = await _context.Companies.OrderByDescending(c => c.CreatedDate).Take(5).ToListAsync();
            var recentOrders = await _context.Orders.OrderByDescending(o => o.OrderDate).Take(5).ToListAsync();

            var activities = new List<object>();

            foreach(var t in recentTasks) {
                activities.Add(new {
                    user = t.AssignedToUser != null ? $"{t.AssignedToUser.FirstName[0]}" : "S",
                    name = t.AssignedToUser != null ? $"{t.AssignedToUser.FirstName} {t.AssignedToUser.LastName}" : "System",
                    action = t.IsCompleted ? "completed task" : "created task",
                    target = t.Title,
                    time = FormatTimeAgo(t.UpdatedAt),
                    timestamp = t.UpdatedAt
                });
            }

            foreach(var d in recentDeals) {
                activities.Add(new {
                    user = "S", name = "System",
                    action = d.Status == Domain.Enums.DealStatus.Won ? "closed won" : "moved deal",
                    target = d.Title,
                    time = FormatTimeAgo(d.UpdatedAt),
                    timestamp = d.UpdatedAt
                });
            }

            foreach(var l in recentLeads) {
                activities.Add(new {
                    user = "S", name = "System",
                    action = "created new lead",
                    target = $"{l.FirstName} {l.LastName}",
                    time = FormatTimeAgo(l.CreatedAt),
                    timestamp = l.CreatedAt
                });
            }

            foreach(var c in recentCustomers) {
                activities.Add(new {
                    user = "S", name = "System",
                    action = "added customer",
                    target = $"{c.FirstName} {c.LastName}",
                    time = FormatTimeAgo(c.CreatedDate),
                    timestamp = c.CreatedDate
                });
            }

            foreach(var p in recentProducts) {
                activities.Add(new {
                    user = "S", name = "System",
                    action = "added product",
                    target = p.ProductName,
                    time = FormatTimeAgo(p.CreatedDate),
                    timestamp = p.CreatedDate
                });
            }

            foreach(var cp in recentCompanies) {
                activities.Add(new {
                    user = "S", name = "System",
                    action = "added company",
                    target = cp.CompanyName,
                    time = FormatTimeAgo(cp.CreatedDate),
                    timestamp = cp.CreatedDate
                });
            }

            foreach(var o in recentOrders) {
                activities.Add(new {
                    user = "S", name = "System",
                    action = "created order",
                    target = string.IsNullOrEmpty(o.OrderNumber) ? "New Order" : o.OrderNumber,
                    time = FormatTimeAgo(o.OrderDate),
                    timestamp = o.OrderDate
                });
            }

            var sorted = activities.OrderByDescending(a => (DateTime)((dynamic)a).timestamp).Take(15).ToList();
            return Ok(sorted);
        }

        /// <summary>GET /api/reports/notifications — Topbar alerts</summary>
        [HttpGet("notifications")]
        public async Task<IActionResult> GetNotifications()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            // Fetch tasks assigned to user that are due soon or overdue
            var myTasks = await _context.CrmTasks
                .Where(t => t.AssignedToUserId == userId && !t.IsCompleted)
                .OrderBy(t => t.DueDate)
                .Take(5)
                .ToListAsync();

            var notifications = new List<object>();
            foreach(var t in myTasks) {
                bool isOverdue = t.DueDate.HasValue && t.DueDate.Value < DateTime.UtcNow;
                notifications.Add(new {
                    text = isOverdue ? $"Overdue Task: {t.Title}" : $"Upcoming Task: {t.Title}",
                    time = t.DueDate.HasValue ? FormatTimeAgo(t.DueDate.Value) : "No Due Date",
                    read = false
                });
            }

            // Fetch a recent invoice that is unpaid
            var unpaidInvoice = await _context.Invoices.Where(i => i.PaymentStatus == "Unpaid").OrderByDescending(i => i.CreatedDate).FirstOrDefaultAsync();
            if (unpaidInvoice != null) {
                notifications.Add(new {
                    text = $"Invoice {unpaidInvoice.InvoiceNumber} is strictly unpaid.",
                    time = FormatTimeAgo(unpaidInvoice.CreatedDate),
                    read = false
                });
            }

            return Ok(notifications);
        }

        private string FormatTimeAgo(DateTime dt)
        {
            var span = DateTime.UtcNow - dt;
            if (span.TotalMinutes < 60) return $"{(int)Math.Max(1, span.TotalMinutes)} mins ago";
            if (span.TotalHours < 24) return $"{(int)span.TotalHours} hrs ago";
            if (span.TotalDays < 30) return $"{(int)span.TotalDays} days ago";
            return dt.ToString("MMM dd");
        }
    }
}
