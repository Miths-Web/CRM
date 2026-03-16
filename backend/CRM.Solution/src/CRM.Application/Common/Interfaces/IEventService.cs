using CRM.Application.Features.Events.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRM.Application.Common.Interfaces
{
    public interface IEventService
    {
        Task<EventDto?> GetEventByIdAsync(Guid id);
        Task<IReadOnlyList<EventDto>> GetEventsInRangeAsync(DateTime start, DateTime end);
        Task<EventDto> CreateEventAsync(CreateEventDto createDto);
        Task UpdateEventAsync(Guid id, CreateEventDto updateDto);
        Task DeleteEventAsync(Guid id);
        Task<IReadOnlyList<EventDto>> GetUpcomingEventsAsync(int count);
    }
}

