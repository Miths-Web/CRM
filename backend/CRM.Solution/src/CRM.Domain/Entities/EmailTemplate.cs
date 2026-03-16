using CRM.Domain.Common;
using System.Collections.Generic;

namespace CRM.Domain.Entities
{
    public class EmailTemplate : AuditableEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? Category { get; set; }
        public bool IsActive { get; set; } = true;

        public ICollection<Email> Emails { get; set; } = new List<Email>();
    }
}
