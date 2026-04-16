import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DealService, Deal, DealStage, CreateDealDto } from './services/deal.service';
import { CompanyService } from '../../core/services/company.service';
import { CustomerService } from '../../core/services/customer.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LucideAngularModule, CircleDollarSign, List, Columns, Plus, Trash2, AlertTriangle } from 'lucide-angular';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ConfirmDialogComponent, LucideAngularModule],
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h2 class="page-title">Deals Pipeline</h2>
          <p class="page-subtitle">Open Pipeline: ₹{{totalPipeline() | number:'1.0-0'}} &nbsp;|&nbsp; Total Won: ₹{{wonDealsValue() | number:'1.0-0'}}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" (click)="viewMode.set(viewMode() === 'kanban' ? 'list' : 'kanban')">
            <lucide-icon [img]="viewMode() === 'kanban' ? List : Columns" class="btn-icon-sm"></lucide-icon>
            {{viewMode() === 'kanban' ? 'List' : 'Kanban'}}
          </button>
          <button *ngIf="canCreate" class="btn btn-primary" (click)="openCreateModal()"><lucide-icon [img]="Plus" class="btn-icon-sm"></lucide-icon> New Deal</button>
        </div>
      </div>

      <!-- Status Filter Tabs -->
      <div class="status-tabs" *ngIf="!loading()">
        <button class="status-tab" [class.active]="statusFilter() === 'All'" (click)="statusFilter.set('All')">
          All <span class="tab-count">{{deals().length}}</span>
        </button>
        <button class="status-tab" [class.active]="statusFilter() === 'Open'" (click)="statusFilter.set('Open')">
          Open <span class="tab-count">{{countByStatus('Open')}}</span>
        </button>
        <button class="status-tab won" [class.active]="statusFilter() === 'Won'" (click)="statusFilter.set('Won')">
          Won <span class="tab-count">{{countByStatus('Won')}}</span>
        </button>
        <button class="status-tab lost" [class.active]="statusFilter() === 'Lost'" (click)="statusFilter.set('Lost')">
          Lost <span class="tab-count">{{countByStatus('Lost')}}</span>
        </button>
      </div>

      <!-- Loading -->
      <div class="flex-center" style="padding:2rem" *ngIf="loading()"><div class="spinner"></div></div>

      <!-- Kanban Board -->
      <div class="kanban-board" *ngIf="!loading() && viewMode() === 'kanban'">
        <div class="kanban-col" *ngFor="let stage of stages()">
          <div class="kanban-col-header">
            <div class="col-title">{{stage.name}}</div>
            <div class="col-meta">
              <span class="col-count">{{getDealsForStage(stage.id).length}}</span>
              <span class="col-value">₹{{getStageValue(stage.id) | number:'1.0-0'}}</span>
            </div>
          </div>
          <div class="kanban-cards">
            <div class="deal-card" *ngFor="let deal of getDealsForStage(stage.id)"
                 (click)="canEdit ? openEditModal(deal) : null" [style.cursor]="canEdit ? 'pointer' : 'default'">
              <div class="deal-card-title">{{deal.title}}</div>
              <div class="deal-card-company" *ngIf="deal.companyName">{{deal.companyName}}</div>
              <div class="deal-card-footer">
                <span class="deal-value">₹{{deal.value | number:'1.0-0'}}</span>
                <span class="deal-status-badge" [class.won]="deal.status==='Won'" [class.lost]="deal.status==='Lost'" [class.open]="deal.status==='Open'">{{deal.status}}</span>
              </div>
              <div class="deal-card-actions" *ngIf="canDelete">
                <button class="action-mini flex-center" (click)="$event.stopPropagation(); confirmDelete(deal)" title="Delete"><lucide-icon [img]="Trash2" class="w-3 h-3"></lucide-icon></button>
              </div>
            </div>
            <div class="kanban-empty" *ngIf="getDealsForStage(stage.id).length === 0">
              No deals
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div class="card" style="padding:0; overflow:hidden" *ngIf="!loading() && viewMode() === 'list'">
        <table class="data-table">
          <thead>
            <tr>
              <th>Title</th><th>Company</th><th>Value</th><th>Stage</th>
              <th>Probability</th><th>Status</th><th>Close Date</th><th *ngIf="canDelete"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let deal of filteredDeals()" (click)="canEdit ? openEditModal(deal) : null" [style.cursor]="canEdit ? 'pointer' : 'default'">
              <td><strong>{{deal.title}}</strong></td>
              <td>{{deal.companyName || '—'}}</td>
              <td><strong style="color:var(--success)">₹{{deal.value | number:'1.0-0'}}</strong></td>
              <td><span class="badge badge-purple">{{deal.stageName || '—'}}</span></td>
              <td>{{deal.probability}}%</td>
              <td>
                <span class="badge" [ngClass]="{'badge-green':deal.status==='Won','badge-red':deal.status==='Lost','badge-blue':deal.status==='Open'}">
                  {{deal.status}}
                </span>
              </td>
              <td>{{deal.expectedCloseDate | date:'dd MMM yyyy'}}</td>
              <td (click)="$event.stopPropagation()" *ngIf="canDelete">
                <button class="btn-icon flex-center" (click)="confirmDelete(deal)"><lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon></button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" *ngIf="filteredDeals().length === 0">
          <div class="empty-icon text-muted"><lucide-icon [img]="CircleDollarSign"></lucide-icon></div>
          <div class="empty-title">No deals found</div>
          <p class="empty-text">No deals match the selected filter.</p>
        </div>
      </div>

      <!-- Modal -->
      <app-modal [isOpen]="showModal()" [title]="editingId() ? 'Edit Deal' : 'New Deal'" [maxWidth]="'640px'" (close)="closeModal()">
        <form [formGroup]="form">
          <div class="form-group">
            <label class="form-label">Deal Title *</label>
            <input formControlName="title" class="form-control" placeholder="Enterprise License Sale" />
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">Value (₹) *</label>
              <input type="number" formControlName="value" class="form-control" placeholder="100000" />
            </div>
            <div class="form-group">
              <label class="form-label">Probability (%)</label>
              <input type="number" formControlName="probability" class="form-control" placeholder="50" min="0" max="100" />
            </div>
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">Stage</label>
              <select formControlName="stageId" class="form-control">
                <option *ngFor="let s of stages()" [value]="s.id">{{s.name}}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select formControlName="status" class="form-control">
                <option value="Open">Open</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
                <option value="OnHold">On Hold</option>
              </select>
            </div>
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">Company</label>
              <select formControlName="companyId" class="form-control">
                <option value="">No Company</option>
                <option *ngFor="let c of companies()" [value]="c.id">{{c.companyName}}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Customer Contact</label>
              <select formControlName="customerId" class="form-control">
                <option value="">No Customer</option>
                <option *ngFor="let c of customers()" [value]="c.id">{{c.firstName}} {{c.lastName}}</option>
              </select>
            </div>
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">Expected Close Date</label>
              <input type="date" formControlName="expectedCloseDate" class="form-control" />
            </div>
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Description</label>
            <textarea formControlName="description" class="form-control" rows="2"></textarea>
          </div>
          <div *ngIf="error()" class="form-error mt-4">{{error()}}</div>
        </form>
        <div modal-footer>
          <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving() || form.invalid">
            {{saving() ? 'Saving...' : (editingId() ? 'Update' : 'Create Deal')}}
          </button>
        </div>
      </app-modal>

      <app-confirm-dialog [isOpen]="showDeleteDialog()" title="Delete Deal?"
        [message]="'Delete: ' + (deletingDeal()?.title ?? '') + '?'"
        (confirm)="doDelete()" (cancel)="showDeleteDialog.set(false)">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    .kanban-board { display: flex; gap: 0.75rem; flex-wrap: wrap; padding-bottom: 1rem; }
    .kanban-col { flex: 0 0 220px; max-width: 250px; min-width: 200px; background: var(--bg-secondary); border-radius: var(--radius-md);
      border: 1px solid var(--border); display: flex; flex-direction: column; min-height: 250px; max-height: 75vh; }
    .kanban-col-header { padding: 0.875rem 1rem; border-bottom: 1px solid var(--border);
      display: flex; justify-content: space-between; align-items: center;
      background: var(--bg-card); border-radius: var(--radius-md) var(--radius-md) 0 0;
    }
    .col-title { font-weight: 700; font-size: 0.875rem; }
    .col-meta  { display: flex; gap: 0.5rem; flex-direction: column; align-items: flex-end; }
    .col-count { background: var(--accent); color: #fff; border-radius: 10px; padding: 0 6px; font-size: 0.65rem; font-weight: 700; }
    .col-value { font-size: 0.7rem; color: var(--success); font-weight: 600; }

    .kanban-cards { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.6rem; overflow-y: auto; flex: 1; }
    .deal-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm);
      padding: 0.875rem; cursor: pointer; transition: var(--transition); position: relative;
      &:hover { border-color: var(--accent); box-shadow: var(--shadow-glow); transform: translateY(-1px); }
    }
    .deal-card-title   { font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem; }
    .deal-card-company { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem; }
    .deal-card-footer  { display: flex; justify-content: space-between; align-items: center; }
    .deal-value        { font-weight: 700; color: var(--success); font-size: 0.85rem; }
    .deal-prob         { font-size: 0.7rem; color: var(--text-muted); }
    .deal-card-actions { position: absolute; top: 0.5rem; right: 0.5rem; opacity: 0; transition: var(--transition); }
    .deal-card:hover .deal-card-actions { opacity: 1; }
    .action-mini { background: var(--bg-hover); border: 1px solid var(--border); border-radius: 4px;
      padding: 0.15rem 0.3rem; cursor: pointer; font-size: 0.7rem; &:hover { border-color: var(--danger); } }
    .kanban-empty { text-align: center; padding: 1rem; font-size: 0.75rem; color: var(--text-muted); }

    .form-error { padding: 0.75rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-sm); color: #fca5a5; font-size: 0.875rem; }
    .btn-icon { background: var(--bg-hover); border: 1px solid var(--border); border-radius: 6px; padding: 0.3rem 0.5rem; cursor: pointer; &:hover { border-color: var(--danger); background: rgba(239,68,68,0.1); } }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Status Filter Tabs */
    .status-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .status-tab {
      padding: 0.4rem 1rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600;
      border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-secondary);
      cursor: pointer; transition: var(--transition); display: flex; align-items: center; gap: 0.4rem;
      &:hover { border-color: var(--accent); color: var(--accent); }
      &.active { background: var(--accent); color: #fff; border-color: var(--accent); }
      &.won.active { background: var(--success); border-color: var(--success); }
      &.lost.active { background: var(--danger); border-color: var(--danger); }
    }
    .tab-count { background: rgba(255,255,255,0.2); border-radius: 999px; padding: 0 6px; font-size: 0.7rem; }
    .status-tab:not(.active) .tab-count { background: var(--bg-hover); color: var(--text-muted); }

    /* Status badge on Kanban card */
    .deal-status-badge { font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 6px; }
    .deal-status-badge.open { background: rgba(59,130,246,0.15); color: #93c5fd; }
    .deal-status-badge.won  { background: rgba(34,197,94,0.15);  color: #86efac; }
    .deal-status-badge.lost { background: rgba(239,68,68,0.15);  color: #fca5a5; }
  `]
})
export class DealsComponent implements OnInit {
  deals = signal<Deal[]>([]);
  stages = signal<DealStage[]>([]);
  companies = signal<any[]>([]);
  customers = signal<any[]>([]);
  showModal = signal(false);
  showDeleteDialog = signal(false);
  editingId = signal<string | null>(null);
  deletingDeal = signal<Deal | null>(null);
  saving = signal(false);
  error = signal('');
  loading = signal(true);
  statusFilter = signal<'All' | 'Open' | 'Won' | 'Lost'>('All');
  viewMode = signal<'kanban' | 'list'>('kanban');

  canCreate = false;
  canEdit = false;
  canDelete = false;

  readonly CircleDollarSign = CircleDollarSign;
  readonly List = List;
  readonly Columns = Columns;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly AlertTriangle = AlertTriangle;

  form: FormGroup;

  constructor(
    private dealService: DealService,
    private companyService: CompanyService,
    private customerService: CustomerService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.canCreate = this.authService.hasPermission('Deals', 'Create');
    this.canEdit = this.authService.hasPermission('Deals', 'Update');
    this.canDelete = this.authService.hasPermission('Deals', 'Delete');

    this.form = this.fb.group({
      title: ['', Validators.required], value: [0, Validators.required],
      probability: [50], stageId: [null], status: ['Open'],
      companyId: [null], customerId: [null], expectedCloseDate: [''], description: ['']
    });
  }

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.companyService.getCompanies(1, 100).subscribe({ next: (res: any) => this.companies.set(res.items || res) });
    this.customerService.getCustomers(1, 100).subscribe({ next: (res: any) => this.customers.set(res.items || res) });
    this.dealService.getStages().subscribe({ next: s => this.stages.set(s) });
    this.dealService.getPaged().subscribe({ next: d => { this.deals.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  getDealsForStage(stageId: number) {
    const filter = this.statusFilter();
    return this.deals().filter(d => d.stageId === stageId && (filter === 'All' || d.status === filter));
  }
  getStageValue(id: number) { return this.getDealsForStage(id).reduce((s, d) => s + d.value, 0); }
  totalPipeline() { return this.deals().filter(d => d.status === 'Open').reduce((s, d) => s + d.value, 0); }
  wonDealsValue() { return this.deals().filter(d => d.status === 'Won').reduce((s, d) => s + d.value, 0); }
  totalAllDealsValue() { return this.deals().reduce((s, d) => s + d.value, 0); }
  filteredDeals() {
    const filter = this.statusFilter();
    return filter === 'All' ? this.deals() : this.deals().filter(d => d.status === filter);
  }

  countByStatus(status: string) { return this.deals().filter(d => d.status === status).length; }

  openCreateModal() { this.editingId.set(null); this.form.reset({ status: 'Open', probability: 50 }); this.error.set(''); this.showModal.set(true); }
  openEditModal(d: Deal) {
    this.editingId.set(d.id);
    // Convert numeric enum back to string for the form dropdown
    const statusMap: Record<number, string> = { 1: 'Open', 2: 'Won', 3: 'Lost', 4: 'OnHold' };
    const patchVal = { ...d, status: statusMap[d.status as any] || d.status };
    this.form.patchValue(patchVal);
    this.error.set('');
    this.showModal.set(true);
  }
  closeModal() { this.showModal.set(false); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true); this.error.set('');
    const raw = this.form.value;

    // DealStatus enum: Open=1, Won=2, Lost=3, OnHold=4
    const statusMap: Record<string, number> = { 'Open': 1, 'Won': 2, 'Lost': 3, 'OnHold': 4 };
    const dto: CreateDealDto = {
      ...raw,
      status: typeof raw.status === 'string' ? (statusMap[raw.status] ?? 1) : raw.status,
      stageId: raw.stageId ? Number(raw.stageId) : null,
      probability: Number(raw.probability) || 0,
      value: Number(raw.value) || 0,
      expectedCloseDate: raw.expectedCloseDate || null
    };

    const obs: any = this.editingId() ? this.dealService.update(this.editingId()!, dto) : this.dealService.create(dto);
    obs.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.loadAll(); },
      error: (e: any) => {
        this.saving.set(false);
        // Extract readable message from HttpErrorResponse
        const msg = e?.error?.message || e?.error?.Message || e?.error?.title || e?.message || 'An error occurred.';
        this.error.set(msg);
      }
    });
  }

  confirmDelete(d: Deal) { this.deletingDeal.set(d); this.showDeleteDialog.set(true); }
  doDelete() { this.dealService.delete(this.deletingDeal()!.id).subscribe({ next: () => { this.showDeleteDialog.set(false); this.loadAll(); } }); }
}
