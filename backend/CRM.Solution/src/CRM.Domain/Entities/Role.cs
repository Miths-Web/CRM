using CRM.Domain.Common;
using System.Collections.Generic;

namespace CRM.Domain.Entities
{
    public class Role : AuditableEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
