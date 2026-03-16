using CRM.Application.Common.Interfaces;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRM.Infrastructure.Repositories
{
    public class TaskRepository : GenericRepository<CrmTask>, ITaskRepository
    {
        private readonly ApplicationDbContext _appContext;

        public TaskRepository(ApplicationDbContext context) : base(context)
        {
            _appContext = context;
        }

        public async System.Threading.Tasks.Task<IReadOnlyList<CrmTask>> GetTasksByUserIdAsync(Guid userId)
        {
            return await _appContext.CrmTasks
                .Where(t => t.AssignedToUserId == userId)
                .AsNoTracking()
                .ToListAsync();
        }

        public async System.Threading.Tasks.Task<IReadOnlyList<CrmTask>> GetOverdueTasksAsync()
        {
            return await _appContext.CrmTasks
                .Where(t => t.DueDate < DateTime.UtcNow && !t.IsCompleted)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
