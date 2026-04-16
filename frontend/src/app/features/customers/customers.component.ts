import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { CompanyService } from '../../core/services/company.service';
import { CustomerMaster } from '../../core/models/customer.model';
import { CompanyMaster } from '../../core/models/company.model';
import { AuthService } from '../../core/services/auth.service';
import {
  LucideAngularModule, Search, Plus, UserCheck, Edit2, Trash2, X,
  Building2, Phone, Mail, Briefcase, Video, PhoneCall, CalendarPlus
} from 'lucide-angular';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, DatePipe, RouterModule],
  template: `
    <div class="animate-fadeIn page-container">
      <!-- Header -->
      <div class="glass-header">
        <div>
          <h2 class="page-title">Customers</h2>
          <p class="page-subtitle">Manage business contacts and their professional details.</p>
        </div>
        <div class="flex gap-3">
          <div class="search-box">
            <lucide-icon [img]="Search" class="search-icon"></lucide-icon>
            <input type="text" placeholder="Search customers..." [value]="searchQuery()" (input)="onSearch($event)">
          </div>
          <button *ngIf="canCreate" class="btn btn-primary" (click)="openModal()">
            <lucide-icon [img]="Plus" class="btn-icon-sm"></lucide-icon> Add Customer
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="card mt-4 p-0">
        <div class="p-6 text-center" *ngIf="loading()">
            <div class="spinner"></div>
            <p class="text-muted mt-3">Loading customers...</p>
        </div>

        <table class="data-table" *ngIf="!loading() && customers().length > 0">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Company</th>
              <th>Contact</th>
              <th>Created By</th>
              <th>Assigned To</th>
              <th>Created On</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of customers()" class="cursor-pointer" (click)="openModal(c)">
              <td>
                <div class="flex items-center gap-3">
                  <div class="avatar-bg text-accent font-bold">{{ c.firstName[0] }}{{ c.lastName[0] }}</div>
                  <div>
                    <div class="font-bold text-primary">{{ c.firstName }} {{ c.lastName }}</div>
                    <div class="text-xs text-muted">{{ c.designation || 'No Designation' }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <lucide-icon [img]="Building2" class="w-4 h-4 text-muted"></lucide-icon>
                  <span class="font-medium">{{ c.companyName || 'Independent' }}</span>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-3">
                  <a *ngIf="c.phoneNo" [href]="'tel:' + c.phoneNo" (click)="$event.stopPropagation()" class="text-secondary hover:text-primary transition" title="Call {{c.phoneNo}}">
                    <lucide-icon [img]="PhoneCall" class="w-4 h-4"></lucide-icon>
                  </a>
                  <a *ngIf="c.email" routerLink="/emails" [queryParams]="{composeTo: c.email}" (click)="$event.stopPropagation()" class="text-secondary hover:text-primary transition" title="Email {{c.email}}">
                    <lucide-icon [img]="Mail" class="w-4 h-4"></lucide-icon>
                  </a>
                  <span *ngIf="!c.phoneNo && !c.email" class="text-xs text-muted">—</span>
                </div>
              </td>
              <td>
                <div class="text-sm font-medium">{{ c.createdByUserName || 'System' }}</div>
              </td>
              <td>
                <div class="text-sm font-medium">{{ c.assignedToUserName || 'Unassigned' }}</div>
              </td>
              <td>
                <div class="text-sm">{{ c.createdDate | date:'mediumDate' }}</div>
              </td>
              <td class="text-right">
                <div class="action-buttons">
                  <a *ngIf="c.phoneNo" [href]="'tel:' + c.phoneNo" (click)="$event.stopPropagation()" class="action-btn text-success" title="Call">
                    <lucide-icon [img]="PhoneCall" class="w-4 h-4"></lucide-icon>
                  </a>
                  <a *ngIf="c.email" routerLink="/emails" [queryParams]="{composeTo: c.email}" (click)="$event.stopPropagation()" class="action-btn text-accent" title="Send Email">
                    <lucide-icon [img]="Mail" class="w-4 h-4"></lucide-icon>
                  </a>
                  <button class="action-btn text-info" (click)="scheduleMeeting(c); $event.stopPropagation()" title="Schedule Meeting">
                    <lucide-icon [img]="CalendarPlus" class="w-4 h-4"></lucide-icon>
                  </button>
                  <button *ngIf="canEdit" class="action-btn" (click)="openModal(c); $event.stopPropagation()" title="Edit">
                    <lucide-icon [img]="Edit2" class="w-4 h-4"></lucide-icon>
                  </button>
                  <button *ngIf="canDelete" class="action-btn text-danger" (click)="deleteCustomer(c.id); $event.stopPropagation()" title="Delete">
                    <lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!loading() && customers().length === 0">
          <div class="empty-icon"><lucide-icon [img]="UserCheck"></lucide-icon></div>
          <h3>No customers found</h3>
          <p class="text-muted">You haven't added any customers yet or no results match your search.</p>
          <button *ngIf="canCreate" class="btn btn-primary mt-4" (click)="openModal()">Add Customer</button>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div class="modal-backdrop" *ngIf="showModal()">
        <div class="modal-content animate-slideUp">
          <div class="modal-header">
            <h3>{{ editingId() ? 'Edit Customer' : 'New Customer' }}</h3>
            <button class="close-btn" (click)="closeModal()"><lucide-icon [img]="X" class="w-5 h-5"></lucide-icon></button>
          </div>
          <form [formGroup]="form" (ngSubmit)="saveCustomer()">
            <div class="modal-body form-grid">
              
              <div class="form-group col-span-2">
                <label>Linked Company</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Building2" class="input-icon"></lucide-icon>
                  <select formControlName="companyId" class="form-control">
                    <option value="">-- Independent Customer (No Company) --</option>
                    <option *ngFor="let comp of companiesList()" [value]="comp.id">{{ comp.companyName }}</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>First Name <span class="required">*</span></label>
                <input type="text" formControlName="firstName" class="form-control"
                  [class.is-invalid]="isInvalid('firstName')"
                  placeholder="John">
                <div class="error-msg" *ngIf="isInvalid('firstName')">First name is required.</div>
              </div>

              <div class="form-group">
                <label>Last Name <span class="required">*</span></label>
                <input type="text" formControlName="lastName" class="form-control"
                  [class.is-invalid]="isInvalid('lastName')"
                  placeholder="Doe">
                <div class="error-msg" *ngIf="isInvalid('lastName')">Last name is required.</div>
              </div>

              <div class="form-group">
                <label>Email Address</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Mail" class="input-icon"></lucide-icon>
                  <input type="email" formControlName="email" class="form-control"
                    [class.is-invalid]="isInvalid('email')"
                    placeholder="john@acme.com">
                </div>
                <div class="error-msg" *ngIf="isInvalid('email')">Please enter a valid email address.</div>
              </div>

              <div class="form-group">
                <label>Phone Number</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Phone" class="input-icon"></lucide-icon>
                  <input type="tel" formControlName="phoneNo" class="form-control"
                    [class.is-invalid]="isInvalid('phoneNo')"
                    placeholder="9876543210" maxlength="15"
                    (keypress)="onlyNumbers($event)">
                </div>
                <div class="error-msg" *ngIf="isInvalid('phoneNo')">Please enter a valid phone number (digits only).</div>
              </div>

              <div class="form-group">
                <label>Designation</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Briefcase" class="input-icon"></lucide-icon>
                  <input type="text" formControlName="designation" class="form-control" placeholder="CTO">
                </div>
              </div>

              <div class="form-group">
                <label>Department</label>
                <input type="text" formControlName="department" class="form-control" placeholder="Engineering">
              </div>

            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                <span *ngIf="saving()" class="spinner-sm mr-2"></span>
                {{ editingId() ? 'Update' : 'Save' }} Customer
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Meeting Modal -->
      <div class="modal-backdrop" *ngIf="showMeetingModal()">
        <div class="modal-content animate-slideUp" style="max-width: 480px;">
          <div class="modal-header">
            <h3>Schedule Meeting with {{meetingCustomer()?.firstName}}</h3>
            <button class="close-btn" (click)="showMeetingModal.set(false)"><lucide-icon [img]="X" class="w-5 h-5"></lucide-icon></button>
          </div>
          <div class="modal-body">
            <div class="meeting-options">
              <a *ngIf="meetingCustomer()?.email"
                [href]="'https://meet.google.com/new'"
                target="_blank" class="meeting-opt">
                <div class="meeting-ico" style="background: rgba(66,133,244,0.1); color:#4285F4">
                  <lucide-icon [img]="Video" class="w-5 h-5"></lucide-icon>
                </div>
                <div>
                  <div class="font-bold">Google Meet</div>
                  <div class="text-sm text-muted">Start instant Google Meet call</div>
                </div>
              </a>
              <a [href]="'https://zoom.us/start/videomeeting'"
                target="_blank" class="meeting-opt">
                <div class="meeting-ico" style="background: rgba(45,140,255,0.1); color:#2D8CFF">
                  <lucide-icon [img]="Video" class="w-5 h-5"></lucide-icon>
                </div>
                <div>
                  <div class="font-bold">Zoom Meeting</div>
                  <div class="text-sm text-muted">Open Zoom and start a meeting</div>
                </div>
              </a>
              <a *ngIf="meetingCustomer()?.phoneNo"
                [href]="'tel:' + meetingCustomer()?.phoneNo" class="meeting-opt">
                <div class="meeting-ico" style="background: rgba(16,185,129,0.1); color:#10b981">
                  <lucide-icon [img]="PhoneCall" class="w-5 h-5"></lucide-icon>
                </div>
                <div>
                  <div class="font-bold">Phone Call</div>
                  <div class="text-sm text-muted">Call {{meetingCustomer()?.phoneNo}}</div>
                </div>
              </a>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showMeetingModal.set(false)">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    
    .glass-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.25rem 1.5rem; border-radius: 16px; margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.4);
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
    }

    .search-box {
      position: relative; display: flex; align-items: center;
      input {
        padding: 0.55rem 1rem 0.55rem 2.5rem; border-radius: 8px;
        border: 1px solid var(--border); background: var(--bg-primary);
        color: var(--text-primary); outline: none; transition: var(--transition);
        min-width: 240px; font-size: 0.875rem;
      }
      input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
      .search-icon { position: absolute; left: 0.8rem; width: 1.1rem; height: 1.1rem; color: var(--text-muted); }
    }

    .btn-md { padding: 0.55rem 1.1rem; font-size: 0.875rem; }

    .data-table {
      width: 100%; border-collapse: separate; border-spacing: 0;
      th { text-align: left; padding: 0.875rem 1rem; color: var(--text-muted); font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border); }
      td { padding: 0.875rem 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: var(--bg-hover); }
    }

    .avatar-bg {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: rgba(124, 58, 237, 0.1); flex-shrink: 0;
      font-size: 0.8rem;
    }
    .text-primary { color: var(--text-primary); }
    .text-accent { color: var(--accent); }
    .text-success { color: #10b981; }
    .text-info { color: var(--info); }
    
    /* Contact action buttons inline */
    .contact-actions { display: flex; flex-direction: column; gap: 0.3rem; }
    .contact-btn { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 6px; text-decoration: none; transition: 0.15s; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .phone-btn { color: #10b981; background: rgba(16,185,129,0.08); &:hover { background: rgba(16,185,129,0.15); } }
    .email-btn { color: var(--accent); background: rgba(124,58,237,0.08); &:hover { background: rgba(124,58,237,0.15); } }

    .action-buttons { display: flex; gap: 0.35rem; justify-content: flex-end; }
    .action-btn { background: none; border: none; padding: 0.4rem; border-radius: 6px; color: var(--text-muted); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; text-decoration: none; }
    .action-btn:hover { background: var(--bg-secondary); }
    .action-btn.text-danger:hover { color: var(--danger); background: rgba(239,68,68,0.1); }
    .action-btn.text-success:hover { color: #059669; background: rgba(16,185,129,0.1); }
    .action-btn.text-accent:hover { color: var(--accent);  background: rgba(124,58,237,0.1); }
    .action-btn.text-info:hover { color: var(--info); background: rgba(59,130,246,0.1); }

    /* Modal Styles */
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-content { background: var(--bg-primary); width: 100%; max-width: 600px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; display: flex; flex-direction: column; max-height: 90vh; }
    .modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }
    .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; border-radius: 4px; transition: 0.2s; }
    .close-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
    .modal-body { padding: 1.5rem; overflow-y: auto; }
    .modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; background: var(--bg-secondary); }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .col-span-2 { grid-column: span 2; }
    
    .form-group label { display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.4rem; }
    .form-control { width: 100%; padding: 0.65rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); transition: all 0.2s; font-size: 0.9rem; }
    .form-control:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); outline: none; }
    select.form-control { cursor: pointer; appearance: auto; }
    
    .input-with-icon { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 0.8rem; width: 1.1rem; height: 1.1rem; color: var(--text-muted); }
    .input-with-icon .form-control { padding-left: 2.5rem; }

    .empty-state { padding: 4rem 2rem; text-align: center; }
    .empty-icon { width: 64px; height: 64px; background: rgba(124,58,237,0.1); color: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; svg { width: 32px; height: 32px; } }
    
    .spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }
    .spinner-sm { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: middle; }
    .form-control.is-invalid { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
    .error-msg { color: #ef4444; font-size: 0.75rem; margin-top: 4px; margin-left: 4px; }
    .required { color: #ef4444; }
    .mt-4 { margin-top: 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

    /* Meeting modal */
    .meeting-options { display: flex; flex-direction: column; gap: 0.75rem; }
    .meeting-opt { display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 12px; cursor: pointer; text-decoration: none; color: var(--text-primary); transition: 0.2s; &:hover { border-color: var(--accent); background: var(--bg-hover); } }
    .meeting-ico { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  `]
})
export class CustomersComponent implements OnInit {
  customers = signal<CustomerMaster[]>([]);
  companiesList = signal<CompanyMaster[]>([]);
  loading = signal(false);
  searchQuery = signal('');
  searchTimeout: any;
  showModal = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  showMeetingModal = signal(false);
  meetingCustomer = signal<CustomerMaster | null>(null);
  form: FormGroup;

  readonly Search = Search;
  readonly Plus = Plus;
  readonly UserCheck = UserCheck;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly Building2 = Building2;
  readonly Phone = Phone;
  readonly Mail = Mail;
  readonly Briefcase = Briefcase;
  readonly Video = Video;
  readonly PhoneCall = PhoneCall;
  readonly CalendarPlus = CalendarPlus;

  canCreate = false;
  canEdit = false;
  canDelete = false;

  constructor(
    private customerService: CustomerService,
    private companyService: CompanyService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.canCreate = this.authService.hasPermission('Customers', 'Create');
    this.canEdit = this.authService.hasPermission('Customers', 'Update');
    this.canDelete = this.authService.hasPermission('Customers', 'Delete');

    this.form = this.fb.group({
      companyId: [''],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      phoneNo: ['', [Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
      designation: [''],
      department: ['']
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    return /[0-9+\-\s]/.test(event.key);
  }

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading.set(true);
    this.companyService.getCompanies(1, 1000).subscribe(res => {
      this.companiesList.set(res.items || []);
    });
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading.set(true);
    this.customerService.getCustomers(1, 100, this.searchQuery()).subscribe({
      next: (res: any) => {
        this.customers.set(res.items || []);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  onSearch(event: any) {
    this.searchQuery.set(event.target.value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadCustomers(), 400);
  }

  openModal(customer?: CustomerMaster) {
    if (customer) {
      this.editingId.set(customer.id);
      this.form.patchValue({ ...customer, companyId: customer.companyId ? customer.companyId : '' });
    } else {
      this.editingId.set(null);
      this.form.reset({ companyId: '' });
    }
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  scheduleMeeting(customer: CustomerMaster) {
    this.meetingCustomer.set(customer);
    this.showMeetingModal.set(true);
  }

  saveCustomer() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const payload = { ...this.form.value };
    if (!payload.companyId) payload.companyId = null;

    const req = this.editingId()
      ? this.customerService.updateCustomer(this.editingId()!, payload)
      : this.customerService.createCustomer(payload);

    (req as import('rxjs').Observable<any>).subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.loadCustomers(); },
      error: () => { this.saving.set(false); alert('Failed to save customer.'); }
    });
  }

  deleteCustomer(id: string) {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.deleteCustomer(id).subscribe({
        next: () => this.loadCustomers(),
        error: () => alert('Failed to delete. It might be linked to active transactions.')
      });
    }
  }
}
