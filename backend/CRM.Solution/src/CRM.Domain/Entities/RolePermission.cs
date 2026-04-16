using CRM.Domain.Common;
using System;

namespace CRM.Domain.Entities
{
    public class RolePermission : BaseEntity
    {
        public Guid RoleId { get; set; }
        public string Module { get; set; } = string.Empty; // e.g., "Tickets", "Leads", "Settings"
        public string Permission { get; set; } = string.Empty; // e.g., "Create", "Read", "Update", "Delete"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Role? Role { get; set; }
    }
}
