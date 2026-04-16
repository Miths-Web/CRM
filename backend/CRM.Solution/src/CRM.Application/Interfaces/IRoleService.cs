using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CRM.Application.Features.Roles.DTOs;

namespace CRM.Application.Interfaces
{
    public interface IRoleService
    {
        Task<IEnumerable<RoleDto>> GetAllRolesAsync();
        Task<RoleDto> GetRoleByIdAsync(Guid id);
        Task<RoleDto> CreateRoleAsync(CreateRoleDto dto);
        Task UpdateRoleAsync(Guid id, CreateRoleDto dto);
        Task DeleteRoleAsync(Guid id);

        Task AssignPermissionAsync(Guid roleId, AssignPermissionDto dto);
        Task RemovePermissionAsync(Guid roleId, Guid permissionId);
    }
}
