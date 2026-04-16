using CRM.Application.Common.Interfaces;
using CRM.Application.Features.Tasks.DTOs;
using CRM.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using TaskStatus = CRM.Domain.Enums.TaskStatus;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var tasks = await _taskService.GetAllTasksAsync();
            return Ok(tasks);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var task = await _taskService.GetTaskByIdAsync(id);
            if (task == null) return NotFound();
            return Ok(task);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTaskDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var createdTask = await _taskService.CreateTaskAsync(model);
            return CreatedAtAction(nameof(GetById), new { id = createdTask.Id }, createdTask);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateTaskDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                await _taskService.UpdateTaskAsync(id, model);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _taskService.DeleteTaskAsync(id);
            return NoContent();
        }

        // ── DTO for status update to avoid 415 with bare enum ──
        public record UpdateStatusDto(string Status);

        [HttpPut("{id:guid}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusDto dto)
        {
            if (!Enum.TryParse<TaskStatus>(dto.Status, ignoreCase: true, out var status))
                return BadRequest(new { Message = $"Invalid status value: {dto.Status}. Use: Pending, InProgress, Completed, Cancelled" });
            try
            {
                await _taskService.UpdateTaskStatusAsync(id, status);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("my-tasks")]
        public async Task<IActionResult> GetMyTasks()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var tasks = await _taskService.GetTasksByUserIdAsync(userId);
            return Ok(tasks);
        }

        [HttpGet("overdue")]
        public async Task<IActionResult> GetOverdueTasks()
        {
            var tasks = await _taskService.GetOverdueTasksAsync();
            return Ok(tasks);
        }
    }
}
