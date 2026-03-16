using CRM.Application.Common.Interfaces;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRM.Infrastructure.Repositories
{
    public class EventRepository : GenericRepository<Event>, IEventRepository
    {
        public EventRepository(ApplicationDbContext dbContext) : base(dbContext) { }

        public async Task<IReadOnlyList<Event>> GetEventsInRangeAsync(DateTime start, DateTime end)
        {
            return await _dbContext.Events
                .Where(e => (e.StartDateTime >= start && e.StartDateTime <= end) || (e.EndDateTime >= start && e.EndDateTime <= end))
                .OrderBy(e => e.StartDateTime)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Event>> GetUpcomingEventsAsync(int count)
        {
            return await _dbContext.Events
                .Where(e => e.StartDateTime > DateTime.UtcNow)
                .OrderBy(e => e.StartDateTime)
                .Take(count)
                .ToListAsync();
        }
    }
}
