using System;

namespace CRM.Application.Features.KnowledgeBase.DTOs
{
    public class ArticleDto
    {
        public Guid Id { get; set; }
        public Guid CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Tags { get; set; }
        public Guid AuthorId { get; set; }
        public string? AuthorName { get; set; }
        public bool IsPublished { get; set; }
        public int ViewCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateArticleDto
    {
        public Guid CategoryId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Tags { get; set; }
        public bool IsPublished { get; set; } = false;
    }

    public class UpdateArticleDto
    {
        public Guid CategoryId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? Tags { get; set; }
        public bool IsPublished { get; set; }
    }
}
