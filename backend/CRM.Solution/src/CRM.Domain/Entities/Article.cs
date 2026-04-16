using CRM.Domain.Common;
using System;

namespace CRM.Domain.Entities
{
    public class Article : BaseEntity
    {
        public Guid CategoryId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Tags { get; set; }
        public Guid AuthorId { get; set; }
        public bool IsPublished { get; set; } = false;
        public int ViewCount { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ArticleCategory? Category { get; set; }
        public User? Author { get; set; }
    }
}
