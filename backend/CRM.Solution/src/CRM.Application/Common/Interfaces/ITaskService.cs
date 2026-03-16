using CRM.Application.Features.Tasks.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRM.Application.Common.Interfaces
{
    public interface ITaskService
    {
        System.Threading.Tasks.Task<IReadOnlyList<TaskDto>> GetAllTasksAsync();
        System.Threading.Tasks.Task<TaskDto?> GetTaskByIdAsync(Guid id);
        System.Threading.Tasks.Task<TaskDto> CreateTaskAsync(CreateTaskDto dto);
        System.Threading.Tasks.Task UpdateTaskAsync(Guid id, CreateTaskDto dto);
        System.Threading.Tasks.Task DeleteTaskAsync(Guid id);
        System.Threading.Tasks.Task UpdateTaskStatusAsync(Guid id, CRM.Domain.Enums.TaskStatus status);
        System.Threading.Tasks.Task<IReadOnlyList<TaskDto>> GetTasksByUserIdAsync(Guid userId);
        System.Threading.Tasks.Task<IReadOnlyList<TaskDto>> GetOverdueTasksAsync();
    }
}
