using CRM.Application.Common.Exceptions;
using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Tasks.DTOs;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TaskStatus = CRM.Domain.Enums.TaskStatus;

namespace CRM.Infrastructure.Services
{
    public class TaskService : ITaskService
    {
        private readonly ApplicationDbContext _context;

        public TaskService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async System.Threading.Tasks.Task<IReadOnlyList<TaskDto>> GetAllTasksAsync()
        {
            var tasks = await _context.CrmTasks
                .Include(t => t.AssignedToUser)
                .Include(t => t.Customer)
                .AsNoTracking()
                .ToListAsync();
            return tasks.Select(MapToDto).ToList();
        }

        public async System.Threading.Tasks.Task<TaskDto?> GetTaskByIdAsync(Guid id)
        {
            var task = await _context.CrmTasks
                .Include(t => t.AssignedToUser)
                .Include(t => t.Customer)
                .FirstOrDefaultAsync(t => t.Id == id);
            return task == null ? null : MapToDto(task);
        }

        public async System.Threading.Tasks.Task<TaskDto> CreateTaskAsync(CreateTaskDto dto)
        {
            var task = new CrmTask
            {
                Title            = dto.Title,
                Description      = dto.Description,
                Status           = dto.Status,
                Priority         = dto.Priority,
                Type             = dto.Type,
                DueDate          = dto.DueDate,
                AssignedToUserId = dto.AssignedToUserId,
                CustomerId = dto.CustomerId,
                LeadId           = dto.LeadId,
                DealId           = dto.DealId,
                CreatedAt        = DateTime.UtcNow,
                UpdatedAt        = DateTime.UtcNow
            };
            _context.CrmTasks.Add(task);
            await _context.SaveChangesAsync();
            return MapToDto(task);
        }

        public async System.Threading.Tasks.Task UpdateTaskAsync(Guid id, CreateTaskDto dto)
        {
            var task = await _context.CrmTasks.FindAsync(id)
                ?? throw new NotFoundException("Task", id);

            task.Title            = dto.Title;
            task.Description      = dto.Description;
            task.Status           = dto.Status;
            task.Priority         = dto.Priority;
            task.Type             = dto.Type;
            task.DueDate          = dto.DueDate;
            task.AssignedToUserId = dto.AssignedToUserId;
            task.CustomerId = dto.CustomerId;
            task.LeadId           = dto.LeadId;
            task.DealId           = dto.DealId;
            task.UpdatedAt        = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task DeleteTaskAsync(Guid id)
        {
            var task = await _context.CrmTasks.FindAsync(id)
                ?? throw new NotFoundException("Task", id);
            _context.CrmTasks.Remove(task);
            await _context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task UpdateTaskStatusAsync(Guid id, TaskStatus status)
        {
            var task = await _context.CrmTasks.FindAsync(id)
                ?? throw new NotFoundException("Task", id);

            task.Status    = status;
            task.UpdatedAt = DateTime.UtcNow;

            if (status == TaskStatus.Completed)
            {
                task.IsCompleted = true;
                task.CompletedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task<IReadOnlyList<TaskDto>> GetTasksByUserIdAsync(Guid userId)
        {
            var tasks = await _context.CrmTasks
                .Where(t => t.AssignedToUserId == userId)
                .AsNoTracking()
                .ToListAsync();
            return tasks.Select(MapToDto).ToList();
        }

        public async System.Threading.Tasks.Task<IReadOnlyList<TaskDto>> GetOverdueTasksAsync()
        {
            var tasks = await _context.CrmTasks
                .Where(t => t.DueDate < DateTime.UtcNow && !t.IsCompleted)
                .AsNoTracking()
                .ToListAsync();
            return tasks.Select(MapToDto).ToList();
        }

        private static TaskDto MapToDto(CrmTask t) => new TaskDto
        {
            Id               = t.Id,
            Title            = t.Title,
            Description      = t.Description,
            Status           = t.Status,
            Priority         = t.Priority,
            Type             = t.Type,
            DueDate          = t.DueDate,
            IsCompleted      = t.IsCompleted,
            CompletedAt      = t.CompletedAt,
            AssignedToUserId = t.AssignedToUserId,
            CustomerId = t.CustomerId,
            LeadId           = t.LeadId,
            DealId           = t.DealId,
            CreatedAt        = t.CreatedAt,
            UpdatedAt        = t.UpdatedAt
        };
    }
}

