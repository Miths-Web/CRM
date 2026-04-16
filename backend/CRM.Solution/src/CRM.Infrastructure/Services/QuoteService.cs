using CRM.Application.Common.Exceptions;
using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Quotes.DTOs;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRM.Infrastructure.Services
{
    public class QuoteService : IQuoteService
    {
        private readonly IQuoteRepository _quoteRepository;
        private readonly ApplicationDbContext _context;

        public QuoteService(IQuoteRepository quoteRepository, ApplicationDbContext context)
        {
            _quoteRepository = quoteRepository;
            _context = context;
        }

        public async Task<QuoteDto?> GetQuoteByIdAsync(Guid id)
        {
            var quote = await _context.Quotes
                .Include(q => q.Items)
                .Include(q => q.Deal)
                .Include(q => q.Customer)
                .Include(q => q.Company)
                .Include(q => q.AssignedToUser)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (quote == null) return null;

            return MapToDto(quote);
        }

        public async Task<IReadOnlyList<QuoteDto>> GetPagedQuotesAsync(int pageNumber, int pageSize)
        {
            // Note: In a real system, use proper pagination queries to avoid loading all into memory
            var quotes = await _context.Quotes
                .Include(q => q.Items)
                .Include(q => q.Customer)
                .Include(q => q.Company)
                .Include(q => q.AssignedToUser)
                .OrderByDescending(q => q.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return quotes.Select(MapToDto).ToList();
        }

        public async Task<IReadOnlyList<QuoteDto>> GetPagedQuotesByUserAsync(Guid userId, int pageNumber, int pageSize)
        {
            var quotes = await _context.Quotes
                .Include(q => q.Items)
                .Include(q => q.Customer)
                .Include(q => q.Company)
                .Include(q => q.AssignedToUser)
                .Where(q => q.AssignedToUserId == userId || q.CreatedByUserId == userId)
                .OrderByDescending(q => q.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return quotes.Select(MapToDto).ToList();
        }

        public async Task<QuoteDto> CreateQuoteAsync(CreateQuoteDto createDto, Guid currentUserId)
        {
            var quoteAmountData = CalculateQuoteAmounts(createDto.Items);

            var quote = new Quote
            {
                Title = createDto.Title,
                QuoteNumber = GenerateQuoteNumber(),
                DealId = createDto.DealId,
                CustomerId = createDto.CustomerId,
                CompanyId = createDto.CompanyId,
                QuoteDate = createDto.QuoteDate,
                ValidUntil = createDto.ValidUntil,
                Status = "Draft",
                Notes = createDto.Notes,
                TermsConditions = createDto.TermsConditions,
                AssignedToUserId = createDto.AssignedToUserId ?? currentUserId,
                
                SubTotal = quoteAmountData.SubTotal,
                DiscountAmount = quoteAmountData.DiscountAmount,
                TaxAmount = quoteAmountData.TaxAmount,
                TotalAmount = quoteAmountData.TotalAmount,

                CreatedByUserId = currentUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            foreach (var itemDto in createDto.Items)
            {
                var lineSubTotal = itemDto.Quantity * itemDto.UnitPrice;
                var discount = lineSubTotal * (itemDto.DiscountPct / 100);
                var afterDiscount = lineSubTotal - discount;
                var tax = afterDiscount * (itemDto.TaxRate / 100);
                var lineTotal = afterDiscount + tax;

                quote.Items.Add(new QuoteItem
                {
                    ProductId = itemDto.ProductId,
                    Description = itemDto.Description,
                    Quantity = itemDto.Quantity,
                    UnitPrice = itemDto.UnitPrice,
                    DiscountPct = itemDto.DiscountPct,
                    TaxRate = itemDto.TaxRate,
                    LineTotal = lineTotal
                });
            }

            _context.Quotes.Add(quote);
            await _context.SaveChangesAsync();

            return await GetQuoteByIdAsync(quote.Id) ?? MapToDto(quote);
        }

        public async Task UpdateQuoteAsync(Guid id, UpdateQuoteDto updateDto, Guid currentUserId)
        {
            var quote = await _context.Quotes
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (quote == null) throw new NotFoundException("Quote not found");
            
            // Only Draft quotes can be fully updated in a typical workflow, but we let manager decide
            
            quote.Title = updateDto.Title;
            quote.DealId = updateDto.DealId;
            quote.CustomerId = updateDto.CustomerId;
            quote.CompanyId = updateDto.CompanyId;
            quote.QuoteDate = updateDto.QuoteDate;
            quote.ValidUntil = updateDto.ValidUntil;
            quote.Status = updateDto.Status;
            quote.Notes = updateDto.Notes;
            quote.TermsConditions = updateDto.TermsConditions;
            quote.AssignedToUserId = updateDto.AssignedToUserId;
            quote.UpdatedByUserId = currentUserId;
            quote.UpdatedAt = DateTime.UtcNow;

            // Simple replace items strategy
            _context.QuoteItems.RemoveRange(quote.Items);
            
            var quoteAmountData = CalculateQuoteAmounts(updateDto.Items);
            quote.SubTotal = quoteAmountData.SubTotal;
            quote.DiscountAmount = quoteAmountData.DiscountAmount;
            quote.TaxAmount = quoteAmountData.TaxAmount;
            quote.TotalAmount = quoteAmountData.TotalAmount;

            foreach (var itemDto in updateDto.Items)
            {
                var lineSubTotal = itemDto.Quantity * itemDto.UnitPrice;
                var discount = lineSubTotal * (itemDto.DiscountPct / 100);
                var afterDiscount = lineSubTotal - discount;
                var tax = afterDiscount * (itemDto.TaxRate / 100);
                var lineTotal = afterDiscount + tax;

                var newItem = new QuoteItem
                {
                    QuoteId = quote.Id,
                    ProductId = itemDto.ProductId,
                    Description = itemDto.Description,
                    Quantity = itemDto.Quantity,
                    UnitPrice = itemDto.UnitPrice,
                    DiscountPct = itemDto.DiscountPct,
                    TaxRate = itemDto.TaxRate,
                    LineTotal = lineTotal
                };
                quote.Items.Add(newItem);
                _context.QuoteItems.Add(newItem); // Required since we removed old ones
            }

            await _context.SaveChangesAsync();
        }

        public async Task UpdateQuoteStatusAsync(Guid id, string status, Guid currentUserId)
        {
            var quote = await _quoteRepository.GetByIdAsync(id);
            if (quote == null) throw new NotFoundException("Quote not found");

            var validStatuses = new[] { "Draft", "Sent", "Accepted", "Rejected", "Expired" };
            if (!validStatuses.Contains(status))
                throw new BusinessException("Invalid quote status.");

            quote.Status = status;
            quote.UpdatedByUserId = currentUserId;
            quote.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteQuoteAsync(Guid id)
        {
            var quote = await _context.Quotes.Include(q => q.Items).FirstOrDefaultAsync(q => q.Id == id);
            if (quote != null)
            {
                _context.QuoteItems.RemoveRange(quote.Items);
                _context.Quotes.Remove(quote);
                await _context.SaveChangesAsync();
            }
        }

        public async Task GenerateOrderFromQuoteAsync(Guid quoteId, Guid currentUserId)
        {
            var quote = await _context.Quotes
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == quoteId);

            if (quote == null) throw new NotFoundException("Quote not found");
            if (quote.Status != "Accepted") throw new BusinessException("Only accepted quotes can be converted to orders.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var order = new OrderMaster
                {
                    OrderNumber = "ORD-" + DateTime.UtcNow.ToString("yyyyMM") + "-" + new Random().Next(1000, 9999), // Simplified
                    CustomerId = quote.CustomerId ?? Guid.Empty, // A quote should preferably have customer id attached if it's being converted
                    CompanyId = quote.CompanyId ?? Guid.Empty,
                    OrderDate = DateTime.UtcNow,
                    Status = "Pending",
                    SubTotal = quote.SubTotal,
                    TaxAmount = quote.TaxAmount,
                    DiscountAmount = quote.DiscountAmount,
                    TotalAmount = quote.TotalAmount,
                    Notes = "Generated from Quote " + quote.QuoteNumber,
                    CreatedBy = currentUserId,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync(); // To get order.Id
                
                foreach(var item in quote.Items)
                {
                    var orderItem = new OrderItem
                    {
                        OrderId = order.Id,
                        ProductId = item.ProductId ?? Guid.Empty, // We should ensure items are tied to products or have a default null handling in OrderItem
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        DiscountPct = item.DiscountPct,
                        TaxRate = item.TaxRate,
                        LineTotal = item.LineTotal
                        // Note: Depending on OrderItem schema it might need adjustments
                    };
                    _context.OrderItems.Add(orderItem);
                }

                // If Deal is present, mark Deal as Won
                if (quote.DealId.HasValue)
                {
                    var deal = await _context.Deals.FindAsync(quote.DealId.Value);
                    if (deal != null)
                    {
                        deal.Status = CRM.Domain.Enums.DealStatus.Won;
                        deal.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private QuoteDto MapToDto(Quote quote)
        {
            return new QuoteDto
            {
                Id = quote.Id,
                QuoteNumber = quote.QuoteNumber,
                Title = quote.Title,
                DealId = quote.DealId,
                DealTitle = quote.Deal?.Title,
                CustomerId = quote.CustomerId,
                CustomerName = quote.Customer != null ? $"{quote.Customer.FirstName} {quote.Customer.LastName}" : null,
                CompanyId = quote.CompanyId,
                CompanyName = quote.Company?.CompanyName,
                QuoteDate = quote.QuoteDate,
                ValidUntil = quote.ValidUntil,
                SubTotal = quote.SubTotal,
                DiscountAmount = quote.DiscountAmount,
                TaxAmount = quote.TaxAmount,
                TotalAmount = quote.TotalAmount,
                Status = quote.Status,
                Notes = quote.Notes,
                TermsConditions = quote.TermsConditions,
                AssignedToUserId = quote.AssignedToUserId,
                AssignedToName = quote.AssignedToUser != null ? $"{quote.AssignedToUser.FirstName} {quote.AssignedToUser.LastName}" : null,
                CreatedAt = quote.CreatedAt,
                UpdatedAt = quote.UpdatedAt,
                Items = quote.Items.Select(i => new QuoteItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductName = i.Product?.ProductName,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    DiscountPct = i.DiscountPct,
                    TaxRate = i.TaxRate,
                    LineTotal = i.LineTotal
                }).ToList()
            };
        }

        private (decimal SubTotal, decimal DiscountAmount, decimal TaxAmount, decimal TotalAmount) CalculateQuoteAmounts(IEnumerable<CreateQuoteItemDto> items)
        {
            decimal subTotal = 0;
            decimal totalDiscount = 0;
            decimal totalTax = 0;
            decimal grandTotal = 0;

            foreach (var item in items)
            {
                var lineSubTotal = item.Quantity * item.UnitPrice;
                var discount = lineSubTotal * (item.DiscountPct / 100);
                var afterDiscount = lineSubTotal - discount;
                var tax = afterDiscount * (item.TaxRate / 100);
                var lineTotal = afterDiscount + tax;

                subTotal += lineSubTotal;
                totalDiscount += discount;
                totalTax += tax;
                grandTotal += lineTotal;
            }

            return (subTotal, totalDiscount, totalTax, grandTotal);
        }

        private string GenerateQuoteNumber()
        {
            return $"QUO-{DateTime.UtcNow.Year}-{new Random().Next(10000, 99999)}";
        }
    }
}
