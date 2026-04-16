using CRM.Application.Common.Exceptions;
using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Deals.DTOs;
using CRM.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRM.Infrastructure.Services
{
    public class DealService : IDealService
    {
        private readonly IDealRepository _dealRepository;

        public DealService(IDealRepository dealRepository)
        {
            _dealRepository = dealRepository;
        }

        public async Task<DealDto?> GetDealByIdAsync(Guid id)
        {
            var deal = await _dealRepository.GetDealWithIncludesByIdAsync(id);
            return deal == null ? null : MapToDto(deal);
        }

        public async Task<IReadOnlyList<DealDto>> GetPagedDealsAsync(int pageNumber, int pageSize)
        {
            var deals = await _dealRepository.GetPagedDealsWithIncludesAsync(pageNumber, pageSize);
            return deals.Select(MapToDto).ToList();
        }

        public async Task<IReadOnlyList<DealDto>> GetPagedDealsByUserAsync(Guid userId, int pageNumber, int pageSize)
        {
            // Issue #3 FIX: Sirf is user ko assigned deals return karo + Includes (Company, Stage, Customer)
            var all = await _dealRepository.FindAsync(d => d.AssignedToUserId == userId);
            
            // To properly load navigation properties for the DTO (StageName, CompanyName, etc.)
            // We fetch with includes by ID for each deal or use a more efficient way if FindAsync allowed includes.
            // For now, let's map carefully or use GetPagedDealsWithIncludesAsync logic.
            
            var deals = await _dealRepository.GetPagedDealsWithIncludesAsync(pageNumber, pageSize);
            return deals
                .Where(d => d.AssignedToUserId == userId)
                .Select(MapToDto)
                .ToList();
        }

        public async Task<DealDto> CreateDealAsync(CreateDealDto createDto)
        {
            var deal = new Deal
            {
                Title             = createDto.Title,
                Value             = createDto.Value,
                Currency          = createDto.Currency,
                StageId           = createDto.StageId,
                Probability       = createDto.Probability,
                ExpectedCloseDate = createDto.ExpectedCloseDate,
                Status            = createDto.Status,
                CustomerId        = createDto.CustomerId,    // Updated: ContactId → CustomerId
                CompanyId         = createDto.CompanyId,     // Updated: CompanyName → CompanyId
                Description       = createDto.Description,
                AssignedToUserId  = createDto.AssignedToUserId,
                CreatedAt         = DateTime.UtcNow
            };
            var addedDeal = await _dealRepository.AddAsync(deal);
            return MapToDto(addedDeal);
        }

        public async Task UpdateDealAsync(Guid id, CreateDealDto updateDto)
        {
            var deal = await _dealRepository.GetByIdAsync(id);
            if (deal == null) throw new NotFoundException("Deal not found");
            deal.Title             = updateDto.Title;
            deal.Value             = updateDto.Value;
            deal.Currency          = updateDto.Currency;
            deal.StageId           = updateDto.StageId;
            deal.Probability       = updateDto.Probability;
            deal.ExpectedCloseDate = updateDto.ExpectedCloseDate;
            deal.Status            = updateDto.Status;
            deal.CustomerId        = updateDto.CustomerId;
            deal.CompanyId         = updateDto.CompanyId;
            deal.Description       = updateDto.Description;
            
            // BUG FIX: Agar updateDto mein Assigned User nahi hai toh purana wala hi rehne do
            if (updateDto.AssignedToUserId != null && updateDto.AssignedToUserId != Guid.Empty)
                deal.AssignedToUserId = updateDto.AssignedToUserId;
            
            deal.UpdatedAt         = DateTime.UtcNow;
            await _dealRepository.UpdateAsync(deal);
        }

        public async Task DeleteDealAsync(Guid id)
        {
            await _dealRepository.DeleteByIdAsync(id);
        }

        public async Task UpdateDealStageAsync(Guid id, int stageId)
        {
            var deal = await _dealRepository.GetByIdAsync(id);
            if (deal == null) throw new NotFoundException("Deal not found");
            deal.StageId   = stageId;
            deal.UpdatedAt = DateTime.UtcNow;
            await _dealRepository.UpdateAsync(deal);
        }

        public async Task<IReadOnlyList<DealStageDto>> GetAllDealStagesAsync()
        {
            var stages = await _dealRepository.GetAllStagesAsync();
            return stages.Select(s => new DealStageDto
            {
                Id          = s.Id,
                Name        = s.Name,
                OrderIndex  = s.OrderIndex,
                Probability = s.Probability,
                IsActive    = s.IsActive
            }).ToList();
        }

        private DealDto MapToDto(Deal deal)
        {
            return new DealDto
            {
                Id                = deal.Id,
                Title             = deal.Title,
                Value             = deal.Value,
                Currency          = deal.Currency,
                StageId           = deal.StageId,
                StageName         = deal.Stage?.Name,
                Probability       = deal.Probability,
                ExpectedCloseDate = deal.ExpectedCloseDate,
                ActualCloseDate   = deal.ActualCloseDate,
                Status            = deal.Status,
                LostReason        = deal.LostReason,
                CustomerId        = deal.CustomerId,
                CustomerName      = deal.Customer != null ? $"{deal.Customer.FirstName} {deal.Customer.LastName}".Trim() : null,
                CompanyId         = deal.CompanyId,
                CompanyName       = deal.Company?.CompanyName,
                Description       = deal.Description,
                AssignedToUserId  = deal.AssignedToUserId,
                CreatedAt         = deal.CreatedAt
            };
        }
    }
}
