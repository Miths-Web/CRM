using CRM.Domain.Common;
using CRM.Domain.Enums;
using System;

namespace CRM.Domain.Entities
{
    /// <summary>
    /// Renamed from 'Task' to 'CrmTask' to avoid C# keyword conflict.
    /// The database table is still named 'Tasks' via EF Core configuration.
    /// </summary>
    public class CrmTask : AuditableEntity
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public CRM.Domain.Enums.TaskStatus Status { get; set; } = CRM.Domain.Enums.TaskStatus.Pending;
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        public TaskType Type { get; set; } = TaskType.Call;
        public DateTime? DueDate { get; set; }
        public bool IsCompleted { get; set; } = false;
        public DateTime? CompletedAt { get; set; }

        public Guid? AssignedToUserId { get; set; }
        public Guid? CustomerId { get; set; }     // Updated from ContactId
        public Guid? LeadId { get; set; }
        public Guid? DealId { get; set; }

        // Navigation properties
        public User? AssignedToUser { get; set; }
        public CustomerMaster? Customer { get; set; }  // Updated from Contact
        public Lead? Lead { get; set; }
        public Deal? Deal { get; set; }
    }
}
