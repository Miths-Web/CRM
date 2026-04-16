import { Component, OnInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { LucideAngularModule, Settings, User, Lock, Users, UserPlus, X, Building2, Monitor, CheckCircle2, AlertTriangle, Database, Trash2, Edit2, FlaskConical, Eye, Camera, Shield, Target, UserCheck, CircleDollarSign, MessageSquare, BarChart2, Briefcase } from 'lucide-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h2 class="page-title">Settings</h2>
          <p class="page-subtitle">Manage system configuration and user accounts</p>
        </div>
      </div>

      <!-- Settings Tabs -->
      <div class="settings-tabs">
        <button *ngFor="let t of tabs" class="settings-tab" [class.active]="activeTab()===t.key" (click)="activeTab.set(t.key)">
          <lucide-icon [img]="t.icon" class="btn-icon-sm"></lucide-icon> {{t.label}}
        </button>
      </div>

      <!-- Profile Tab -->
      <div *ngIf="activeTab()==='profile'" class="settings-section animate-fadeIn">
        <div class="card settings-card">
          <h3 class="settings-title">My Profile</h3>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
            <div class="profile-avatar-section">
              <div class="profile-avatar-controls text-center mr-4" style="position:relative">
                <div class="avatar-view-container mx-auto" style="width:100px;height:100px;border-radius:50%;overflow:visible;cursor:pointer;position:relative" (click)="showAvatarMenu.set(!showAvatarMenu())">
                  <div style="width:100px;height:100px;border-radius:50%;overflow:hidden;border:2px solid var(--border)">
                    <div class="avatar avatar-lg" style="width:100%;height:100%;font-size:2rem" *ngIf="!avatarPreview() && !currentUser()?.avatarUrl">
                      {{userInitials()}}
                    </div>
                    <img *ngIf="avatarPreview() || currentUser()?.avatarUrl" [src]="avatarPreview() || currentUser()?.avatarUrl" style="width:100%;height:100%;object-fit:cover" />
                  </div>
                  <div class="avatar-edit-icon" style="position:absolute;bottom:0;right:0;background:var(--accent);color:#fff;border-radius:50%;padding:6px;box-shadow:0 2px 4px rgba(0,0,0,0.2)">
                    <lucide-icon [img]="Camera" style="width:16px;height:16px;display:block"></lucide-icon>
                  </div>
                </div>

                <div class="avatar-dropdown-menu" *ngIf="showAvatarMenu()">
                  <div class="avatar-dropdown-item" *ngIf="avatarPreview() || currentUser()?.avatarUrl" (click)="viewingAvatar.set(true); showAvatarMenu.set(false)">
                    <lucide-icon [img]="Eye" class="btn-icon-sm"></lucide-icon> View Photo
                  </div>
                  <div class="avatar-dropdown-item" (click)="triggerAvatarUpload(); showAvatarMenu.set(false)">
                    <lucide-icon [img]="Camera" class="btn-icon-sm"></lucide-icon> Upload Photo
                  </div>
                  <div class="avatar-dropdown-item text-danger" *ngIf="avatarPreview() || currentUser()?.avatarUrl" (click)="deleteAvatar(); showAvatarMenu.set(false)">
                    <lucide-icon [img]="Trash2" class="btn-icon-sm"></lucide-icon> Remove Photo
                  </div>
                </div>

                <input type="file" #avatarInput accept="image/*" style="display:none" (change)="onAvatarSelected($event)" />
              </div>
              <div>
                <div style="font-weight:700;font-size:1rem">{{currentUser()?.firstName}} {{currentUser()?.lastName}}</div>
                <div class="text-muted text-sm">{{currentUser()?.roles?.[0]}}</div>
                <div class="text-xs text-muted mt-1">Administrator · Mithilesh Yadav</div>
              </div>
            </div>
            <div class="grid-2 mt-4">
              <div class="form-group">
                <label class="form-label">First Name</label>
                <input formControlName="firstName" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Last Name</label>
                <input formControlName="lastName" class="form-control" />
              </div>
            </div>
            <div class="grid-2 mt-4">
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" formControlName="email" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Phone</label>
                <input formControlName="phone" class="form-control" />
              </div>
            </div>
            <div class="grid-2 mt-4">
              <div class="form-group">
                <label class="form-label">Department</label>
                <input formControlName="department" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Job Title</label>
                <input formControlName="jobTitle" class="form-control" />
              </div>
            </div>
            <div *ngIf="profileSuccess()" class="form-success mt-4">Profile updated successfully!</div>
            <div class="mt-4">
              <button type="submit" class="btn btn-primary" [disabled]="savingProfile()">
                {{savingProfile() ? 'Saving...' : 'Save Profile'}}
              </button>
            </div>
          </form>
        </div>

        <div class="card settings-card">
          <h3 class="settings-title">Change Password</h3>
          <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input type="password" formControlName="currentPassword" class="form-control" />
            </div>
            <div class="grid-2 mt-4">
              <div class="form-group">
                <label class="form-label">New Password</label>
                <input type="password" formControlName="newPassword" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <input type="password" formControlName="confirmPassword" class="form-control" />
              </div>
            </div>
            <div *ngIf="pwError()" class="form-error mt-4">{{pwError()}}</div>
            <div *ngIf="pwSuccess()" class="form-success mt-4">Password changed!</div>
            <div class="mt-4">
              <button type="submit" class="btn btn-primary" [disabled]="passwordForm.invalid">Change Password</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Users Tab (Admin only) -->
      <div *ngIf="activeTab()==='users'" class="settings-section animate-fadeIn">
        <div class="card settings-card">
          <div class="flex-between mb-4">
            <h3 class="settings-title">User Management</h3>
            <div>
              <button class="btn btn-outline btn-sm" (click)="goTo('/settings/roles')" style="margin-right: 0.5rem">
                <lucide-icon [img]="Shield" class="btn-icon-sm"></lucide-icon> Manage Roles
              </button>
              <button class="btn btn-primary btn-sm" (click)="showAddUser.set(!showAddUser())">
                <lucide-icon [img]="showAddUser() ? X : UserPlus" class="btn-icon-sm"></lucide-icon>
                {{showAddUser() ? 'Cancel' : 'Add User'}}
              </button>
            </div>
          </div>

          <form *ngIf="showAddUser()" [formGroup]="userForm" class="add-user-form" (ngSubmit)="createUser()">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">First Name *</label>
                <input formControlName="firstName" class="form-control" placeholder="Rahul" />
              </div>
              <div class="form-group">
                <label class="form-label">Last Name *</label>
                <input formControlName="lastName" class="form-control" placeholder="Sharma" />
              </div>
            </div>
            <div class="grid-2 mt-4">
              <div class="form-group">
                <label class="form-label">Email *</label>
                <input type="email" formControlName="email" class="form-control" placeholder="rahul@company.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Password *</label>
                <input type="password" formControlName="password" class="form-control" placeholder="••••••••" />
              </div>
            </div>
            <div class="form-group mt-4">
              <label class="form-label">Role *</label>
              <select formControlName="role" class="form-control">
                <option value="Sales Rep">Sales Rep</option>
                <option value="Manager">Manager</option>
                <option value="Support Agent">Support Agent</option>
                <option value="Viewer">Viewer</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div *ngIf="userError()" class="form-error mt-4">{{userError()}}</div>
            <div class="mt-4">
              <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid || creatingUser()">
                {{creatingUser() ? 'Creating...' : 'Create User'}}
              </button>
            </div>
          </form>

          <div class="user-list">
            <div class="user-row" *ngFor="let u of users()">
              <div class="user-avatar avatar-sm avatar">{{u.firstName?.[0]}}{{u.lastName?.[0]}}</div>
              <div class="user-info">
                <div style="font-weight:600">{{u.firstName}} {{u.lastName}}</div>
                <div class="text-sm text-muted">{{u.email}}</div>
              </div>
              <div class="user-badges" style="align-items: center">
                <!-- If Not Editing -->
                <ng-container *ngIf="editingUserId() !== u.id">
                  <span class="badge badge-purple">{{u.roles?.[0]}}</span>
                  <span class="badge" [ngClass]="u.isActive ? 'badge-green' : 'badge-gray'">
                    {{u.isActive ? 'Active' : 'Inactive'}}
                  </span>
                  
                  <!-- Actions -->
                  <div style="display:flex; gap:0.25rem; margin-left:1rem">
                    <button class="btn btn-sm btn-outline" title="Change Role" (click)="startEditUser(u)" *ngIf="u.id !== currentUser()?.id">
                       <lucide-icon [img]="Edit2" class="w-4 h-4"></lucide-icon>
                    </button>
                    <button *ngIf="u.id !== currentUser()?.id" class="btn btn-secondary btn-sm" (click)="toggleUser(u)">
                      {{u.isActive ? 'Deactivate' : 'Activate'}}
                    </button>
                    <button class="btn btn-sm btn-outline text-danger" title="Delete User" (click)="deleteUser(u)" *ngIf="u.id !== currentUser()?.id">
                       <lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon>
                    </button>
                  </div>
                </ng-container>

                <!-- If Editing Role -->
                <ng-container *ngIf="editingUserId() === u.id">
                  <select class="form-control-sm" [(ngModel)]="editingUserRole" style="width:130px">
                    <option *ngFor="let r of availableRoles" [value]="r">{{r}}</option>
                  </select>
                  <button class="btn btn-primary btn-sm" (click)="saveUserRole(u)">Save</button>
                  <button class="btn btn-outline btn-sm" (click)="cancelEditUser()">Cancel</button>
                </ng-container>
              </div>
            </div>
            <div *ngIf="users().length === 0" class="text-muted text-sm" style="padding:1rem;text-align:center">No users found</div>
          </div>
        </div>
      </div>

      <!-- System Tab -->
      <div *ngIf="activeTab()==='system'" class="settings-section animate-fadeIn">
        <div class="card settings-card">
          <h3 class="settings-title">Company Settings</h3>
          <form [formGroup]="systemForm" (ngSubmit)="saveSystem()">
            <div class="form-group">
              <label class="form-label">Company Name</label>
              <input formControlName="companyName" class="form-control" />
            </div>
            <div class="form-group mt-4">
              <label class="form-label">Support Email</label>
              <input type="email" formControlName="supportEmail" class="form-control" />
            </div>
            <div class="form-group mt-4">
              <label class="form-label">Timezone</label>
              <select formControlName="timezone" class="form-control">
                <option value="Asia/Kolkata">IST — Asia/Kolkata</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">ET — New York</option>
                <option value="Europe/London">GMT — London</option>
              </select>
            </div>
            <div *ngIf="systemSuccess()" class="form-success mt-4">Settings saved!</div>
            <div class="mt-4">
              <button type="submit" class="btn btn-primary">Save Settings</button>
            </div>
          </form>
        </div>

        <div class="card settings-card">
          <h3 class="settings-title">System Info</h3>
          <div class="info-grid">
            <div class="info-item"><span class="text-muted">App Version</span><strong>1.0.0</strong></div>
            <div class="info-item"><span class="text-muted">App Name</span><strong>Dhwiti CRM</strong></div>
            <div class="info-item"><span class="text-muted">Backend</span><strong>.NET 8 Web API</strong></div>
            <div class="info-item"><span class="text-muted">Database</span><strong>SQL Server</strong></div>
            <div class="info-item"><span class="text-muted">Frontend</span><strong>Angular 18</strong></div>
            <div class="info-item"><span class="text-muted">Real-time</span><strong>SignalR</strong></div>
          </div>
        </div>
      </div>
      <!-- Admin Tools Tab -->
      <div *ngIf="activeTab()==='admin'" class="settings-section animate-fadeIn">
        
        <div class="card settings-card" style="max-width: 1000px;">
          <!-- Admin Tools -->

          <h3 class="settings-title">Data Operations</h3>
          <p class="text-muted text-sm mb-4">Use these tools to populate or reset all CRM data. Only visible to Admins.</p>

          <!-- Seed Demo Data -->
          <div class="admin-tool-card">
            <div class="admin-tool-info">
              <lucide-icon [img]="FlaskConical" class="tool-icon green"></lucide-icon>
              <div>
                <div class="tool-title">Load Demo Data</div>
                <div class="tool-desc">Adds 3 companies, 4 customers, 4 leads, 3 deals, 4 products, 2 orders, 2 invoices, 4 tasks, 3 notes, 2 emails and 3 events.</div>
              </div>
            </div>
            <button class="btn btn-success" (click)="seedDemo()" [disabled]="seeding()">
              <lucide-icon [img]="FlaskConical" class="btn-icon-sm"></lucide-icon>
              {{ seeding() ? 'Loading...' : 'Load Demo Data' }}
            </button>
          </div>

          <!-- Fix Role Permissions -->
          <div class="admin-tool-card" style="margin-top:1rem; border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.04);">
            <div class="admin-tool-info">
              <lucide-icon [img]="Shield" class="tool-icon" style="color:#6366f1"></lucide-icon>
              <div>
                <div class="tool-title">Fix Role Permissions</div>
                <div class="tool-desc">Auto-assigns correct permissions to existing Sales Rep, Manager, and Viewer roles. Run this once if users are getting Access Denied errors.</div>
              </div>
            </div>
            <button class="btn" style="background:#6366f1;color:#fff;" (click)="fixPermissions()" [disabled]="fixingPerms()">
              <lucide-icon [img]="Shield" class="btn-icon-sm"></lucide-icon>
              {{ fixingPerms() ? 'Fixing...' : 'Fix Permissions' }}
            </button>
          </div>

          <!-- Clear All Data -->
          <div class="admin-tool-card danger-card" style="margin-top:1rem">
            <div class="admin-tool-info">
              <lucide-icon [img]="Trash2" class="tool-icon red"></lucide-icon>
              <div>
                <div class="tool-title">Clear All Data</div>
                <div class="tool-desc">Permanently deletes all Companies, Customers, Leads, Deals, Orders, Invoices, Payments, Tasks, Notes, Emails and Events. Users & Roles are preserved.</div>
              </div>
            </div>
            <button class="btn btn-danger" (click)="clearAll()" [disabled]="clearing()">
              <lucide-icon [img]="Trash2" class="btn-icon-sm"></lucide-icon>
              {{ clearing() ? 'Clearing...' : 'Clear All Data' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Avatar View Modal -->
      <div class="modal-backdrop" *ngIf="viewingAvatar()" (click)="viewingAvatar.set(false)">
        <div class="modal-content text-center" style="max-width:500px; padding:1rem; background:transparent; box-shadow:none" (click)="$event.stopPropagation()">
          <img [src]="avatarPreview() || currentUser()?.avatarUrl" style="max-width:100%; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.5)" />
          <button class="btn btn-secondary mt-4" (click)="viewingAvatar.set(false)" style="background:rgba(255,255,255,0.2); color:#fff; border:none; backdrop-filter:blur(10px)">Close Viewer</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-tabs { display:flex; gap:0.5rem; margin-bottom:1.5rem; flex-wrap:wrap; }
    .settings-tab  { padding:0.5rem 1.25rem; border-radius:50px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-secondary); cursor:pointer; font-size:0.875rem; transition:var(--transition);
      &.active { background:var(--accent); color:#fff; border-color:var(--accent); }
      &:hover:not(.active) { border-color:var(--accent); color:var(--accent-light); }
    }
    .settings-section { display:flex; flex-direction:column; gap:1rem; }
    .settings-card    { max-width: 720px; }
    .settings-title   { font-size:1rem; font-weight:700; margin-bottom:1.25rem; }
    .profile-avatar-section { display:flex; align-items:center; gap:1rem; padding:1rem; background:var(--bg-secondary); border-radius:var(--radius-sm); }
    .avatar-lg { width:56px; height:56px; font-size:1.25rem; }
    .text-center { text-align:center; }
    .mx-auto { margin-left:auto; margin-right:auto; }
    .mr-4 { margin-right: 1.5rem; }
    .flex-center { justify-content:center; }
    
    .avatar-dropdown-menu { position:absolute; top:calc(100% + 5px); left:50%; transform:translateX(-50%); background:var(--bg-card); border:1px solid var(--border); border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.15); z-index:50; width:180px; padding:0.5rem; text-align:left; animation: slideUp 0.2s ease-out; }
    .avatar-dropdown-item { display:flex; align-items:center; gap:0.5rem; padding:0.6rem 1rem; border-radius:8px; cursor:pointer; font-size:0.85rem; color:var(--text); transition:var(--transition); }
    .avatar-dropdown-item:hover { background:var(--bg-secondary); color:var(--accent); }
    .avatar-dropdown-item.text-danger { color:#ef4444; }
    .avatar-dropdown-item.text-danger:hover { background:rgba(239,68,68,0.1); }
    
    .modal-backdrop { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:9999; animation: fadeIn 0.2s ease-out; }
    .modal-content  { animation: slideUp 0.3s ease-out; }

    .add-user-form { background:var(--bg-secondary); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem; border:1px solid var(--border-accent); }
    .user-list { display:flex; flex-direction:column; gap:0; margin-top:0.5rem; }
    .user-row  { display:flex; align-items:center; gap:1rem; padding:0.875rem 0; border-bottom:1px solid var(--border); &:last-child{border-bottom:none} }
    .user-info { flex:1; }
    .user-badges { display:flex; gap:0.4rem; }

    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
    .info-item { display:flex; flex-direction:column; gap:0.2rem; background:var(--bg-secondary); padding:0.75rem; border-radius:var(--radius-sm); span{font-size:0.75rem} strong{font-size:0.9rem} }

    /* Admin Tools */
    .admin-tool-card { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:1.25rem; background:var(--bg-secondary); border-radius:var(--radius-md); border:1px solid var(--border); }
    .danger-card { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.04); }
    .admin-tool-info { display:flex; align-items:flex-start; gap:1rem; flex:1; }
    .tool-icon { width:2.5rem; height:2.5rem; flex-shrink:0; padding:0.5rem; border-radius:8px; }
    .tool-icon.green { background: rgba(16,185,129,0.1); color: #059669; }
    .tool-icon.red   { background: rgba(239,68,68,0.1);  color: #dc2626; }
    .tool-title { font-weight:600; font-size:0.95rem; margin-bottom:0.25rem; }
    .tool-desc  { font-size:0.8rem; color: var(--text-muted); line-height:1.5; }
    .btn-success { background: #059669; color:#fff; border:none; }
    .btn-success:hover { background:#047857; }
    .btn-danger  { background: #dc2626; color:#fff; border:none; }
    .btn-danger:hover  { background:#b91c1c; }
    .mb-4 { margin-bottom:1rem; }

    .form-success { padding:0.75rem; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:var(--radius-sm); color:#6ee7b7; }
    .form-error   { padding:0.75rem; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-sm); color:#fca5a5; }
    .mt-4 { margin-top:1rem; }

    /* Admin Modules */
    .admin-module-card { display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem; background: var(--bg-hover); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; }
    .admin-module-card:hover { background: var(--bg-card); border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .module-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; flex-shrink: 0; }
    .module-icon lucide-icon { width: 20px; height: 20px; }
    .bg-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .bg-purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
    .bg-green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .bg-orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
    .bg-teal { background: rgba(20, 184, 166, 0.1); color: #14b8a6; }
    .bg-yellow { background: rgba(234, 179, 8, 0.1); color: #eab308; }
    .bg-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    
    .module-title { font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem; color: var(--text-primary); }
    .module-desc { font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; }
  `]
})
export class SettingsComponent implements OnInit {
  activeTab = signal('profile');
  showAddUser = signal(false);
  users = signal<any[]>([]);
  savingProfile = signal(false);
  profileSuccess = signal(false);
  pwError = signal('');
  pwSuccess = signal(false);
  userError = signal('');
  creatingUser = signal(false);
  systemSuccess = signal(false);
  seeding      = signal(false);
  clearing     = signal(false);
  fixingPerms  = signal(false);
  avatarPreview = signal<string | null>(null);
  viewingAvatar = signal(false);
  showAvatarMenu = signal(false);

  // User Management Role Edit State
  editingUserId = signal<string | null>(null);
  editingUserRole = '';
  availableRoles = ['Admin', 'Manager', 'Sales Rep', 'Support Agent', 'Viewer'];

  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  readonly Settings     = Settings;
  readonly User         = User;
  readonly Lock         = Lock;
  readonly Users        = Users;
  readonly UserPlus     = UserPlus;
  readonly X            = X;
  readonly Building2    = Building2;
  readonly Monitor      = Monitor;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertTriangle = AlertTriangle;
  readonly Database     = Database;
  readonly Trash2       = Trash2;
  readonly Edit2        = Edit2;
  readonly FlaskConical = FlaskConical;
  readonly Eye          = Eye;
  readonly Camera       = Camera;
  readonly Shield       = Shield;
  readonly Target       = Target;
  readonly UserCheck    = UserCheck;
  readonly CircleDollarSign = CircleDollarSign;
  readonly MessageSquare = MessageSquare;
  readonly BarChart2    = BarChart2;
  readonly Briefcase    = Briefcase;

  tabs = [
    { key: 'profile', icon: User,        label: 'My Profile' },
    { key: 'users',   icon: Users,        label: 'Users'      },
    { key: 'system',  icon: Building2,    label: 'System'     },
    { key: 'admin',   icon: Database,     label: '🛠 Admin Tools' }
  ];

  profileForm: FormGroup;
  passwordForm: FormGroup;
  userForm: FormGroup;
  systemForm: FormGroup;

  constructor(
    private settingsSvc: SettingsService,
    private auth: AuthService,
    public toast: ToastService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.profileForm = this.fb.group({ firstName: [''], lastName: [''], email: [''], phone: [''], department: [''], jobTitle: [''], avatarUrl: [''] });
    this.passwordForm = this.fb.group({ currentPassword: ['', Validators.required], newPassword: ['', [Validators.required, Validators.minLength(6)]], confirmPassword: ['', Validators.required] });
    this.userForm = this.fb.group({ firstName: ['', Validators.required], lastName: ['', Validators.required], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(6)]], role: ['Sales Rep', Validators.required] });
    this.systemForm = this.fb.group({ companyName: ['Dhwiti CRM'], supportEmail: [''], timezone: ['Asia/Kolkata'] });
  }

  ngOnInit() {
    this.settingsSvc.getProfile().subscribe({
      next: (p) => {
        this.profileForm.patchValue(p);
        this.auth.updateCurrentUser(p); // Sync to storage
      },
      error: () => {
        const u = this.auth.getCurrentUser();
        if (u) this.profileForm.patchValue(u);
      }
    });
    this.loadUsers();
  }

  currentUser() { return this.auth.getCurrentUser(); }
  userInitials() { const u = this.currentUser(); return u ? `${u.firstName[0]}${u.lastName[0]}` : '?'; }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  triggerAvatarUpload() {
    this.avatarInput?.nativeElement?.click();
  }

  onAvatarSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to API
    const formData = new FormData();
    formData.append('file', file);

    this.settingsSvc.uploadAvatar(formData).subscribe({
      next: (res) => {
        this.profileForm.patchValue({ avatarUrl: res.avatarUrl });
        const currentUser = this.auth.getCurrentUser();
        if (currentUser) {
          currentUser.avatarUrl = res.avatarUrl;
          this.auth.updateCurrentUser(currentUser); 
        }
        this.toast.success('Avatar Uploaded', 'Your profile photo has been successfully saved to the database!');
      },
      error: (e) => {
        this.toast.error('Upload Failed', e.error?.message ?? 'Failed to upload the avatar to the database.');
      }
    });
  }

  deleteAvatar() {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;
    this.settingsSvc.removeAvatar().subscribe({
      next: () => {
        this.avatarPreview.set(null);
        this.profileForm.patchValue({ avatarUrl: null });
        const currentUser = this.auth.getCurrentUser();
        if (currentUser) {
          currentUser.avatarUrl = undefined;
          this.auth.updateCurrentUser(currentUser);
        }
        this.toast.success('Avatar Removed', 'Your profile photo has been deleted.');
      },
      error: (e) => {
        this.toast.error('Remove Failed', e.error?.message ?? 'Could not remove avatar.');
      }
    });
  }

  loadUsers() {
    this.settingsSvc.getAllUsers().subscribe({ next: (u: any[]) => this.users.set(u), error: () => { } });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true);
    const dto = { ...this.profileForm.value };
    if (dto.phone === '') dto.phone = null;
    
    this.settingsSvc.updateProfile(dto).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.profileSuccess.set(true);
        // Sync local storage
        const current = this.auth.getCurrentUser();
        if (current) {
          const updated = { ...current, ...dto };
          this.auth.updateCurrentUser(updated);
        }
        this.toast.success('Profile Saved', 'Your profile was updated successfully.');
        setTimeout(() => this.profileSuccess.set(false), 3000);
      },
      error: (e: any) => {
        this.savingProfile.set(false);
        this.toast.error('Save Failed', e.error?.message ?? 'Could not update profile.');
      }
    });
  }

  changePassword() {
    this.pwError.set(''); this.pwSuccess.set(false);
    const v = this.passwordForm.value;
    if (v.newPassword !== v.confirmPassword) { this.pwError.set('Passwords do not match.'); return; }
    this.settingsSvc.changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword, confirmPassword: v.confirmPassword }).subscribe({
      next: () => {
        this.pwSuccess.set(true);
        this.passwordForm.reset();
        this.toast.success('Password Changed', 'Your password was updated.');
      },
      error: (e: any) => {
        this.pwError.set(e.error?.message ?? 'Failed');
        this.toast.error('Error', e.error?.message ?? 'Failed to change password.');
      }
    });
  }

  createUser() {
    if (this.userForm.invalid) return;
    this.creatingUser.set(true); this.userError.set('');
    this.settingsSvc.createUser(this.userForm.value).subscribe({
      next: () => {
        this.creatingUser.set(false);
        this.showAddUser.set(false);
        this.userForm.reset({ role: 'Sales Rep' });
        this.loadUsers();
        this.toast.success('User Created', `New user has been securely added.`);
      },
      error: (e: any) => {
        this.creatingUser.set(false);
        this.userError.set(e.error?.message ?? 'Failed to create user');
        this.toast.error('Create Failed', e.error?.message ?? 'Could not create user.');
      }
    });
  }

  toggleUser(u: any) {
    this.settingsSvc.toggleUserStatus(u.id).subscribe({
      next: () => {
        u.isActive = !u.isActive;
        this.toast.success('Status Updated', `${u.firstName}'s access has been ${u.isActive ? 'activated' : 'deactivated'}.`);
      },
      error: (e: any) => this.toast.error('Error', e.error?.message ?? 'Could not update user status.')
    });
  }

  startEditUser(u: any) {
    this.editingUserId.set(u.id);
    this.editingUserRole = u.roles?.[0] ?? 'Viewer';
  }

  cancelEditUser() {
    this.editingUserId.set(null);
  }

  saveUserRole(u: any) {
    if (!this.editingUserRole) return;
    this.settingsSvc.updateUserRole(u.id, this.editingUserRole).subscribe({
      next: () => {
        u.roles = [this.editingUserRole];
        this.toast.success('Role Updated', `${u.firstName}'s role was updated to ${this.editingUserRole}.`);
        this.editingUserId.set(null);
      },
      error: (e: any) => {
        this.toast.error('Update Failed', e.error?.message ?? 'Could not update role.');
      }
    });
  }

  deleteUser(u: any) {
    if (!confirm(`WARNING: Are you sure you want to permanently delete user ${u.firstName} ${u.lastName}? This action cannot be undone.`)) return;
    
    this.settingsSvc.deleteUser(u.id).subscribe({
      next: () => {
        this.users.update(list => list.filter(x => x.id !== u.id));
        this.toast.success('User Deleted', `${u.firstName} ${u.lastName} has been deleted.`);
      },
      error: (e: any) => {
        this.toast.error('Delete Failed', e.error?.message ?? 'Could not delete user.');
      }
    });
  }

  saveSystem() {
    this.settingsSvc.updateCompanySettings(this.systemForm.value).subscribe({
      next: () => {
        this.systemSuccess.set(true);
        this.toast.success('Settings Saved', 'Company settings have been updated.');
        setTimeout(() => this.systemSuccess.set(false), 3000);
      },
      error: () => this.toast.error('Save Failed', 'Could not save company settings.')
    });
  }

  seedDemo() {
    if (!confirm('This will add demo data to your CRM. Only works if the database is empty. Continue?')) return;
    this.seeding.set(true);
    this.settingsSvc.seedDemoData().subscribe({
      next: (res: any) => {
        this.seeding.set(false);
        this.toast.success('Demo Data Loaded! 🎉', res.message ?? 'All demo records added successfully.');
      },
      error: (e: any) => {
        this.seeding.set(false);
        this.toast.error('Seed Failed', e.error?.message ?? 'Could not seed demo data.');
      }
    });
  }

  fixPermissions() {
    if (!confirm('This will reset permissions for Sales Rep, Manager, and Viewer roles to their defaults. Continue?')) return;
    this.fixingPerms.set(true);
    this.settingsSvc.seedDefaultPermissions().subscribe({
      next: (res: any) => {
        this.fixingPerms.set(false);
        this.toast.success('Permissions Fixed! ✅', res.message ?? 'Role permissions have been updated successfully.');
      },
      error: (e: any) => {
        this.fixingPerms.set(false);
        this.toast.error('Fix Failed', e.error?.message ?? 'Could not fix permissions.');
      }
    });
  }

  clearAll() {
    if (!confirm('⚠️ WARNING: This will permanently delete ALL Companies, Customers, Leads, Deals, Orders, Invoices, Products, Tasks, Notes, Emails and Events.\n\nUsers and Roles will be preserved.\n\nAre you absolutely sure?')) return;
    if (!confirm('Last chance! Click OK to permanently delete all business data.')) return;
    this.clearing.set(true);
    this.settingsSvc.clearAllData().subscribe({
      next: (res: any) => {
        this.clearing.set(false);
        this.toast.success('Data Cleared ✓', res.message ?? 'All data has been wiped.');
      },
      error: (e: any) => {
        this.clearing.set(false);
        this.toast.error('Clear Failed', e.error?.message ?? 'Could not clear data.');
      }
    });
  }
}
