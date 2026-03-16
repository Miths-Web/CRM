import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LeadService, Lead, CreateLeadDto } from './services/lead.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LucideAngularModule, Target, Plus, RefreshCw, AlertTriangle, Zap } from 'lucide-angular';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent, ModalComponent, ConfirmDialogComponent, LucideAngularModule],
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h2 class="page-title">Leads</h2>
          <p class="page-subtitle">Track and convert your leads into customers</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()"><lucide-icon [img]="Plus" class="btn-icon-sm"></lucide-icon> Add Lead</button>
      </div>

      <!-- Status Filter Tabs -->
      <div class="status-tabs">
        <button *ngFor="let s of statuses" class="status-tab"
                [class.active]="activeStatus() === s"
                (click)="activeStatus.set(s); filterLeads()">
          {{s}} <span class="tab-count">{{getCount(s)}}</span>
        </button>
      </div>

      <div class="card" style="padding:0">
        <app-data-table [data]="filtered()" [columns]="columns" [pageSize]="15"
                        searchPlaceholder="Search leads..."
                        emptyTitle="No leads found" emptyText="Add your first lead."
                        (onEdit)="openEditModal($event)"
                        (onDelete)="confirmDelete($event)">
          <div toolbar-actions>
            <button class="btn btn-secondary btn-sm" (click)="load()"><lucide-icon [img]="RefreshCw" class="btn-icon-sm"></lucide-icon> Refresh</button>
          </div>
        </app-data-table>
      </div>

      <!-- Modal -->
      <app-modal [isOpen]="showModal()" [title]="editingId() ? 'Edit Lead' : 'New Lead'" [maxWidth]="'680px'" (close)="closeModal()">
        <form [formGroup]="form">
          <div class="form-group">
            <label class="form-label">Lead Title <span style="color:#ef4444">*</span></label>
            <input formControlName="title" class="form-control"
              [class.field-invalid]="isInvalid('title')"
              placeholder="e.g. Interest in Enterprise Plan" />
            <div class="form-field-error" *ngIf="isInvalid('title')">Lead title is required.</div>
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input formControlName="firstName" class="form-control" placeholder="Rahul" />
            </div>
            <div class="form-group">
              <label class="form-label">Last Name</label>
              <input formControlName="lastName" class="form-control" placeholder="Sharma" />
            </div>
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" formControlName="email" class="form-control"
                [class.field-invalid]="isInvalid('email')"
                placeholder="rahul@company.com" />
              <div class="form-field-error" *ngIf="isInvalid('email')">Please enter a valid email.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" formControlName="phone" class="form-control"
                [class.field-invalid]="isInvalid('phone')"
                placeholder="9876543210" maxlength="15"
                (keypress)="onlyNumbers($event)" />
              <div class="form-field-error" *ngIf="isInvalid('phone')">Please enter digits only.</div>
            </div>
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">Company</label>
              <input formControlName="company" class="form-control" placeholder="Acme Corp" />
            </div>
            <div class="form-group">
              <label class="form-label">Estimated Value (₹)</label>
              <input type="number" formControlName="estimatedValue" class="form-control"
                [class.field-invalid]="isInvalid('estimatedValue')"
                placeholder="50000" min="0" step="1" />
              <div class="form-field-error" *ngIf="isInvalid('estimatedValue')">Value must be 0 or greater.</div>
            </div>
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">Source</label>
              <select formControlName="source" class="form-control">
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="SocialMedia">Social Media</option>
                <option value="Email">Email</option>
                <option value="Phone">Phone</option>
                <option value="Event">Event</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select formControlName="status" class="form-control">
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Notes / Description</label>
            <textarea formControlName="description" class="form-control" rows="3" placeholder="Any additional notes..."></textarea>
          </div>
          <div *ngIf="error()" class="form-error mt-4">{{error()}}</div>
        </form>
        <div modal-footer>
          <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button *ngIf="editingId()" class="btn btn-success btn-sm" (click)="convertLead()"><lucide-icon [img]="Zap" class="btn-icon-sm"></lucide-icon> Convert</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving() || form.invalid">
            {{saving() ? 'Saving...' : (editingId() ? 'Update' : 'Create Lead')}}
          </button>
        </div>
      </app-modal>

      <app-confirm-dialog [isOpen]="showDeleteDialog()" title="Delete Lead?"
        [message]="'Delete lead: ' + (deletingLead()?.title ?? '') + '?'"
        (confirm)="doDelete()" (cancel)="showDeleteDialog.set(false)">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    .status-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .status-tab { padding: 0.4rem 1rem; border-radius: 50px; border: 1px solid var(--border);
      background: var(--bg-card); color: var(--text-secondary); cursor: pointer; font-size: 0.8rem;
      transition: var(--transition);
      &.active { background: var(--accent); color: #fff; border-color: var(--accent); }
      &:hover:not(.active) { border-color: var(--accent); color: var(--accent-light); }
    }
    .tab-count { background: rgba(255,255,255,0.15); border-radius: 10px; padding: 0 5px; margin-left: 4px; font-size: 0.7rem; }
    .form-error { padding: 0.75rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-sm); color: #fca5a5; font-size: 0.875rem; }
    .btn-success { background: var(--success); color: #fff; }
    .field-invalid { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
    .form-field-error { color: #ef4444; font-size: 0.75rem; margin-top: 4px; }
  `]
})
export class LeadsComponent implements OnInit {
  leads = signal<Lead[]>([]);
  filtered = signal<Lead[]>([]);
  showModal = signal(false);
  showDeleteDialog = signal(false);
  editingId = signal<string | null>(null);
  deletingLead = signal<Lead | null>(null);
  saving = signal(false);
  error = signal('');
  activeStatus = signal('All');

  readonly Target = Target;
  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;
  readonly AlertTriangle = AlertTriangle;
  readonly Zap = Zap;

  statuses = ['All', 'New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Lost', 'Converted'];

  columns: TableColumn[] = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'company', label: 'Company', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'estimatedValue', label: 'Value', type: 'currency' },
    { key: 'source', label: 'Source' },
    {
      key: 'status', label: 'Status', type: 'badge', sortable: true,
      badgeMap: { New: 'badge-blue', Contacted: 'badge-yellow', Qualified: 'badge-green', Proposal: 'badge-purple', Negotiation: 'badge-yellow', Lost: 'badge-red', Converted: 'badge-green' }
    },
    { key: 'createdAt', label: 'Created', type: 'date' },
    { key: 'actions', label: '', type: 'actions', width: '100px' }
  ];

  form: FormGroup;

  constructor(private leadService: LeadService, private fb: FormBuilder) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      firstName: [''], lastName: [''],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9+\-\s]{7,15}$/)]], 
      company: [''],
      estimatedValue: [null, [Validators.min(0)]],
      source: ['Website'], status: ['New'], description: ['']
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    return /[0-9+\-\s]/.test(event.key);
  }

  ngOnInit() { this.load(); }
  load() { this.leadService.getPaged().subscribe({ next: d => { this.leads.set(d); this.filterLeads(); } }); }

  filterLeads() {
    const s = this.activeStatus();
    this.filtered.set(s === 'All' ? this.leads() : this.leads().filter(l => l.status === s));
  }

  getCount(s: string) { return s === 'All' ? this.leads().length : this.leads().filter(l => l.status === s).length; }

  openCreateModal() { this.editingId.set(null); this.form.reset({ source: 'Website', status: 'New' }); this.error.set(''); this.showModal.set(true); }
  openEditModal(l: Lead) { this.editingId.set(l.id); this.form.patchValue(l); this.error.set(''); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true); this.error.set('');
    const dto = this.form.value as CreateLeadDto;
    const obs: any = this.editingId() ? this.leadService.update(this.editingId()!, dto) : this.leadService.create(dto);
    obs.subscribe({ next: () => { this.saving.set(false); this.closeModal(); this.load(); }, error: (e: any) => { this.saving.set(false); this.error.set(e.message); } });
  }

  convertLead() {
    if (!this.editingId()) return;
    this.leadService.convert(this.editingId()!).subscribe({ next: () => { this.closeModal(); this.load(); } });
  }

  confirmDelete(l: Lead) { this.deletingLead.set(l); this.showDeleteDialog.set(true); }
  doDelete() {
    this.leadService.delete(this.deletingLead()!.id).subscribe({ next: () => { this.showDeleteDialog.set(false); this.load(); } });
  }
}
