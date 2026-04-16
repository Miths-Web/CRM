using System;
using System.Collections.Generic;

namespace CRM.Application.Features.Tickets.DTOs
{
    public class TicketDto
    {
        public Guid Id { get; set; }
        public string TicketNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "Open";
        public string Priority { get; set; } = "Medium";
        public Guid? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public string? AssignedToName { get; set; }
        public Guid CreatedByUserId { get; set; }
        public string? CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<TicketCommentDto> Comments { get; set; } = new List<TicketCommentDto>();
    }

    public class TicketCommentDto
    {
        public Guid Id { get; set; }
        public Guid TicketId { get; set; }
        public Guid UserId { get; set; }
        public string? UserName { get; set; }
        public string CommentText { get; set; } = string.Empty;
        public bool IsInternal { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateTicketDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = "Medium";
        public Guid? CustomerId { get; set; }
        public Guid? AssignedToUserId { get; set; }
    }

    public class UpdateTicketDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public Guid? CustomerId { get; set; }
        public Guid? AssignedToUserId { get; set; }
    }

    public class CreateTicketCommentDto
    {
        public string CommentText { get; set; } = string.Empty;
        public bool IsInternal { get; set; } = false;
    }
}
