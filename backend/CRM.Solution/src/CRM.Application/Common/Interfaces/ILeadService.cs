using CRM.Application.Features.Leads.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRM.Application.Common.Interfaces
{
    public interface ILeadService
    {
        Task<LeadDto?> GetLeadByIdAsync(Guid id);
        Task<IReadOnlyList<LeadDto>> GetPagedLeadsAsync(int pageNumber, int pageSize);
        Task<LeadDto> CreateLeadAsync(CreateLeadDto createDto);
        Task UpdateLeadAsync(Guid id, UpdateLeadDto updateDto);
        Task DeleteLeadAsync(Guid id);
        Task ConvertLeadAsync(Guid id, Guid currentUserId);
    }
}

