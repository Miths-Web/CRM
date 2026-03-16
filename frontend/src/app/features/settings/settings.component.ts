import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { LucideAngularModule, Settings, User, Lock, Users, UserPlus, X, Building2, Monitor, CheckCircle2, AlertTriangle, Database, Trash2, FlaskConical } from 'lucide-angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h2 class="page-title"><lucide-icon [img]="Settings" class="inline-icon"></lucide-icon> Settings</h2>
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
          <h3 class="settings-title"><lucide-icon [img]="User" class="inline-icon"></lucide-icon> My Profile</h3>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
            <div class="profile-avatar-section">
              <div class="avatar avatar-lg">{{userInitials()}}</div>
              <div>
                <div style="font-weight:700;font-size:1rem">{{currentUser()?.firstName}} {{currentUser()?.lastName}}</div>
                <div class="text-muted text-sm">{{currentUser()?.roles?.[0]}}</div>
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
            <div *ngIf="profileSuccess()" class="form-success mt-4"><lucide-icon [img]="CheckCircle2" class="inline-icon"></lucide-icon> Profile updated successfully!</div>
            <div class="mt-4">
              <button type="submit" class="btn btn-primary" [disabled]="savingProfile()">
                {{savingProfile() ? 'Saving...' : 'Save Profile'}}
              </button>
            </div>
          </form>
        </div>

        <div class="card settings-card">
          <h3 class="settings-title"><lucide-icon [img]="Lock" class="inline-icon"></lucide-icon> Change Password</h3>
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
            <div *ngIf="pwError()" class="form-error mt-4"><lucide-icon [img]="AlertTriangle" class="inline-icon"></lucide-icon> {{pwError()}}</div>
            <div *ngIf="pwSuccess()" class="form-success mt-4"><lucide-icon [img]="CheckCircle2" class="inline-icon"></lucide-icon> Password changed!</div>
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
            <h3 class="settings-title"><lucide-icon [img]="Users" class="inline-icon"></lucide-icon> User Management</h3>
            <button class="btn btn-primary btn-sm" (click)="showAddUser.set(!showAddUser())">
              <lucide-icon [img]="showAddUser() ? X : UserPlus" class="btn-icon-sm"></lucide-icon>
              {{showAddUser() ? 'Cancel' : 'Add User'}}
            </button>
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
            <div *ngIf="userError()" class="form-error mt-4"><lucide-icon [img]="AlertTriangle" class="inline-icon"></lucide-icon> {{userError()}}</div>
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
                <span class="badge badge-purple">{{u.roles?.[0]}}</span>
                <span class="badge" [ngClass]="u.isActive ? 'badge-green' : 'badge-gray'">
                  {{u.isActive ? 'Active' : 'Inactive'}}
                </span>
                <button *ngIf="u.id !== currentUser()?.id" class="btn btn-secondary btn-sm" style="margin-left: 0.5rem; padding: 0.2rem 0.5rem; font-size: 0.7rem;" (click)="toggleUser(u)">
                  {{u.isActive ? 'Deactivate' : 'Activate'}}
                </button>
              </div>
            </div>
            <div *ngIf="users().length === 0" class="text-muted text-sm" style="padding:1rem;text-align:center">No users found</div>
          </div>
        </div>
      </div>

      <!-- System Tab -->
      <div *ngIf="activeTab()==='system'" class="settings-section animate-fadeIn">
        <div class="card settings-card">
          <h3 class="settings-title"><lucide-icon [img]="Building2" class="inline-icon"></lucide-icon> Company Settings</h3>
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
            <div *ngIf="systemSuccess()" class="form-success mt-4"><lucide-icon [img]="CheckCircle2" class="inline-icon"></lucide-icon> Settings saved!</div>
            <div class="mt-4">
              <button type="submit" class="btn btn-primary">Save Settings</button>
            </div>
          </form>
        </div>

        <div class="card settings-card">
          <h3 class="settings-title"><lucide-icon [img]="Monitor" class="inline-icon"></lucide-icon> System Info</h3>
          <div class="info-grid">
            <div class="info-item"><span class="text-muted">App Version</span><strong>1.0.0</strong></div>
            <div class="info-item"><span class="text-muted">App Name</span><strong>Dhwiti CRM</strong></div>
            <div class="info-item"><span class="text-muted">Backend</span><strong>.NET 8 Web API</strong></div>
            <div class="info-item"><span class="text-muted">Database</span><strong>MySQL 8</strong></div>
            <div class="info-item"><span class="text-muted">Frontend</span><strong>Angular 18</strong></div>
            <div class="info-item"><span class="text-muted">Real-time</span><strong>SignalR</strong></div>
          </div>
        </div>
      </div>
      <!-- Admin Tools Tab -->
      <div *ngIf="activeTab()==='admin'" class="settings-section animate-fadeIn">
        <div class="card settings-card">
          <h3 class="settings-title"><lucide-icon [img]="Database" class="inline-icon"></lucide-icon> Admin Tools</h3>
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
  seeding  = signal(false);
  clearing = signal(false);

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
  readonly FlaskConical = FlaskConical;

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
    private toast: ToastService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({ firstName: [''], lastName: [''], email: [''], phone: [''], department: [''], jobTitle: [''] });
    this.passwordForm = this.fb.group({ currentPassword: ['', Validators.required], newPassword: ['', [Validators.required, Validators.minLength(6)]], confirmPassword: ['', Validators.required] });
    this.userForm = this.fb.group({ firstName: ['', Validators.required], lastName: ['', Validators.required], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(6)]], role: ['Sales Rep', Validators.required] });
    this.systemForm = this.fb.group({ companyName: ['Dhwiti CRM'], supportEmail: [''], timezone: ['Asia/Kolkata'] });
  }

  ngOnInit() {
    const u = this.auth.getCurrentUser();
    if (u) this.profileForm.patchValue(u);
    this.loadUsers();
  }

  currentUser() { return this.auth.getCurrentUser(); }
  userInitials() { const u = this.currentUser(); return u ? `${u.firstName[0]}${u.lastName[0]}` : '?'; }

  loadUsers() {
    this.settingsSvc.getAllUsers().subscribe({ next: (u: any[]) => this.users.set(u), error: () => { } });
  }

  saveProfile() {
    this.savingProfile.set(true);
    this.settingsSvc.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.profileSuccess.set(true);
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
