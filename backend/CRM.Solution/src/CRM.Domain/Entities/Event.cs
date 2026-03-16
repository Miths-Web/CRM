using CRM.Domain.Common;
using System;

namespace CRM.Domain.Entities
{
    public class Event : AuditableEntity
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Type { get; set; } // Meeting, Call, Event, etc.
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public bool IsAllDay { get; set; } = false;
        public string? Location { get; set; }
        public string? Color { get; set; }
        public int? ReminderMinutes { get; set; }
        
        public Guid? AssignedToUserId { get; set; }
        public string? Attendees { get; set; } // JSON array of Ids
        public Guid? RelatedCustomerId { get; set; }  // Updated from RelatedContactId
        public Guid? RelatedDealId { get; set; }
        
        public bool IsRecurring { get; set; } = false;
        public string? RecurrenceRule { get; set; }

        public User? AssignedToUser { get; set; }
        public CustomerMaster? RelatedCustomer { get; set; }  // Updated from Contact
        public Deal? RelatedDeal { get; set; }
    }
}
