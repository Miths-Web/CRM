using CRM.Application.Features.Tickets.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRM.Application.Common.Interfaces
{
    public interface ITicketService
    {
        Task<TicketDto?> GetTicketByIdAsync(Guid id);
        Task<IReadOnlyList<TicketDto>> GetPagedTicketsAsync(int pageNumber, int pageSize);
        Task<IReadOnlyList<TicketDto>> GetPagedTicketsByUserAsync(Guid userId, int pageNumber, int pageSize);
        Task<TicketDto> CreateTicketAsync(CreateTicketDto createDto, Guid currentUserId);
        Task UpdateTicketAsync(Guid id, UpdateTicketDto updateDto, Guid currentUserId);
        Task<TicketCommentDto> AddCommentAsync(Guid ticketId, CreateTicketCommentDto commentDto, Guid currentUserId);
        Task DeleteTicketAsync(Guid id);
    }
}
