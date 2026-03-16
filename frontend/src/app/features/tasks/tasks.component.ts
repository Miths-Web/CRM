import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService, CrmTask, CreateTaskDto } from './services/task.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LucideAngularModule, CheckSquare, Plus, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-angular';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent, ModalComponent, ConfirmDialogComponent, LucideAngularModule],
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h2 class="page-title">Tasks</h2>
          <p class="page-subtitle">
            <span class="badge badge-red" *ngIf="overdueTasks().length > 0">{{overdueTasks().length}} overdue</span>
            Track your work and stay on schedule
          </p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()"><lucide-icon [img]="Plus" class="btn-icon-sm"></lucide-icon> New Task</button>
      </div>

      <!-- Filter Tabs -->
      <div class="status-tabs">
        <button *ngFor="let f of filters" class="status-tab" [class.active]="activeFilter() === f.key" (click)="setFilter(f.key)">
          {{f.label}} <span class="tab-count">{{getCount(f.key)}}</span>
        </button>
      </div>

      <div class="card" style="padding:0">
        <app-data-table [data]="filtered()" [columns]="columns" [pageSize]="15"
                        searchPlaceholder="Search tasks..."
                        emptyTitle="No tasks found" emptyText="Great job! No tasks here."
                        (onEdit)="openEditModal($event)" (onDelete)="confirmDelete($event)">
          <div toolbar-actions>
            <button class="btn btn-secondary btn-sm" (click)="load()"><lucide-icon [img]="RefreshCw" class="btn-icon-sm"></lucide-icon> Refresh</button>
          </div>
        </app-data-table>
      </div>

      <app-modal [isOpen]="showModal()" [title]="editingId() ? 'Edit Task' : 'New Task'" (close)="closeModal()">
        <form [formGroup]="form">
          <div class="form-group">
            <label class="form-label">Task Title *</label>
            <input formControlName="title" class="form-control" placeholder="Follow up with client" />
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Description</label>
            <textarea formControlName="description" class="form-control" rows="2" placeholder="Task details..."></textarea>
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input type="datetime-local" formControlName="dueDate" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select formControlName="priority" class="form-control">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
          <div *ngIf="error()" class="form-error mt-4">{{error()}}</div>
        </form>
        <div modal-footer>
          <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button *ngIf="editingId()" class="btn btn-success btn-sm" (click)="markDone()"><lucide-icon [img]="CheckCircle2" class="btn-icon-sm"></lucide-icon> Mark Done</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving() || form.invalid">
            {{saving() ? 'Saving...' : (editingId() ? 'Update' : 'Create')}}
          </button>
        </div>
      </app-modal>

      <app-confirm-dialog [isOpen]="showDeleteDialog()" title="Delete Task?"
        [message]="'Delete task: ' + (deletingTask()?.title ?? '') + '?'"
        (confirm)="doDelete()" (cancel)="showDeleteDialog.set(false)">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    .status-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .status-tab { padding: 0.4rem 1rem; border-radius: 50px; border: 1px solid var(--border);
      background: var(--bg-card); color: var(--text-secondary); cursor: pointer; font-size: 0.8rem; transition: var(--transition);
      &.active { background: var(--accent); color: #fff; border-color: var(--accent); }
      &:hover:not(.active) { border-color: var(--accent); color: var(--accent-light); }
    }
    .tab-count { background: rgba(255,255,255,0.15); border-radius: 10px; padding: 0 5px; margin-left: 4px; font-size: 0.7rem; }
    .form-error { padding: 0.75rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-sm); color: #fca5a5; }
    .btn-success { background: var(--success); color: #fff; }
  `]
})
export class TasksComponent implements OnInit {
  tasks = signal<CrmTask[]>([]);
  filtered = signal<CrmTask[]>([]);
  overdueTasks = signal<CrmTask[]>([]);
  showModal = signal(false);
  showDeleteDialog = signal(false);
  editingId = signal<string | null>(null);
  activeTask = signal<CrmTask | null>(null);
  deletingTask = signal<CrmTask | null>(null);
  saving = signal(false);
  error = signal('');
  activeFilter = signal('all');

  readonly CheckSquare = CheckSquare;
  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle2 = CheckCircle2;

  filters = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'done', label: 'Completed' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'high', label: 'High Priority' }
  ];

  columns: TableColumn[] = [
    { key: 'title', label: 'Title', sortable: true },
    {
      key: 'priority', label: 'Priority', type: 'badge',
      badgeMap: { Low: 'badge-gray', Medium: 'badge-blue', High: 'badge-yellow', Critical: 'badge-red' }
    },
    { key: 'dueDate', label: 'Due Date', type: 'date' },
    {
      key: 'isCompleted', label: 'Status', type: 'badge',
      badgeMap: { true: 'badge-green', false: 'badge-blue' }
    },
    { key: 'createdAt', label: 'Created', type: 'date' },
    { key: 'actions', label: '', type: 'actions', width: '100px' }
  ];

  form: FormGroup;

  constructor(private taskService: TaskService, private fb: FormBuilder) {
    this.form = this.fb.group({ title: ['', Validators.required], description: [''], dueDate: [''], priority: ['Medium'] });
  }

  ngOnInit() { this.load(); }

  load() {
    this.taskService.getPaged().subscribe({
      next: d => {
        // Map isCompleted to string for badge display
        const mapped = d.map(t => ({ ...t, isCompleted: t.isCompleted ? 'Completed' : 'Pending' as any }));
        this.tasks.set(d);
        this.overdueTasks.set(d.filter(t => !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date()));
        this.setFilter(this.activeFilter());
      }
    });
  }

  setFilter(f: string) {
    this.activeFilter.set(f);
    const now = new Date();
    let result = this.tasks();
    if (f === 'open') result = result.filter(t => !t.isCompleted);
    if (f === 'done') result = result.filter(t => t.isCompleted);
    if (f === 'overdue') result = result.filter(t => !t.isCompleted && t.dueDate && new Date(t.dueDate) < now);
    if (f === 'high') result = result.filter(t => t.priority === 'High' || t.priority === 'Critical');
    this.filtered.set(result);
  }

  getCount(f: string) {
    const now = new Date();
    if (f === 'all') return this.tasks().length;
    if (f === 'open') return this.tasks().filter(t => !t.isCompleted).length;
    if (f === 'done') return this.tasks().filter(t => t.isCompleted).length;
    if (f === 'overdue') return this.tasks().filter(t => !t.isCompleted && t.dueDate && new Date(t.dueDate) < now).length;
    if (f === 'high') return this.tasks().filter(t => t.priority === 'High' || t.priority === 'Critical').length;
    return 0;
  }

  openCreateModal() { this.editingId.set(null); this.form.reset({ priority: 'Medium' }); this.error.set(''); this.showModal.set(true); }
  openEditModal(t: CrmTask) { this.editingId.set(t.id); this.activeTask.set(t); this.form.patchValue(t); this.error.set(''); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true); this.error.set('');
    const dto = this.form.value as CreateTaskDto;
    const obs: any = this.editingId() ? this.taskService.update(this.editingId()!, dto) : this.taskService.create(dto);
    obs.subscribe({ next: () => { this.saving.set(false); this.closeModal(); this.load(); }, error: (e: any) => { this.saving.set(false); this.error.set(e.message); } });
  }

  markDone() {
    if (!this.editingId()) return;
    this.taskService.updateStatus(this.editingId()!, 'Completed').subscribe({ next: () => { this.closeModal(); this.load(); } });
  }

  confirmDelete(t: CrmTask) { this.deletingTask.set(t); this.showDeleteDialog.set(true); }
  doDelete() { this.taskService.delete(this.deletingTask()!.id).subscribe({ next: () => { this.showDeleteDialog.set(false); this.load(); } }); }
}
