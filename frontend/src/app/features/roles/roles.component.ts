import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Shield, Edit2, Trash2, Plus, Save, X, PlusCircle } from 'lucide-angular';
import { RoleService, Role, RolePermission } from '../../core/services/role.service';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  isLoading = true;

  // Icons
  readonly Shield = Shield;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly Save = Save;
  readonly X = X;
  readonly PlusCircle = PlusCircle;

  // Create/Edit Role
  showRoleModal = false;
  editingRole: Role | null = null;
  roleForm = { name: '', description: '' };

  // Assign Permission
  showPermissionModal = false;
  activeRoleForPermission: Role | null = null;
  permForm = { module: '', permission: 'Read' };
  modules = ['Users', 'Roles', 'Leads', 'Customers', 'Sales', 'Reports', 'Settings', 'Tickets', 'Knowledge Base', 'Feedbacks', 'Products', 'Orders', 'Invoices', 'Tasks', 'Deals'];
  permissions = ['Create', 'Read', 'Update', 'Delete', 'Assign', 'Export'];

  constructor(private roleService: RoleService, private toast: ToastService) {}

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.isLoading = true;
    this.roleService.getAll().subscribe({
      next: (res) => {
        this.roles = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error('Load Failed', 'Could not load roles.');
        this.isLoading = false;
      }
    });
  }

  openRoleModal(role?: Role) {
    if (role) {
      this.editingRole = role;
      this.roleForm = { name: role.name, description: role.description };
    } else {
      this.editingRole = null;
      this.roleForm = { name: '', description: '' };
    }
    this.showRoleModal = true;
  }

  closeRoleModal() {
    this.showRoleModal = false;
    this.editingRole = null;
  }

  saveRole() {
    if (!this.roleForm.name) {
      this.toast.warning('Validation', 'Role name is required.');
      return;
    }

    if (this.editingRole) {
      this.roleService.update(this.editingRole.id, this.roleForm).subscribe({
        next: () => {
          this.toast.success('Success', 'Role updated successfully.');
          this.loadRoles();
          this.closeRoleModal();
        },
        error: () => this.toast.error('Error', 'Failed to update role.')
      });
    } else {
      this.roleService.create(this.roleForm).subscribe({
        next: () => {
          this.toast.success('Success', 'Role created successfully.');
          this.loadRoles();
          this.closeRoleModal();
        },
        error: () => this.toast.error('Error', 'Failed to create role.')
      });
    }
  }

  deleteRole(id: string) {
    if (confirm('Are you sure you want to delete this role?')) {
      this.roleService.delete(id).subscribe({
        next: () => {
          this.toast.success('Success', 'Role deleted.');
          this.loadRoles();
        },
        error: () => this.toast.error('Error', 'Failed to delete role.')
      });
    }
  }

  openPermissionModal(role: Role) {
    this.activeRoleForPermission = role;
    this.permForm = { module: 'Leads', permission: 'Read' };
    this.showPermissionModal = true;
  }

  closePermissionModal() {
    this.showPermissionModal = false;
    this.activeRoleForPermission = null;
  }

  assignPermission() {
    if (!this.activeRoleForPermission) return;
    
    this.roleService.assignPermission(this.activeRoleForPermission.id, this.permForm.module, this.permForm.permission)
      .subscribe({
        next: () => {
          this.toast.success('Success', 'Permission assigned.');
          this.loadRoles();
          this.closePermissionModal();
        },
        error: () => this.toast.error('Error', 'Could not assign permission.')
      });
  }

  removePermission(roleId: string, permId: string) {
    if (confirm('Remove this permission?')) {
      this.roleService.removePermission(roleId, permId).subscribe({
        next: () => {
          this.toast.success('Success', 'Permission removed.');
          this.loadRoles();
        },
        error: () => this.toast.error('Error', 'Could not remove permission.')
      });
    }
  }
}
