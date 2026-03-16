using CRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace CRM.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        // Core
        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        // B2B Customer Structure
        public DbSet<CompanyMaster> Companies => Set<CompanyMaster>();
        public DbSet<CustomerMaster> Customers => Set<CustomerMaster>();
        public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();

        // Sales Flow
        public DbSet<Lead> Leads => Set<Lead>();
        public DbSet<Deal> Deals => Set<Deal>();
        public DbSet<DealStage> DealStages => Set<DealStage>();

        // Product + Order + Invoice + Payment
        public DbSet<Product> Products => Set<Product>();
        public DbSet<OrderMaster> Orders => Set<OrderMaster>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();
        public DbSet<Invoice> Invoices => Set<Invoice>();
        public DbSet<Payment> Payments => Set<Payment>();

        // Work modules
        public DbSet<CrmTask> CrmTasks => Set<CrmTask>();
        public DbSet<Event> Events => Set<Event>();
        public DbSet<Email> Emails => Set<Email>();
        public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();
        public DbSet<Note> Notes => Set<Note>();
        public DbSet<Document> Documents => Set<Document>();

        // Communication
        public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
        public DbSet<MeetingRoom> MeetingRooms => Set<MeetingRoom>();
        public DbSet<LiveChatSession> LiveChatSessions => Set<LiveChatSession>();
        public DbSet<LiveChatMessage> LiveChatMessages => Set<LiveChatMessage>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Many-to-Many: User <-> Role
            modelBuilder.Entity<User>()
                .HasMany(u => u.Roles)
                .WithMany(r => r.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "UserRoles",
                    j => j.HasOne<Role>().WithMany().HasForeignKey("RoleId").OnDelete(DeleteBehavior.Cascade),
                    j => j.HasOne<User>().WithMany().HasForeignKey("UserId").OnDelete(DeleteBehavior.Cascade));

            // CrmTask → Tasks table
            modelBuilder.Entity<CrmTask>().ToTable("Tasks");

            // OrderMaster → OrderMaster table
            modelBuilder.Entity<OrderMaster>().ToTable("OrderMaster");

            // CustomerAddress → CustomerAddresses table
            modelBuilder.Entity<CustomerAddress>().ToTable("CustomerAddresses");

            // CompanyMaster
            modelBuilder.Entity<CompanyMaster>(e =>
            {
                e.ToTable("CompanyMaster");
                e.HasKey(c => c.Id);
                e.Property(c => c.CompanyName).HasMaxLength(200).IsRequired();
                e.HasIndex(c => c.CompanyName);
                e.HasIndex(c => c.Email);
                e.HasOne(c => c.CreatedByUser).WithMany().HasForeignKey(c => c.CreatedBy).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(c => c.UpdatedByUser).WithMany().HasForeignKey(c => c.UpdatedBy).OnDelete(DeleteBehavior.NoAction);
            });

            // CustomerMaster
            modelBuilder.Entity<CustomerMaster>(e =>
            {
                e.ToTable("CustomerMaster");
                e.HasKey(c => c.Id);
                e.HasIndex(c => c.Email);
                e.HasIndex(c => c.CompanyId);
                e.HasOne(c => c.Company).WithMany(co => co.Customers).HasForeignKey(c => c.CompanyId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(c => c.AssignedToUser).WithMany().HasForeignKey(c => c.AssignedToUserId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(c => c.CreatedByUser).WithMany().HasForeignKey(c => c.CreatedBy).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(c => c.UpdatedByUser).WithMany().HasForeignKey(c => c.UpdatedBy).OnDelete(DeleteBehavior.NoAction);
            });

            // CustomerAddress
            modelBuilder.Entity<CustomerAddress>(e =>
            {
                e.HasOne(a => a.Customer).WithMany(c => c.Addresses).HasForeignKey(a => a.CustomerId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(a => a.CreatedByUser).WithMany().HasForeignKey(a => a.CreatedBy).OnDelete(DeleteBehavior.NoAction);
            });

            // Product
            modelBuilder.Entity<Product>(e =>
            {
                e.ToTable("Products");
                e.Property(p => p.UnitPrice).HasPrecision(18, 2);
                e.Property(p => p.TaxRate).HasPrecision(5, 2);
                e.HasIndex(p => p.SKU);
                e.HasOne(p => p.CreatedByUser).WithMany().HasForeignKey(p => p.CreatedBy).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(p => p.UpdatedByUser).WithMany().HasForeignKey(p => p.UpdatedBy).OnDelete(DeleteBehavior.NoAction);
            });

            // Deal: ContactId removed, CustomerId + CompanyId added
            modelBuilder.Entity<Deal>(e =>
            {
                e.Property(d => d.Value).HasPrecision(18, 2);
                e.HasOne(d => d.Customer).WithMany(c => c.Deals).HasForeignKey(d => d.CustomerId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(d => d.Company).WithMany(co => co.Deals).HasForeignKey(d => d.CompanyId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(d => d.AssignedToUser).WithMany().HasForeignKey(d => d.AssignedToUserId).OnDelete(DeleteBehavior.NoAction);
            });

            // Lead: ConvertedToContact replaced by ConvertedToCustomer + ConvertedToCompany
            modelBuilder.Entity<Lead>(e =>
            {
                e.Property(l => l.EstimatedValue).HasPrecision(18, 2);
                e.HasOne(l => l.ConvertedToCustomer).WithMany().HasForeignKey(l => l.ConvertedToCustomerId).OnDelete(DeleteBehavior.SetNull);
                e.HasOne(l => l.ConvertedToCompany).WithMany().HasForeignKey(l => l.ConvertedToCompanyId).OnDelete(DeleteBehavior.SetNull);
                e.HasOne(l => l.ConvertedToDeal).WithMany().HasForeignKey(l => l.ConvertedToDealId).OnDelete(DeleteBehavior.SetNull);
                e.HasOne(l => l.AssignedToUser).WithMany().HasForeignKey(l => l.AssignedToUserId).OnDelete(DeleteBehavior.NoAction);
            });

            // OrderMaster
            modelBuilder.Entity<OrderMaster>(e =>
            {
                e.Property(o => o.SubTotal).HasPrecision(18, 2);
                e.Property(o => o.TaxAmount).HasPrecision(18, 2);
                e.Property(o => o.DiscountAmount).HasPrecision(18, 2);
                e.Property(o => o.TotalAmount).HasPrecision(18, 2);
                e.HasIndex(o => o.OrderNumber).IsUnique();
                e.HasIndex(o => o.CustomerId);
                e.HasIndex(o => o.CompanyId);
                e.HasOne(o => o.Deal).WithMany(d => d.Orders).HasForeignKey(o => o.DealId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(o => o.Customer).WithMany(c => c.Orders).HasForeignKey(o => o.CustomerId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(o => o.Company).WithMany(co => co.Orders).HasForeignKey(o => o.CompanyId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(o => o.CreatedByUser).WithMany().HasForeignKey(o => o.CreatedBy).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(o => o.UpdatedByUser).WithMany().HasForeignKey(o => o.UpdatedBy).OnDelete(DeleteBehavior.NoAction);
            });

            // OrderItem
            modelBuilder.Entity<OrderItem>(e =>
            {
                e.ToTable("OrderItems");
                e.Property(i => i.Quantity).HasPrecision(10, 2);
                e.Property(i => i.UnitPrice).HasPrecision(18, 2);
                e.Property(i => i.DiscountPct).HasPrecision(5, 2);
                e.Property(i => i.TaxRate).HasPrecision(5, 2);
                e.Property(i => i.LineTotal).HasPrecision(18, 2);
                e.HasOne(i => i.Order).WithMany(o => o.OrderItems).HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(i => i.Product).WithMany(p => p.OrderItems).HasForeignKey(i => i.ProductId).OnDelete(DeleteBehavior.NoAction);
            });

            // Invoice
            modelBuilder.Entity<Invoice>(e =>
            {
                e.ToTable("Invoices");
                e.Property(i => i.SubTotal).HasPrecision(18, 2);
                e.Property(i => i.TaxAmount).HasPrecision(18, 2);
                e.Property(i => i.DiscountAmount).HasPrecision(18, 2);
                e.Property(i => i.TotalAmount).HasPrecision(18, 2);
                e.Property(i => i.PaidAmount).HasPrecision(18, 2);
                e.Ignore(i => i.DueAmount); // Computed property, not stored
                e.HasIndex(i => i.InvoiceNumber).IsUnique();
                e.HasIndex(i => i.OrderId);
                e.HasIndex(i => i.CustomerId);
                e.HasOne(i => i.Order).WithMany(o => o.Invoices).HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(i => i.Customer).WithMany().HasForeignKey(i => i.CustomerId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(i => i.Company).WithMany().HasForeignKey(i => i.CompanyId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(i => i.BillingAddress).WithMany().HasForeignKey(i => i.BillingAddressId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(i => i.CreatedByUser).WithMany().HasForeignKey(i => i.CreatedBy).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(i => i.UpdatedByUser).WithMany().HasForeignKey(i => i.UpdatedBy).OnDelete(DeleteBehavior.NoAction);
            });

            // Payment
            modelBuilder.Entity<Payment>(e =>
            {
                e.ToTable("Payments");
                e.Property(p => p.Amount).HasPrecision(18, 2);
                e.HasOne(p => p.Invoice).WithMany(i => i.Payments).HasForeignKey(p => p.InvoiceId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(p => p.ReceivedByUser).WithMany().HasForeignKey(p => p.ReceivedBy).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(p => p.CreatedByUser).WithMany().HasForeignKey(p => p.CreatedBy).OnDelete(DeleteBehavior.NoAction);
            });

            // Email template relation
            modelBuilder.Entity<Email>()
                .HasOne(e => e.Template)
                .WithMany(t => t.Emails)
                .HasForeignKey(e => e.TemplateId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
