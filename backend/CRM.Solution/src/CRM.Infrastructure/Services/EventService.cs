using CRM.Application.Common.Exceptions;
using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Events.DTOs;
using CRM.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Task = System.Threading.Tasks.Task;

namespace CRM.Infrastructure.Services
{
    public class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;

        public EventService(IEventRepository eventRepository)
        {
            _eventRepository = eventRepository;
        }

        public async Task<EventDto?> GetEventByIdAsync(Guid id)
        {
            var entity = await _eventRepository.GetByIdAsync(id);
            return entity == null ? null : MapToDto(entity);
        }

        public async Task<IReadOnlyList<EventDto>> GetEventsInRangeAsync(DateTime start, DateTime end)
        {
            var events = await _eventRepository.GetEventsInRangeAsync(start, end);
            return events.Select(MapToDto).ToList();
        }

        public async Task<EventDto> CreateEventAsync(CreateEventDto createDto)
        {
            var evt = new Event
            {
                Title = createDto.Title,
                Description = createDto.Description,
                Type = createDto.Type,
                StartDateTime = createDto.StartDateTime,
                EndDateTime = createDto.EndDateTime,
                IsAllDay = createDto.IsAllDay,
                Location = createDto.Location,
                Color = createDto.Color,
                ReminderMinutes = createDto.ReminderMinutes,
                AssignedToUserId = createDto.AssignedToUserId,
                Attendees = createDto.Attendees,
                RelatedCustomerId = createDto.RelatedCustomerId,
                RelatedDealId = createDto.RelatedDealId,
                IsRecurring = createDto.IsRecurring,
                RecurrenceRule = createDto.RecurrenceRule
            };

            var added = await _eventRepository.AddAsync(evt);
            return MapToDto(added);
        }

        public async Task UpdateEventAsync(Guid id, CreateEventDto updateDto)
        {
            var evt = await _eventRepository.GetByIdAsync(id);
            if (evt == null) throw new NotFoundException("Event not found");

            evt.Title = updateDto.Title;
            evt.Description = updateDto.Description;
            evt.Type = updateDto.Type;
            evt.StartDateTime = updateDto.StartDateTime;
            evt.EndDateTime = updateDto.EndDateTime;
            evt.IsAllDay = updateDto.IsAllDay;
            evt.Location = updateDto.Location;
            evt.Color = updateDto.Color;
            evt.ReminderMinutes = updateDto.ReminderMinutes;
            evt.AssignedToUserId = updateDto.AssignedToUserId;
            evt.Attendees = updateDto.Attendees;
            evt.RelatedCustomerId = updateDto.RelatedCustomerId;
            evt.RelatedDealId = updateDto.RelatedDealId;
            evt.IsRecurring = updateDto.IsRecurring;
            evt.RecurrenceRule = updateDto.RecurrenceRule;
            evt.UpdatedAt = DateTime.UtcNow;

            await _eventRepository.UpdateAsync(evt);
        }

        public async Task DeleteEventAsync(Guid id)
        {
            await _eventRepository.DeleteByIdAsync(id);
        }

        public async Task<IReadOnlyList<EventDto>> GetUpcomingEventsAsync(int count)
        {
            var events = await _eventRepository.GetUpcomingEventsAsync(count);
            return events.Select(MapToDto).ToList();
        }

        private EventDto MapToDto(Event evt)
        {
            return new EventDto
            {
                Id = evt.Id,
                Title = evt.Title,
                Description = evt.Description,
                Type = evt.Type,
                StartDateTime = evt.StartDateTime,
                EndDateTime = evt.EndDateTime,
                IsAllDay = evt.IsAllDay,
                Location = evt.Location,
                Color = evt.Color,
                ReminderMinutes = evt.ReminderMinutes,
                AssignedToUserId = evt.AssignedToUserId,
                Attendees = evt.Attendees,
                RelatedCustomerId = evt.RelatedCustomerId,
                RelatedDealId = evt.RelatedDealId,
                IsRecurring = evt.IsRecurring,
                RecurrenceRule = evt.RecurrenceRule,
                CreatedAt = evt.CreatedAt
            };
        }
    }
}




