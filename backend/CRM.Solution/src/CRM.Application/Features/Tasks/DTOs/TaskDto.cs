using CRM.Domain.Entities;
using CRM.Domain.Enums;
using System;
using System.ComponentModel.DataAnnotations;
using TaskStatus = CRM.Domain.Enums.TaskStatus;

namespace CRM.Application.Features.Tasks.DTOs
{
    public class TaskDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public TaskStatus Status { get; set; }
        public TaskPriority Priority { get; set; }
        public TaskType Type { get; set; }
        public DateTime? DueDate { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public string? AssignedToUserName { get; set; }
        public Guid? CustomerId { get; set; }
        public Guid? LeadId { get; set; }
        public Guid? DealId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateTaskDto
    {
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }
        public TaskStatus Status { get; set; } = TaskStatus.Pending;
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        public TaskType Type { get; set; } = TaskType.Call;
        public DateTime? DueDate { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public Guid? CustomerId { get; set; }
        public Guid? LeadId { get; set; }
        public Guid? DealId { get; set; }
    }
}

