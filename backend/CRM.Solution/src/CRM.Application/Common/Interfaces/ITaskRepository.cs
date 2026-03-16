using CRM.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRM.Application.Common.Interfaces
{
    public interface ITaskRepository : IGenericRepository<CrmTask>
    {
        System.Threading.Tasks.Task<IReadOnlyList<CrmTask>> GetTasksByUserIdAsync(Guid userId);
        System.Threading.Tasks.Task<IReadOnlyList<CrmTask>> GetOverdueTasksAsync();
    }
}
