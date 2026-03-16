using CRM.Domain.Enums;
using System;
using System.ComponentModel.DataAnnotations;

namespace CRM.Application.Features.Deals.DTOs
{
    public class DealDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public string Currency { get; set; } = "INR";
        public int? StageId { get; set; }
        public string? StageName { get; set; }
        public int Probability { get; set; }
        public DateTime? ExpectedCloseDate { get; set; }
        public DateTime? ActualCloseDate { get; set; }
        public DealStatus Status { get; set; }
        public string? LostReason { get; set; }
        public Guid? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public Guid? CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public string? Description { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateDealDto
    {
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Value must be positive")]
        public decimal Value { get; set; }

        public string Currency { get; set; } = "INR";
        public int? StageId { get; set; }
        public int Probability { get; set; } = 0;
        public DateTime? ExpectedCloseDate { get; set; }
        public DealStatus Status { get; set; } = DealStatus.Open;
        public Guid? CustomerId { get; set; }    // Updated from ContactId
        public Guid? CompanyId { get; set; }     // Updated from CompanyName
        public string? Description { get; set; }
        public Guid? AssignedToUserId { get; set; }
    }

    public class DealStageDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
        public int Probability { get; set; }
        public bool IsActive { get; set; }
    }
}

