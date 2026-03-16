using CRM.Domain.Common;
using System;

namespace CRM.Domain.Entities
{
    /// <summary>
    /// A Jitsi Meet meeting room linked to a CRM Event or Deal.
    /// No API key required — Jitsi is 100% free and open source.
    /// </summary>
    public class MeetingRoom : AuditableEntity
    {
        public string Title { get; set; } = string.Empty;
        public string RoomCode { get; set; } = string.Empty;    // Unique Jitsi room name
        public string JitsiUrl { get; set; } = string.Empty;    // Full meeting URL
        public string? Password { get; set; }                    // Optional room password
        public DateTime ScheduledAt { get; set; }
        public int DurationMinutes { get; set; } = 60;
        public string Status { get; set; } = "Scheduled";       // Scheduled, Active, Ended
        public string? Description { get; set; }
        public string? RecordingUrl { get; set; }

        public Guid? HostUserId { get; set; }
        public Guid? RelatedEventId { get; set; }
        public Guid? RelatedCustomerId { get; set; }   // Updated from RelatedContactId
        public Guid? RelatedDealId { get; set; }

        public User? HostUser { get; set; }
        public CustomerMaster? RelatedCustomer { get; set; }  // Updated
        public Deal? RelatedDeal { get; set; }
    }
}
