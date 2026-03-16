using CRM.Domain.Enums;
using System;
using System.ComponentModel.DataAnnotations;

namespace CRM.Application.Features.Contacts.DTOs
{
    public class ContactDto
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Mobile { get; set; }
        public string? Company { get; set; }
        public string? JobTitle { get; set; }
        public string? Website { get; set; }
        public ContactCategory? Category { get; set; }
        public string Status { get; set; } = "Active";
        public Guid? AssignedToUserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateContactDto
    {
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [EmailAddress]
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Mobile { get; set; }
        public string? Company { get; set; }
        public string? JobTitle { get; set; }
        public string? Website { get; set; }
        public ContactCategory? Category { get; set; }
        public string Status { get; set; } = "Active";
        public Guid? AssignedToUserId { get; set; }
        public Guid? CreatedByUserId { get; set; }
    }
}
