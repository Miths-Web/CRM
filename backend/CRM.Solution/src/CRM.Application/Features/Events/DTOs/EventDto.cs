using System;
using System.ComponentModel.DataAnnotations;

namespace CRM.Application.Features.Events.DTOs
{
    public class EventDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Type { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public bool IsAllDay { get; set; }
        public string? Location { get; set; }
        public string? Color { get; set; }
        public int? ReminderMinutes { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public string? Attendees { get; set; }
        public Guid? RelatedCustomerId { get; set; }
        public Guid? RelatedDealId { get; set; }
        public bool IsRecurring { get; set; }
        public string? RecurrenceRule { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateEventDto
    {
        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        public string? Type { get; set; }
        
        [Required]
        public DateTime StartDateTime { get; set; }
        
        [Required]
        public DateTime EndDateTime { get; set; }
        
        public bool IsAllDay { get; set; } = false;
        public string? Location { get; set; }
        public string? Color { get; set; }
        public int? ReminderMinutes { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public string? Attendees { get; set; }
        public Guid? RelatedCustomerId { get; set; }
        public Guid? RelatedDealId { get; set; }
        public bool IsRecurring { get; set; }
        public string? RecurrenceRule { get; set; }
    }
}

