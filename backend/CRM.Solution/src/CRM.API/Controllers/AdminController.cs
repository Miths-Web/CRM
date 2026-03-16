using CRM.Domain.Entities;
using CRM.Domain.Enums;
using CRM.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public AdminController(ApplicationDbContext context) => _context = context;

        // ─── DELETE: /api/admin/clear-all ─────────────────────────────────
        [HttpDelete("clear-all")]
        public async Task<IActionResult> ClearAllData()
        {
            _context.AuditLogs.RemoveRange(_context.AuditLogs);
            _context.LiveChatMessages.RemoveRange(_context.LiveChatMessages);
            _context.LiveChatSessions.RemoveRange(_context.LiveChatSessions);
            _context.ChatMessages.RemoveRange(_context.ChatMessages);
            _context.Documents.RemoveRange(_context.Documents);
            _context.Notes.RemoveRange(_context.Notes);
            _context.Emails.RemoveRange(_context.Emails);
            _context.Events.RemoveRange(_context.Events);
            _context.CrmTasks.RemoveRange(_context.CrmTasks);
            _context.Payments.RemoveRange(_context.Payments);
            _context.Invoices.RemoveRange(_context.Invoices);
            _context.OrderItems.RemoveRange(_context.OrderItems);
            _context.Orders.RemoveRange(_context.Orders);
            _context.Products.RemoveRange(_context.Products);
            _context.Deals.RemoveRange(_context.Deals);
            _context.Leads.RemoveRange(_context.Leads);
            _context.CustomerAddresses.RemoveRange(_context.CustomerAddresses);
            _context.Customers.RemoveRange(_context.Customers);
            _context.Companies.RemoveRange(_context.Companies);
            await _context.SaveChangesAsync();
            return Ok(new { message = "All business data cleared. Users and roles preserved." });
        }

        // ─── POST: /api/admin/seed-demo ───────────────────────────────────
        [HttpPost("seed-demo")]
        public async Task<IActionResult> SeedDemoData()
        {
            if (await _context.Companies.AnyAsync())
                return BadRequest(new { message = "Demo data already exists. Clear all data first, then seed again." });

            var now = DateTime.UtcNow;

            // ── Companies ─────────────────────────────────────────────────
            var comp1 = new CompanyMaster { CompanyName = "TechNova Solutions Pvt Ltd", Email = "info@technova.in",          PhoneNo = "9876543210", OwnerFirstName = "Rakesh", OwnerLastName = "Mehta",  GSTNo = "27AAPFU0939F1ZV", PANNo = "AAPFU0939F", CompanyAddress = "Tower B, BKC, Mumbai - 400051",         CreatedDate = now.AddDays(-90) };
            var comp2 = new CompanyMaster { CompanyName = "Sunrise Exports Ltd",        Email = "contact@sunriseexports.com", PhoneNo = "9123456789", OwnerFirstName = "Priya",  OwnerLastName = "Sharma", GSTNo = "29AABCS1429B1Z1", PANNo = "AABCS1429B", CompanyAddress = "14 Industrial Area, Bengaluru - 560058", CreatedDate = now.AddDays(-60) };
            var comp3 = new CompanyMaster { CompanyName = "Bharat Fintech Corp",        Email = "bd@bharatfintech.co.in",    PhoneNo = "8800112233", OwnerFirstName = "Arjun",  OwnerLastName = "Patel",  GSTNo = "24AADCB2230M1Z3", PANNo = "AADCB2230M", CompanyAddress = "Cyber Hub, Gurugram - 122002",           CreatedDate = now.AddDays(-45) };
            _context.Companies.AddRange(comp1, comp2, comp3);
            await _context.SaveChangesAsync();

            // ── Customers ─────────────────────────────────────────────────
            var cust1 = new CustomerMaster { CompanyId = comp1.Id, FirstName = "Ananya", LastName = "Verma", Email = "ananya@technova.in",          PhoneNo = "9001234567", Designation = "CTO",             CreatedDate = now.AddDays(-85) };
            var cust2 = new CustomerMaster { CompanyId = comp1.Id, FirstName = "Rohit",  LastName = "Singh", Email = "rohit.s@technova.in",         PhoneNo = "9812345678", Designation = "Procurement Head", CreatedDate = now.AddDays(-80) };
            var cust3 = new CustomerMaster { CompanyId = comp2.Id, FirstName = "Meera",  LastName = "Joshi", Email = "meera@sunriseexports.com",    PhoneNo = "8765432109", Designation = "Director",         CreatedDate = now.AddDays(-55) };
            var cust4 = new CustomerMaster { CompanyId = comp3.Id, FirstName = "Vikram", LastName = "Nair",  Email = "vikram@bharatfintech.co.in",  PhoneNo = "7700112233", Designation = "VP Business",      CreatedDate = now.AddDays(-40) };
            _context.Customers.AddRange(cust1, cust2, cust3, cust4);
            await _context.SaveChangesAsync();

            // ── Leads ─────────────────────────────────────────────────────
            _context.Leads.AddRange(
                new Lead { Title = "TechNova — Enterprise CRM License",  FirstName = "Rohit",  LastName = "Kumar",   Email = "rohit.k@startup.io",    Phone = "9988776655", Company = "Startup.io",      EstimatedValue = 450000m, Source = LeadSource.Website,  Status = LeadStatus.Qualified, Description = "Interested in 50-user enterprise suite.",   CreatedAt = now.AddDays(-30) },
                new Lead { Title = "Global Finserv — Support Module",    FirstName = "Sneha",  LastName = "Agarwal", Email = "sneha@globalfinserv.in", Phone = "8877665544", Company = "Global Finserv",  EstimatedValue = 120000m, Source = LeadSource.Referral, Status = LeadStatus.Contacted, Description = "Live chat and ticketing support needed.",    CreatedAt = now.AddDays(-20) },
                new Lead { Title = "MegaMart — B2B Wholesale CRM",      FirstName = "Deepak", LastName = "Chandra", Email = "deepak@megamart.in",    Phone = "9900887766", Company = "MegaMart Retail", EstimatedValue = 800000m, Source = LeadSource.Event,    Status = LeadStatus.Qualified, Description = "Large order — 200+ seats expansion.",       CreatedAt = now.AddDays(-10) },
                new Lead { Title = "NovaTech — 30-Day Pilot",           FirstName = "Aarav",  LastName = "Mishra",  Email = "aarav@novatech.com",    Phone = "9112233445", Company = "NovaTech Systems",EstimatedValue = 75000m,  Source = LeadSource.Social,   Status = LeadStatus.New,       Description = "Wants 30-day pilot before committing.",     CreatedAt = now.AddDays(-5)  }
            );

            // ── Deals ─────────────────────────────────────────────────────
            var deal1 = new Deal { Title = "TechNova — Annual CRM Contract",  CustomerId = cust1.Id, CompanyId = comp1.Id, Value = 550000m, ExpectedCloseDate = now.AddDays(15), Status = DealStatus.Won,  ActualCloseDate = now.AddDays(-5),  StageId = 5, Description = "Full enterprise + training & onboarding.", CreatedAt = now.AddDays(-25) };
            var deal2 = new Deal { Title = "Sunrise Exports — Orders Module", CustomerId = cust3.Id, CompanyId = comp2.Id, Value = 210000m, ExpectedCloseDate = now.AddDays(30), Status = DealStatus.Won,  ActualCloseDate = now.AddDays(-40), StageId = 5, Description = "Order management + invoice automation.",    CreatedAt = now.AddDays(-55) };
            var deal3 = new Deal { Title = "Bharat Fintech — SME Plan",      CustomerId = cust4.Id, CompanyId = comp3.Id, Value = 350000m, ExpectedCloseDate = now.AddDays(7),  Status = DealStatus.Open, StageId = 3, Description = "50 seats + priority support SLA.",          CreatedAt = now.AddDays(-8)  };
            var deal4 = new Deal { Title = "NovaTech — 30-Day Pilot",        CustomerId = cust1.Id, CompanyId = comp1.Id, Value = 75000m,  ExpectedCloseDate = now.AddDays(15), Status = DealStatus.Lost, ActualCloseDate = now.AddDays(-15), StageId = 6, Description = "Lost to competitor due to pricing.",     CreatedAt = now.AddDays(-60) };
            var deal5 = new Deal { Title = "CloudSync — Server Migration",   CustomerId = cust2.Id, CompanyId = comp2.Id, Value = 120000m, ExpectedCloseDate = now.AddDays(45), Status = DealStatus.Open, StageId = 1, Description = "Initial discussion for entire server DB migration.", CreatedAt = now.AddDays(-2) };
            var deal6 = new Deal { Title = "Global Logistics — ERP Suite",   CustomerId = cust3.Id, CompanyId = comp3.Id, Value = 950000m, ExpectedCloseDate = now.AddDays(10), Status = DealStatus.Open, StageId = 4, Description = "Final negotiation phase, contract redlining.",       CreatedAt = now.AddDays(-45) };
            _context.Deals.AddRange(deal1, deal2, deal3, deal4, deal5, deal6);

            // ── Products ──────────────────────────────────────────────────
            var prod1 = new Product { ProductName = "CRM Enterprise License (Annual)", SKU = "CRM-ENT-001", Category = "Software", Description = "Full access to all CRM modules.",    UnitPrice = 12000m, TaxRate = 18m, IsActive = true };
            var prod2 = new Product { ProductName = "CRM SME Starter Pack",            SKU = "CRM-SME-001", Category = "Software", Description = "Up to 20 users with core modules.",  UnitPrice = 4500m,  TaxRate = 18m, IsActive = true };
            var prod3 = new Product { ProductName = "Onboarding & Training (8 hrs)",  SKU = "SVC-TRN-001", Category = "Service",  Description = "Trainer-led onboarding sessions.",     UnitPrice = 8000m,  TaxRate = 18m, IsActive = true };
            var prod4 = new Product { ProductName = "Priority Support SLA (Annual)",  SKU = "SVC-SLA-001", Category = "Service",  Description = "4-hr response SLA + account manager.", UnitPrice = 18000m, TaxRate = 18m, IsActive = true };
            _context.Products.AddRange(prod1, prod2, prod3, prod4);
            await _context.SaveChangesAsync();

            // ── Orders ────────────────────────────────────────────────────
            var order1 = new OrderMaster { OrderNumber = "ORD-2025-0001", CustomerId = cust1.Id, CompanyId = comp1.Id, OrderDate = now.AddDays(-20), Status = "Confirmed", SubTotal = 500000m, TaxAmount = 90000m,  TotalAmount = 590000m, Notes = "PO No: TN-2025-001." };
            var order2 = new OrderMaster { OrderNumber = "ORD-2025-0002", CustomerId = cust3.Id, CompanyId = comp2.Id, OrderDate = now.AddDays(-10), Status = "Pending",   SubTotal = 210000m, TaxAmount = 37800m, TotalAmount = 247800m, Notes = "Awaiting final approval." };
            _context.Orders.AddRange(order1, order2);
            await _context.SaveChangesAsync();

            // ── Order Items ───────────────────────────────────────────────
            _context.OrderItems.AddRange(
                new OrderItem { OrderId = order1.Id, ProductId = prod1.Id, Quantity = 40, UnitPrice = prod1.UnitPrice, TaxRate = 18m, LineTotal = prod1.UnitPrice * 40 * 1.18m },
                new OrderItem { OrderId = order1.Id, ProductId = prod3.Id, Quantity = 2,  UnitPrice = prod3.UnitPrice, TaxRate = 18m, LineTotal = prod3.UnitPrice * 2  * 1.18m },
                new OrderItem { OrderId = order2.Id, ProductId = prod2.Id, Quantity = 30, UnitPrice = prod2.UnitPrice, TaxRate = 18m, LineTotal = prod2.UnitPrice * 30 * 1.18m },
                new OrderItem { OrderId = order2.Id, ProductId = prod4.Id, Quantity = 1,  UnitPrice = prod4.UnitPrice, TaxRate = 18m, LineTotal = prod4.UnitPrice * 1.18m  }
            );

            // ── Invoices ──────────────────────────────────────────────────
            var inv1 = new Invoice { OrderId = order1.Id, CustomerId = cust1.Id, CompanyId = comp1.Id, InvoiceNumber = "INV-2025-0001", InvoiceDate = now.AddDays(-18), DueDate = now.AddDays(12), SubTotal = 500000m, TaxAmount = 90000m,  TotalAmount = 590000m, PaymentStatus = "Unpaid", Notes = "Net-30 payment terms." };
            var inv2 = new Invoice { OrderId = order2.Id, CustomerId = cust3.Id, CompanyId = comp2.Id, InvoiceNumber = "INV-2025-0002", InvoiceDate = now.AddDays(-8),  DueDate = now.AddDays(22), SubTotal = 210000m, TaxAmount = 37800m, TotalAmount = 247800m, PaymentStatus = "Unpaid", Notes = "Pending approval." };
            _context.Invoices.AddRange(inv1, inv2);
            await _context.SaveChangesAsync();

            // ── Payments ──────────────────────────────────────────────────
            _context.Payments.Add(new Payment { InvoiceId = inv1.Id, Amount = 590000m, PaymentDate = now.AddDays(-5), PaymentMode = "Bank Transfer", TransactionRef = "TXN9988776655", Remarks = "NEFT received. Ref: TN-PAY-001." });

            // ── Tasks ─────────────────────────────────────────────────────
            _context.CrmTasks.AddRange(
                new CrmTask { Title = "Send product demo to Ananya",           Description = "CRM modules walkthrough — 20 min.",  CustomerId = cust1.Id, Priority = TaskPriority.High,   Status = Domain.Enums.TaskStatus.Pending,    DueDate = now.AddDays(2)  },
                new CrmTask { Title = "Follow up on Sunrise Exports proposal", Description = "Check if Meera reviewed the quote.", CustomerId = cust3.Id, Priority = TaskPriority.Medium,  Status = Domain.Enums.TaskStatus.InProgress, DueDate = now.AddDays(1)  },
                new CrmTask { Title = "Contract draft for Bharat Fintech",     Description = "Legal review of SLA and pricing.",   CustomerId = cust4.Id, Priority = TaskPriority.Urgent,  Status = Domain.Enums.TaskStatus.Pending,    DueDate = now.AddDays(3)  },
                new CrmTask { Title = "TechNova onboarding kick-off call",     Description = "Scheduled post-payment.",            CustomerId = cust1.Id, Priority = TaskPriority.High,   Status = Domain.Enums.TaskStatus.Completed,  DueDate = now.AddDays(-2) }
            );

            // ── Notes ─────────────────────────────────────────────────────
            _context.Notes.AddRange(
                new Note { RelatedCustomerId = cust1.Id, Title = "TechNova Kickoff Notes",     Content = "Ananya wants live-chat before go-live. Team: 3 devs + 2 sales reps.",  CreatedAt = now.AddDays(-15) },
                new Note { RelatedCustomerId = cust3.Id, Title = "Sunrise Exports Call Notes", Content = "Meera needs mobile-first UI demo. Budget confirmed at Rs 2.5 Lakh.",    CreatedAt = now.AddDays(-8)  },
                new Note { RelatedCustomerId = cust4.Id, Title = "Bharat Fintech BD Meeting",  Content = "Vikram needs VAPT certificate. Check with security team before closing.", CreatedAt = now.AddDays(-3)  }
            );

            // ── Emails ────────────────────────────────────────────────────
            _context.Emails.AddRange(
                new Email { RelatedCustomerId = cust1.Id, Subject = "Welcome to Dhwiti CRM!", Body = "Dear Ananya, your CRM workspace is ready. Login credentials attached.", FromEmail = "bd@DhwitiCRM.com",       ToEmail = cust1.Email!, Status = "Sent", SentAt = now.AddDays(-18) },
                new Email { RelatedCustomerId = cust3.Id, Subject = "Invoice #INV-2025-0002", Body = "Dear Meera, find the revised invoice attached. Payment due in 30 days.",  FromEmail = "accounts@DhwitiCRM.com", ToEmail = cust3.Email!, Status = "Sent", SentAt = now.AddDays(-8)  }
            );

            // ── Events ────────────────────────────────────────────────────
            _context.Events.AddRange(
                new Event { Title = "TechNova Onboarding Day 1",       Description = "Product walkthrough and admin setup.",    StartDateTime = now.AddDays(3), EndDateTime = now.AddDays(3).AddHours(3), Location = "Google Meet",       Type = "Meeting"  },
                new Event { Title = "Q1 2025 Sales Review",            Description = "Monthly pipeline and KPI review.",        StartDateTime = now.AddDays(7), EndDateTime = now.AddDays(7).AddHours(2), Location = "Conference Room A", Type = "Internal" },
                new Event { Title = "Bharat Fintech Contract Signing", Description = "Final contract review with Vikram Nair.", StartDateTime = now.AddDays(5), EndDateTime = now.AddDays(5).AddHours(1), Location = "Gurugram Office",   Type = "Meeting"  }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Demo data seeded successfully!",
                summary = new { companies = 3, customers = 4, leads = 4, deals = 6, products = 4, orders = 2, invoices = 2, payments = 1, tasks = 4, notes = 3, emails = 2, events = 3 }
            });
        }
    }
}
