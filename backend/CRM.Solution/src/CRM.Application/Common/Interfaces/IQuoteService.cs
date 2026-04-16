using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CRM.Application.Features.Quotes.DTOs;

namespace CRM.Application.Common.Interfaces
{
    public interface IQuoteService
    {
        Task<QuoteDto?> GetQuoteByIdAsync(Guid id);
        Task<IReadOnlyList<QuoteDto>> GetPagedQuotesAsync(int pageNumber, int pageSize);
        Task<IReadOnlyList<QuoteDto>> GetPagedQuotesByUserAsync(Guid userId, int pageNumber, int pageSize);
        Task<QuoteDto> CreateQuoteAsync(CreateQuoteDto createDto, Guid currentUserId);
        Task UpdateQuoteAsync(Guid id, UpdateQuoteDto updateDto, Guid currentUserId);
        Task UpdateQuoteStatusAsync(Guid id, string status, Guid currentUserId);
        Task DeleteQuoteAsync(Guid id);
        Task GenerateOrderFromQuoteAsync(Guid quoteId, Guid currentUserId);
    }
}
