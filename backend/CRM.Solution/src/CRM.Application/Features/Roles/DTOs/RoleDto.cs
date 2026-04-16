using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CRM.Application.Features.Roles.DTOs
{
    public class RoleDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public List<RolePermissionDto> Permissions { get; set; } = new List<RolePermissionDto>();
    }

    public class RolePermissionDto
    {
        public Guid Id { get; set; }
        public string Module { get; set; }
        public string Permission { get; set; }
    }

    public class CreateRoleDto
    {
        [Required]
        public string Name { get; set; }
        public string Description { get; set; }
    }

    public class AssignPermissionDto
    {
        [Required]
        public string Module { get; set; }
        [Required]
        public string Permission { get; set; } // Create, Read, Update, Delete
    }
}
