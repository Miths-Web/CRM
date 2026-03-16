using CRM.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRM.Application.Common.Interfaces
{
    public interface IEventRepository : IGenericRepository<Event>
    {
        Task<IReadOnlyList<Event>> GetEventsInRangeAsync(DateTime start, DateTime end);
        Task<IReadOnlyList<Event>> GetUpcomingEventsAsync(int count);
    }
}
