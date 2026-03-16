using System;
using System.ComponentModel.DataAnnotations;

namespace CRM.Application.Features.Documents.DTOs
{
    public class DocumentDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string? OriginalFileName { get; set; }
        public string? FilePath { get; set; }
        public long? FileSize { get; set; }
        public string? MimeType { get; set; }
        public string? Category { get; set; }
        public Guid? RelatedCustomerId { get; set; }
        public Guid? RelatedLeadId { get; set; }
        public Guid? RelatedDealId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UploadDocumentDto
    {
        [Required]
        public string FileName { get; set; } = string.Empty;

        public string? ContentType { get; set; }
        public long Length { get; set; }
        public string? Category { get; set; }
        public Guid? RelatedCustomerId { get; set; }
        public Guid? RelatedLeadId { get; set; }
        public Guid? RelatedDealId { get; set; }
    }
}

