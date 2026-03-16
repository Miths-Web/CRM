using System;
using System.ComponentModel.DataAnnotations;

namespace CRM.Application.Features.Notes.DTOs
{
    public class NoteDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Category { get; set; }
        public bool IsPinned { get; set; }
        public Guid? RelatedCustomerId { get; set; }
        public Guid? RelatedLeadId { get; set; }
        public Guid? RelatedDealId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateNoteDto
    {
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        public string? Category { get; set; }
        public bool IsPinned { get; set; } = false;
        public Guid? RelatedCustomerId { get; set; }
        public Guid? RelatedLeadId { get; set; }
        public Guid? RelatedDealId { get; set; }
    }
}

