using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CRM.Application.Features.Quotes.DTOs
{
    // ─── Read DTO ────────────────────────────────────────────────────────────────
    public class QuoteDto
    {
        public Guid    Id             { get; set; }
        public string  QuoteNumber   { get; set; } = string.Empty;
        public string  Title         { get; set; } = string.Empty;
        public Guid?   DealId        { get; set; }
        public string? DealTitle     { get; set; }
        public Guid?   CustomerId    { get; set; }
        public string? CustomerName  { get; set; }
        public Guid?   CompanyId     { get; set; }
        public string? CompanyName   { get; set; }
        public DateTime QuoteDate    { get; set; }
        public DateTime ValidUntil   { get; set; }
        public decimal SubTotal      { get; set; }
        public decimal DiscountAmount{ get; set; }
        public decimal TaxAmount     { get; set; }
        public decimal TotalAmount   { get; set; }
        public string  Status        { get; set; } = "Draft";
        public string? Notes         { get; set; }
        public string? TermsConditions{ get; set; }
        public Guid?   AssignedToUserId { get; set; }
        public string? AssignedToName   { get; set; }
        public DateTime CreatedAt    { get; set; }
        public DateTime UpdatedAt    { get; set; }
        public List<QuoteItemDto> Items { get; set; } = new();
    }

    public class QuoteItemDto
    {
        public Guid    Id          { get; set; }
        public Guid?   ProductId   { get; set; }
        public string? ProductName { get; set; }
        public string  Description { get; set; } = string.Empty;
        public decimal Quantity    { get; set; }
        public decimal UnitPrice   { get; set; }
        public decimal DiscountPct { get; set; }
        public decimal TaxRate     { get; set; }
        public decimal LineTotal   { get; set; }
    }

    // ─── Create DTO ──────────────────────────────────────────────────────────────
    public class CreateQuoteDto
    {
        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        public Guid?  DealId     { get; set; }
        public Guid?  CustomerId { get; set; }
        public Guid?  CompanyId  { get; set; }

        public DateTime QuoteDate   { get; set; } = DateTime.UtcNow;
        public DateTime ValidUntil  { get; set; } = DateTime.UtcNow.AddDays(30);

        public string? Notes           { get; set; }
        public string? TermsConditions { get; set; }
        public Guid?   AssignedToUserId { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "At least one item is required.")]
        public List<CreateQuoteItemDto> Items { get; set; } = new();
    }

    public class CreateQuoteItemDto
    {
        public Guid?   ProductId   { get; set; }

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Range(0.01, 99999)]
        public decimal Quantity    { get; set; } = 1;

        [Range(0, 9999999)]
        public decimal UnitPrice   { get; set; } = 0;

        [Range(0, 100)]
        public decimal DiscountPct { get; set; } = 0;

        [Range(0, 100)]
        public decimal TaxRate     { get; set; } = 0;
    }

    // ─── Update DTO ──────────────────────────────────────────────────────────────
    public class UpdateQuoteDto
    {
        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        public Guid?  DealId     { get; set; }
        public Guid?  CustomerId { get; set; }
        public Guid?  CompanyId  { get; set; }

        public DateTime QuoteDate   { get; set; }
        public DateTime ValidUntil  { get; set; }

        public string  Status          { get; set; } = "Draft";
        public string? Notes           { get; set; }
        public string? TermsConditions { get; set; }
        public Guid?   AssignedToUserId { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "At least one item is required.")]
        public List<CreateQuoteItemDto> Items { get; set; } = new();
    }

    // ─── Status Update DTO ───────────────────────────────────────────────────────
    public class UpdateQuoteStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;  // Draft, Sent, Accepted, Rejected, Expired
    }
}
