using System;
using System.ComponentModel.DataAnnotations;

namespace CRM.Application.Features.Emails.DTOs
{
    public class EmailDto
    {
        public Guid Id { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? FromEmail { get; set; }
        public string ToEmail { get; set; } = string.Empty;
        public string? CcEmails { get; set; }
        public string? BccEmails { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? ScheduledAt { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime? OpenedAt { get; set; }
        public DateTime? ClickedAt { get; set; }
        public Guid? TemplateId { get; set; }
        public Guid? RelatedCustomerId { get; set; }
        public Guid? RelatedLeadId { get; set; }
        public Guid? RelatedDealId { get; set; }
        public bool IsStarred { get; set; }
        public bool IsArchived { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateEmailDto
    {
        [Required]
        [StringLength(300)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        public string Body { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string ToEmail { get; set; } = string.Empty;

        public string? CcEmails { get; set; }
        public string? BccEmails { get; set; }
        public DateTime? ScheduledAt { get; set; }
        public Guid? TemplateId { get; set; }
        public Guid? RelatedCustomerId { get; set; }
        public Guid? RelatedLeadId { get; set; }
        public Guid? RelatedDealId { get; set; }
    }
}

