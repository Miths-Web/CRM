using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CRM.Application.Interfaces;
using CRM.Application.Features.Roles.DTOs;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;

namespace CRM.Infrastructure.Services
{
    public class RoleService : IRoleService
    {
        private readonly ApplicationDbContext _context;

        public RoleService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RoleDto>> GetAllRolesAsync()
        {
            var rawRoles = await _context.Set<Role>().ToListAsync();
            var rawPermissions = await _context.RolePermissions.ToListAsync();

            var result = rawRoles.Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                Permissions = rawPermissions.Where(p => p.RoleId == r.Id).Select(p => new RolePermissionDto
                {
                    Id = p.Id,
                    Module = p.Module,
                    Permission = p.Permission
                }).ToList()
            }).ToList();

            return result;
        }

        public async Task<RoleDto> GetRoleByIdAsync(Guid id)
        {
            var r = await _context.Set<Role>().FirstOrDefaultAsync(x => x.Id == id);
            if (r == null) throw new Exception("Role not found");

            var perms = await _context.RolePermissions.Where(p => p.RoleId == id).ToListAsync();

            return new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                Permissions = perms.Select(p => new RolePermissionDto
                {
                    Id = p.Id,
                    Module = p.Module,
                    Permission = p.Permission
                }).ToList()
            };
        }

        public async Task<RoleDto> CreateRoleAsync(CreateRoleDto dto)
        {
            var role = new Role
            {
                Name = dto.Name,
                Description = dto.Description
            };
            
            _context.Set<Role>().Add(role);
            await _context.SaveChangesAsync();

            await SeedDefaultPermissionsAsync(role);

            return await GetRoleByIdAsync(role.Id);
        }

        private async Task SeedDefaultPermissionsAsync(Role role)
        {
            var pList = new List<RolePermission>();
            var now = DateTime.UtcNow;

            if (role.Name.Equals("Sales Rep", StringComparison.OrdinalIgnoreCase))
            {
                string[] modules = { "Leads", "Deals", "Customers", "Companies", "Orders", "Invoices", "Payments", "Tasks", "Events" };
                foreach (var m in modules)
                {
                    pList.Add(new RolePermission { RoleId = role.Id, Module = m, Permission = "Read", CreatedAt = now });
                    pList.Add(new RolePermission { RoleId = role.Id, Module = m, Permission = "Create", CreatedAt = now });
                    pList.Add(new RolePermission { RoleId = role.Id, Module = m, Permission = "Update", CreatedAt = now });
                }
                // Specifically add Products Read-only
                pList.Add(new RolePermission { RoleId = role.Id, Module = "Products", Permission = "Read", CreatedAt = now });
            }
            else if (role.Name.Equals("Manager", StringComparison.OrdinalIgnoreCase))
            {
                string[] modules = { "Leads", "Deals", "Customers", "Companies", "Orders", "Invoices", "Payments", "Tasks", "Events", "Products", "Feedbacks" };
                foreach (var m in modules)
                {
                    pList.Add(new RolePermission { RoleId = role.Id, Module = m, Permission = "Read", CreatedAt = now });
                    pList.Add(new RolePermission { RoleId = role.Id, Module = m, Permission = "Create", CreatedAt = now });
                    pList.Add(new RolePermission { RoleId = role.Id, Module = m, Permission = "Update", CreatedAt = now });
                    pList.Add(new RolePermission { RoleId = role.Id, Module = m, Permission = "Delete", CreatedAt = now });
                }
            }
            else if (role.Name.Equals("Viewer", StringComparison.OrdinalIgnoreCase))
            {
                string[] modules = { "Leads", "Deals", "Customers", "Companies", "Orders", "Invoices", "Products", "Tasks" };
                foreach (var m in modules)
                {
                    pList.Add(new RolePermission { RoleId = role.Id, Module = m, Permission = "Read", CreatedAt = now });
                }
            }

            if (pList.Any())
            {
                _context.RolePermissions.AddRange(pList);
                await _context.SaveChangesAsync();
            }
        }

        public async Task UpdateRoleAsync(Guid id, CreateRoleDto dto)
        {
            var r = await _context.Set<Role>().FindAsync(id);
            if (r == null) throw new Exception("Role not found");

            r.Name = dto.Name;
            r.Description = dto.Description;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteRoleAsync(Guid id)
        {
            var r = await _context.Set<Role>().FindAsync(id);
            if (r != null)
            {
                _context.Set<Role>().Remove(r);
                await _context.SaveChangesAsync();
            }
        }

        public async Task AssignPermissionAsync(Guid roleId, AssignPermissionDto dto)
        {
            var exists = await _context.RolePermissions.AnyAsync(r => r.RoleId == roleId && r.Module == dto.Module && r.Permission == dto.Permission);
            if (exists) return; // already exists

            var p = new RolePermission
            {
                RoleId = roleId,
                Module = dto.Module,
                Permission = dto.Permission,
                CreatedAt = DateTime.UtcNow
            };

            _context.RolePermissions.Add(p);
            await _context.SaveChangesAsync();
        }

        public async Task RemovePermissionAsync(Guid roleId, Guid permissionId)
        {
            var p = await _context.RolePermissions.FirstOrDefaultAsync(x => x.Id == permissionId && x.RoleId == roleId);
            if (p != null)
            {
                _context.RolePermissions.Remove(p);
                await _context.SaveChangesAsync();
            }
        }
    }
}
