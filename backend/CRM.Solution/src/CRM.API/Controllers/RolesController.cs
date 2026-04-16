using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CRM.Application.Interfaces;
using CRM.Application.Features.Roles.DTOs;
using CRM.API.Attributes;

namespace CRM.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RolesController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        [HttpGet]
        [HasPermission("Roles", "Read")]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _roleService.GetAllRolesAsync());
        }

        [HttpGet("{id}")]
        [HasPermission("Roles", "Read")]
        public async Task<IActionResult> GetById(Guid id)
        {
            return Ok(await _roleService.GetRoleByIdAsync(id));
        }

        [AllowAnonymous]
        [HttpPost("seed-defaults")]
        public async Task<IActionResult> SeedDefaults([FromServices] CRM.Infrastructure.Data.ApplicationDbContext context)
        {
            var roles = context.Roles.ToList();
            var pList = new System.Collections.Generic.List<CRM.Domain.Entities.RolePermission>();
            var now = DateTime.UtcNow;

            context.RolePermissions.RemoveRange(context.RolePermissions); // Clear existing

            foreach (var role in roles)
            {
                if (role.Name.Equals("Sales Rep", StringComparison.OrdinalIgnoreCase))
                {
                    string[] modules = { "Leads", "Deals", "Customers", "Companies", "Orders", "Invoices", "Payments", "Tasks", "Events" };
                    foreach (var m in modules)
                    {
                        pList.Add(new CRM.Domain.Entities.RolePermission { RoleId = role.Id, Module = m, Permission = "Read", CreatedAt = now });
                        pList.Add(new CRM.Domain.Entities.RolePermission { RoleId = role.Id, Module = m, Permission = "Create", CreatedAt = now });
                        pList.Add(new CRM.Domain.Entities.RolePermission { RoleId = role.Id, Module = m, Permission = "Update", CreatedAt = now });
                    }
                    pList.Add(new CRM.Domain.Entities.RolePermission { RoleId = role.Id, Module = "Products", Permission = "Read", CreatedAt = now });
                }
                else if (role.Name.Equals("Manager", StringComparison.OrdinalIgnoreCase))
                {
                    string[] modules = { "Leads", "Deals", "Customers", "Companies", "Orders", "Invoices", "Payments", "Tasks", "Events", "Products", "Feedbacks" };
                    foreach (var m in modules)
                    {
                        pList.Add(new CRM.Domain.Entities.RolePermission { RoleId = role.Id, Module = m, Permission = "Read", CreatedAt = now });
                        pList.Add(new CRM.Domain.Entities.RolePermission { RoleId = role.Id, Module = m, Permission = "Create", CreatedAt = now });
                        pList.Add(new CRM.Domain.Entities.RolePermission { RoleId = role.Id, Module = m, Permission = "Update", CreatedAt = now });
                        pList.Add(new CRM.Domain.Entities.RolePermission { RoleId = role.Id, Module = m, Permission = "Delete", CreatedAt = now });
                    }
                }
                else if (role.Name.Equals("Viewer", StringComparison.OrdinalIgnoreCase))
                {
                    string[] modules = { "Leads", "Deals", "Customers", "Companies", "Orders", "Invoices", "Products", "Tasks" };
                    foreach (var m in modules)
                    {
                        pList.Add(new CRM.Domain.Entities.RolePermission { RoleId = role.Id, Module = m, Permission = "Read", CreatedAt = now });
                    }
                }
            }

            if (pList.Any())
            {
                context.RolePermissions.AddRange(pList);
                await context.SaveChangesAsync();
            }

            return Ok(new { message = "Default permissions seeded for existing roles." });
        }

        [HttpPost]
        [HasPermission("Roles", "Create")]
        public async Task<IActionResult> Create([FromBody] CreateRoleDto dto)
        {
            return Ok(await _roleService.CreateRoleAsync(dto));
        }

        [HttpPut("{id}")]
        [HasPermission("Roles", "Update")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateRoleDto dto)
        {
            await _roleService.UpdateRoleAsync(id, dto);
            return Ok(new { message = "Role updated successfully" });
        }

        [HttpDelete("{id}")]
        [HasPermission("Roles", "Delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _roleService.DeleteRoleAsync(id);
            return Ok(new { message = "Role deleted successfully" });
        }

        [HttpPost("{roleId}/permissions")]
        [HasPermission("Roles", "Assign")]
        public async Task<IActionResult> AssignPermission(Guid roleId, [FromBody] AssignPermissionDto dto)
        {
            await _roleService.AssignPermissionAsync(roleId, dto);
            return Ok(new { message = "Permission assigned successfully" });
        }

        [HttpDelete("{roleId}/permissions/{permissionId}")]
        [HasPermission("Roles", "Assign")]
        public async Task<IActionResult> RemovePermission(Guid roleId, Guid permissionId)
        {
            await _roleService.RemovePermissionAsync(roleId, permissionId);
            return Ok(new { message = "Permission removed successfully" });
        }
    }
}
