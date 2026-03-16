using CRM.Application.Features.Deals.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRM.Application.Common.Interfaces
{
    public interface IDealService
    {
        Task<DealDto?> GetDealByIdAsync(Guid id);
        Task<IReadOnlyList<DealDto>> GetPagedDealsAsync(int pageNumber, int pageSize);
        // Issue #3 FIX: Sales Rep sirf apne assigned deals dekhe
        Task<IReadOnlyList<DealDto>> GetPagedDealsByUserAsync(Guid userId, int pageNumber, int pageSize);
        Task<DealDto> CreateDealAsync(CreateDealDto createDto);
        Task UpdateDealAsync(Guid id, CreateDealDto updateDto);
        Task DeleteDealAsync(Guid id);
        Task UpdateDealStageAsync(Guid id, int stageId);
        Task<IReadOnlyList<DealStageDto>> GetAllDealStagesAsync();
    }
}
