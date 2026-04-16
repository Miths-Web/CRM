using System;
using System.ComponentModel.DataAnnotations;

namespace CRM.Application.Features.Feedbacks.DTOs
{
    public class FeedbackDto
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; }
        public int Rating { get; set; }
        public string Category { get; set; }
        public string Subject { get; set; }
        public string Comments { get; set; }
        public string Status { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public string AssignedToUserName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateFeedbackDto
    {
        [Required]
        public Guid CustomerId { get; set; }
        [Required, Range(1, 5)]
        public int Rating { get; set; }
        [Required]
        public string Category { get; set; }
        [Required]
        public string Subject { get; set; }
        [Required]
        public string Comments { get; set; }
    }

    public class UpdateFeedbackDto
    {
        public string Status { get; set; }
        public Guid? AssignedToUserId { get; set; }
    }
}
