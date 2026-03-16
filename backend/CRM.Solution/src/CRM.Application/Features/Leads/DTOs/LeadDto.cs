using CRM.Domain.Enums;
using System;
using System.ComponentModel.DataAnnotations;

namespace CRM.Application.Features.Leads.DTOs
{
    public class LeadDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Company { get; set; }
        public string? JobTitle { get; set; }
        public LeadStatus Status { get; set; }
        public LeadSource? Source { get; set; }
        public int Score { get; set; }
        public decimal? EstimatedValue { get; set; }
        public string? Description { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateLeadDto
    {
        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        
        [EmailAddress]
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Company { get; set; }
        public string? JobTitle { get; set; }
        public LeadStatus Status { get; set; } = LeadStatus.New;
        public LeadSource? Source { get; set; }
        public decimal? EstimatedValue { get; set; }
        public string? Description { get; set; }
        public Guid? AssignedToUserId { get; set; }
    }
}
