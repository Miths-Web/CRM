import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService, CrmTask, CreateTaskDto } from './services/task.service';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, CheckSquare, Plus, RefreshCw, AlertTriangle, CheckCircle2, X, Edit2, Trash2, User, Calendar } from 'lucide-angular';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, DatePipe],
  template: `
    <div class="animate-fadeIn page-container">
      <!-- Header -->
      <div class="glass-header">
        <div>
          <h2 class="page-title">Tasks</h2>
          <p class="page-subtitle">
            <span class="badge badge-red" *ngIf="overdueTasks().length > 0">{{overdueTasks().length}} overdue</span>
            Track, assign and manage team tasks
          </p>
        </div>
        <button *ngIf="canCreate" class="btn btn-primary btn-md" (click)="openCreateModal()">
          <lucide-icon [img]="Plus" class="btn-icon-sm"></lucide-icon> New Task
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="status-tabs">
        <button *ngFor="let f of filters" class="status-tab" [class.active]="activeFilter() === f.key" (click)="setFilter(f.key)">
          {{f.label}} <span class="tab-count">{{getCount(f.key)}}</span>
        </button>
      </div>

      <!-- Task Table -->
      <div class="card p-0">
        <div class="p-6 text-center" *ngIf="loading()">
          <div class="spinner"></div><p class="text-muted mt-3">Loading tasks...</p>
        </div>

        <table class="data-table" *ngIf="!loading() && filtered().length > 0">
          <thead>
            <tr>
              <th>Task</th>
              <th>Assigned To</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Status</th>
              <th class="text-right" *ngIf="canEdit || canDelete || canUpdateStatus">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of filtered()" [class.overdue-row]="isOverdue(t)">
              <td>
                <div class="task-title">{{t.title}}</div>
                <div class="text-xs text-muted mt-1" *ngIf="t.description">{{t.description | slice:0:60}}...</div>
              </td>
              <td>
                <div class="assignee-cell" *ngIf="t.assignedToUserId">
                  <div class="assignee-avatar">{{getAssigneeInitials(t.assignedToUserId)}}</div>
                  <div>
                    <div class="text-sm font-medium">{{getAssigneeName(t.assignedToUserId)}}</div>
                    <div class="text-xs text-muted">Employee</div>
                  </div>
                </div>
                <span class="text-xs text-muted" *ngIf="!t.assignedToUserId">Unassigned</span>
              </td>
              <td>
                <span class="badge" [ngClass]="getPriorityBadge(t.priority)">{{t.priority}}</span>
              </td>
              <td>
                <div class="text-sm" [class.text-danger]="isOverdue(t)" *ngIf="t.dueDate">
                  {{t.dueDate | date:'mediumDate'}}
                  <span class="text-xs ml-1" *ngIf="isOverdue(t)">⚠ Overdue</span>
                </div>
                <span class="text-muted text-xs" *ngIf="!t.dueDate">No due date</span>
              </td>
                <td class="px-4 py-3">
                  <span class="badge {{getStatusBadge(t.status || (t.isCompleted ? 'Completed' : 'Pending'))}}">
                    {{getStatusLabel(t.status || (t.isCompleted ? 'Completed' : 'Pending'))}}
                  </span>
                </td>
              <td class="text-right" *ngIf="canEdit || canDelete || canUpdateStatus">
                <div class="action-buttons">
                  <button *ngIf="!t.isCompleted && canUpdateStatus" class="action-btn text-success" (click)="markDone(t)" title="Mark Done">
                    <lucide-icon [img]="CheckCircle2" class="w-4 h-4"></lucide-icon>
                  </button>
                  <button *ngIf="canEdit || canUpdateStatus" class="action-btn" (click)="openEditModal(t)" title="Edit">
                    <lucide-icon [img]="Edit2" class="w-4 h-4"></lucide-icon>
                  </button>
                  <button *ngIf="canDelete" class="action-btn text-danger" (click)="confirmDelete(t)" title="Delete">
                    <lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty -->
        <div class="empty-state" *ngIf="!loading() && filtered().length === 0">
          <div class="empty-icon"><lucide-icon [img]="CheckSquare"></lucide-icon></div>
          <h3>No tasks found</h3>
          <p class="text-muted">Great job! No tasks in this category.</p>
          <button *ngIf="canCreate" class="btn btn-primary mt-4" (click)="openCreateModal()">Create Task</button>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal-backdrop" *ngIf="showModal()">
        <div class="modal-content animate-slideUp">
          <div class="modal-header">
            <h3>{{editingId() ? 'Edit Task' : 'New Task'}}</h3>
            <button class="close-btn" (click)="closeModal()"><lucide-icon [img]="X" class="w-5 h-5"></lucide-icon></button>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="modal-body form-grid">
              
              <div class="form-group col-span-2">
                <label>Task Title *</label>
                <input formControlName="title" class="form-control" placeholder="Follow up with client" />
              </div>

              <div class="form-group col-span-2">
                <label>Description</label>
                <textarea formControlName="description" class="form-control" rows="2" placeholder="Task details..."></textarea>
              </div>

              <div class="form-group">
                <label>Due Date</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Calendar" class="input-icon"></lucide-icon>
                  <input type="datetime-local" formControlName="dueDate" class="form-control" />
                </div>
              </div>

              <div class="form-group">
                <label>Priority</label>
                <select formControlName="priority" class="form-control">
                  <option value="Low">🟢 Low</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="High">🔴 High</option>
                  <option value="Urgent">🚨 Urgent</option>
                </select>
              </div>

              <div class="form-group" *ngIf="editingId()">
                <label>Status</label>
                <select formControlName="status" class="form-control">
                  <option value="Pending">Pending</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div class="form-group col-span-2" *ngIf="canEdit || canCreate">
                <label>Assign To</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="User" class="input-icon"></lucide-icon>
                  <select formControlName="assignedToUserId" class="form-control">
                    <option value="">-- Unassigned --</option>
                    <option *ngFor="let u of users()" [value]="u.id">{{u.name}}</option>
                  </select>
                </div>
              </div>

              <div *ngIf="error()" class="col-span-2 form-error">{{error()}}</div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button *ngIf="editingId() && canUpdateStatus" class="btn btn-success" type="button" (click)="markDoneById()">
                <lucide-icon [img]="CheckCircle2" class="btn-icon-sm"></lucide-icon> Mark Done
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="saving() || form.invalid">
                {{saving() ? 'Saving...' : (editingId() ? 'Update' : 'Create')}}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirm -->
      <div class="modal-backdrop" *ngIf="showDeleteDialog()">
        <div class="modal-content animate-slideUp" style="max-width:400px">
          <div class="modal-header">
            <h3>Delete Task?</h3>
            <button class="close-btn" (click)="showDeleteDialog.set(false)"><lucide-icon [img]="X" class="w-5 h-5"></lucide-icon></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete "<strong>{{deletingTask()?.title}}</strong>"?</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showDeleteDialog.set(false)">Cancel</button>
            <button class="btn btn-danger" (click)="doDelete()">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .glass-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-radius: 16px; margin-bottom: 1.25rem; background: rgba(255,255,255,0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }
    .btn-md { padding: 0.55rem 1.1rem; font-size: 0.875rem; }
    .status-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .status-tab { padding: 0.4rem 1rem; border-radius: 50px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-secondary); cursor: pointer; font-size: 0.8rem; transition: var(--transition);
      &.active { background: var(--accent); color: #fff; border-color: var(--accent); }
      &:hover:not(.active) { border-color: var(--accent); color: var(--accent-light); }
    }
    .tab-count { background: rgba(255,255,255,0.15); border-radius: 10px; padding: 0 5px; margin-left: 4px; font-size: 0.7rem; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 0.875rem 1rem; color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border); font-weight: 600; }
    .data-table td { padding: 0.875rem 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .data-table tr:hover td { background: var(--bg-hover); }
    .overdue-row td { background: rgba(239,68,68,0.02) !important; }

    .task-title { font-weight: 600; font-size: 0.875rem; color: var(--text-primary); }

    .assignee-cell { display: flex; align-items: center; gap: 0.5rem; }
    .assignee-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg,var(--accent),var(--info)); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; }

    .badge-red { background: rgba(239,68,68,0.1); color: #dc2626; }
    .badge-yellow { background: rgba(245,158,11,0.1); color: #d97706; }
    .badge-blue { background: rgba(59,130,246,0.1); color: #2563eb; }
    .badge-gray { background: var(--bg-secondary); color: var(--text-muted); }
    .badge-green { background: rgba(16,185,129,0.1); color: #059669; }
    .text-success { color: #059669; }
    .text-danger { color: #dc2626; }
    .ml-1 { margin-left: 0.25rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }

    .action-buttons { display: flex; gap: 0.35rem; justify-content: flex-end; }
    .action-btn { background: none; border: none; padding: 0.4rem; border-radius: 6px; color: var(--text-muted); cursor: pointer; transition: 0.2s; display:flex; align-items:center; }
    .action-btn:hover { background: var(--bg-secondary); }
    .action-btn.text-danger:hover { color: var(--danger); background: rgba(239,68,68,0.1); }
    .action-btn.text-success:hover { color: #059669; background: rgba(16,185,129,0.1); }

    .empty-state { padding: 4rem 2rem; text-align: center; }
    .empty-icon { width: 64px; height: 64px; background: rgba(124,58,237,0.1); color: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; svg { width: 32px; height: 32px; } }
    .spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }

    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-content { background: var(--bg-primary); width: 100%; max-width: 560px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; display: flex; flex-direction: column; max-height: 90vh; }
    .modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; h3 { font-size: 1.1rem; font-weight: 600; } }
    .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }
    .modal-body { padding: 1.5rem; overflow-y: auto; }
    .modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; background: var(--bg-secondary); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .col-span-2 { grid-column: span 2; }
    .form-group label { display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.4rem; }
    .form-control { width: 100%; padding: 0.65rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); font-size: 0.875rem; outline: none; transition: 0.2s; }
    .form-control:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
    .input-with-icon { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 0.8rem; width: 1.1rem; height: 1.1rem; color: var(--text-muted); }
    .input-with-icon .form-control { padding-left: 2.5rem; }
    .form-error { padding: 0.75rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-sm); color: #fca5a5; font-size: 0.85rem; }
    .btn-success { background: #059669; color:#fff; border:none; }
    .btn-success:hover { background:#047857; }
    .btn-danger { background: #dc2626; color:#fff; border:none; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class TasksComponent implements OnInit {
  tasks = signal<CrmTask[]>([]);
  filtered = signal<CrmTask[]>([]);
  overdueTasks = signal<CrmTask[]>([]);
  users = signal<any[]>([]);
  showModal = signal(false);
  showDeleteDialog = signal(false);
  editingId = signal<string | null>(null);
  deletingTask = signal<CrmTask | null>(null);
  saving = signal(false);
  loading = signal(false);
  error = signal('');
  activeFilter = signal('all');

  canCreate = false;
  canEdit = false;
  canDelete = false;
  canUpdateStatus = false;

  readonly CheckSquare = CheckSquare;
  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle2 = CheckCircle2;
  readonly X = X;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly User = User;
  readonly Calendar = Calendar;

  filters = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'done', label: 'Completed' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'high', label: 'High Priority' },
    { key: 'urgent', label: 'Urgent' }
  ];

  form: FormGroup;

  constructor(
    private taskService: TaskService,
    private settingsSvc: SettingsService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.canCreate = this.authService.hasPermission('Tasks', 'Create');
    this.canEdit = this.authService.hasPermission('Tasks', 'Update');
    this.canDelete = this.authService.hasPermission('Tasks', 'Delete');
    this.canUpdateStatus = this.canEdit || this.authService.hasRole('Sales Rep');

    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: [''],
      priority: ['Medium'],
      assignedToUserId: [''],
      status: ['Pending']
    });
  }

  ngOnInit() {
    this.load();
    this.loadUsers();
  }

  loadUsers() {
    this.settingsSvc.getUserLookup().subscribe({ next: (u: any[]) => this.users.set(u), error: () => {} });
  }

  getAssigneeName(userId: string): string {
    const u = this.users().find(u => u.id === userId);
    if (!u) return 'Unknown';
    // Remove the (Role) part for display
    return u.name ? u.name.split(' (')[0] : 'Unknown';
  }

  getAssigneeInitials(userId: string): string {
    const u = this.users().find(u => u.id === userId);
    if (!u || !u.name) return '?';
    const parts = u.name.split(' (')[0].split(' ');
    // Handle single names gracefully
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : `${parts[0][0]}`;
  }

  load() {
    this.loading.set(true);
    this.taskService.getPaged().subscribe({
      next: d => {
        // Automatically map isCompleted to status for compatibility if needed. Wait, CRM.Domain has Status! But the list has `isCompleted`. The dto handles `status`.
        this.tasks.set(d);
        this.overdueTasks.set(d.filter(t => !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date()));
        this.setFilter(this.activeFilter());
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isOverdue(t: CrmTask): boolean {
    return !t.isCompleted && !!t.dueDate && new Date(t.dueDate) < new Date();
  }

  getPriorityBadge(priority: string): string {
    const map: Record<string, string> = { Low: 'badge-gray', Medium: 'badge-blue', High: 'badge-yellow', Urgent: 'badge-red' };
    return map[priority] ?? 'badge-gray';
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = { Pending: 'badge-yellow', InProgress: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };
    return map[status] ?? 'badge-gray';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { Pending: 'Pending', InProgress: 'In Progress', Completed: 'Completed', Cancelled: 'Cancelled' };
    return map[status] ?? status;
  }

  setFilter(f: string) {
    this.activeFilter.set(f);
    const now = new Date();
    let result = this.tasks();
    if (f === 'open') result = result.filter(t => !t.isCompleted);
    if (f === 'done') result = result.filter(t => t.isCompleted);
    if (f === 'overdue') result = result.filter(t => !t.isCompleted && t.dueDate && new Date(t.dueDate) < now);
    if (f === 'high') result = result.filter(t => t.priority === 'High');
    if (f === 'urgent') result = result.filter(t => t.priority === 'Urgent');
    this.filtered.set(result);
  }

  getCount(f: string) {
    const now = new Date();
    if (f === 'all') return this.tasks().length;
    if (f === 'open') return this.tasks().filter(t => !t.isCompleted).length;
    if (f === 'done') return this.tasks().filter(t => t.isCompleted).length;
    if (f === 'overdue') return this.tasks().filter(t => !t.isCompleted && t.dueDate && new Date(t.dueDate) < now).length;
    if (f === 'high') return this.tasks().filter(t => t.priority === 'High').length;
    if (f === 'urgent') return this.tasks().filter(t => t.priority === 'Urgent').length;
    return 0;
  }

  openCreateModal() { 
    this.editingId.set(null); 
    this.form.enable();
    this.form.reset({ priority: 'Medium', status: 'Pending' }); 
    this.error.set(''); 
    this.showModal.set(true); 
  }
  
  openEditModal(t: any) {
    this.editingId.set(t.id);
    this.form.patchValue({ ...t, assignedToUserId: t.assignedToUserId || '', status: t.isCompleted ? 'Completed' : (t.status || 'Pending') });
    this.error.set('');
    
    if (!this.canEdit && this.canUpdateStatus) {
      this.form.disable();
      this.form.get('status')?.enable();
    } else {
      this.form.enable();
    }
    
    this.showModal.set(true);
  }
  
  closeModal() { this.showModal.set(false); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true); this.error.set('');
    const dto = { ...this.form.getRawValue() } as CreateTaskDto;
    if (!dto.assignedToUserId) delete dto.assignedToUserId;
    if (!dto.dueDate) delete dto.dueDate;
    
    const obs: any = this.editingId() ? this.taskService.update(this.editingId()!, dto) : this.taskService.create(dto);
    obs.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: (e: any) => { this.saving.set(false); this.error.set(e.error?.message ?? 'Failed to save task.'); }
    });
  }

  markDone(t: CrmTask) {
    this.taskService.updateStatus(t.id, 'Completed').subscribe({ next: () => this.load() });
  }

  markDoneById() {
    if (!this.editingId()) return;
    this.taskService.updateStatus(this.editingId()!, 'Completed').subscribe({ next: () => { this.closeModal(); this.load(); } });
  }

  confirmDelete(t: CrmTask) { this.deletingTask.set(t); this.showDeleteDialog.set(true); }
  doDelete() {
    this.taskService.delete(this.deletingTask()!.id).subscribe({ next: () => { this.showDeleteDialog.set(false); this.load(); } });
  }
}
