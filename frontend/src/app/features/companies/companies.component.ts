import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyService } from '../../core/services/company.service';
import { CompanyMaster } from '../../core/models/company.model';
import {
  LucideAngularModule, Search, Plus, Filter, MoreVertical, Building2,
  Edit2, Trash2, X, MapPin, Phone, Mail, FileText
} from 'lucide-angular';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, DatePipe, RouterModule],
  template: `
    <div class="animate-fadeIn page-container">
      <!-- Header -->
      <div class="glass-header">
        <div>
          <h2 class="page-title">Companies</h2>
          <p class="page-subtitle">Manage your B2B clients and their details.</p>
        </div>
        <div class="flex gap-3">
          <div class="search-box">
            <lucide-icon [img]="Search" class="search-icon"></lucide-icon>
            <input type="text" placeholder="Search companies..." [value]="searchQuery()" (input)="onSearch($event)">
          </div>
          <button *ngIf="canCreate" class="btn btn-primary btn-md" (click)="openModal()"><lucide-icon [img]="Plus" class="btn-icon-sm"></lucide-icon> New Company</button>
        </div>
      </div>

      <!-- Content -->
      <div class="card mt-4 p-0">
        <div class="p-6 text-center" *ngIf="loading()">
            <div class="spinner"></div>
            <p class="text-muted mt-3">Loading companies...</p>
        </div>

        <table class="data-table" *ngIf="!loading() && companies().length > 0">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact Info</th>
              <th>Owner</th>
              <th>Created</th>
              <th class="text-right" *ngIf="canEdit || canDelete">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of companies()" [class.cursor-pointer]="canEdit" (click)="canEdit ? openModal(c) : null">
              <td>
                <div class="flex items-center gap-3">
                  <div class="avatar-bg"><lucide-icon [img]="Building2" class="w-5 h-5 text-accent"></lucide-icon></div>
                  <div>
                    <div class="font-bold text-primary">{{ c.companyName }}</div>
                    <div class="text-xs text-muted">{{ c.gstNo || c.panNumber || 'No Tax ID' }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-3">
                  <a *ngIf="c.phoneNo" [href]="'tel:' + c.phoneNo" (click)="$event.stopPropagation()" class="text-secondary hover:text-primary transition" title="Call {{c.phoneNo}}">
                    <lucide-icon [img]="Phone" class="w-4 h-4"></lucide-icon>
                  </a>
                  <a *ngIf="c.email" routerLink="/emails" [queryParams]="{composeTo: c.email}" (click)="$event.stopPropagation()" class="text-secondary hover:text-primary transition" title="Email {{c.email}}">
                    <lucide-icon [img]="Mail" class="w-4 h-4"></lucide-icon>
                  </a>
                  <span *ngIf="!c.phoneNo && !c.email" class="text-xs text-muted">—</span>
                </div>
              </td>
              <td>
                <div class="text-sm" *ngIf="c.ownerFirstName">{{ c.ownerFirstName }} {{ c.ownerLastName }}</div>
                <div class="text-xs text-muted" *ngIf="!c.ownerFirstName">—</div>
              </td>
              <td>
                <div class="text-sm">{{ c.createdDate | date:'mediumDate' }}</div>
              </td>
              <td class="text-right" *ngIf="canEdit || canDelete">
                <div class="action-buttons">
                  <button *ngIf="canEdit" class="action-btn" (click)="openModal(c); $event.stopPropagation()" title="Edit"><lucide-icon [img]="Edit2" class="w-4 h-4"></lucide-icon></button>
                  <button *ngIf="canDelete" class="action-btn text-danger" (click)="deleteCompany(c.id); $event.stopPropagation()" title="Delete"><lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!loading() && companies().length === 0">
          <div class="empty-icon"><lucide-icon [img]="Building2"></lucide-icon></div>
          <h3>No companies found</h3>
          <p class="text-muted">You haven't added any company yet or no results match your search.</p>
          <button *ngIf="canCreate" class="btn btn-primary mt-4" (click)="openModal()">Add Company</button>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div class="modal-backdrop" *ngIf="showModal()">
        <div class="modal-content animate-slideUp">
          <div class="modal-header">
            <h3>{{ editingId() ? 'Edit Company' : 'New Company' }}</h3>
            <button class="close-btn" (click)="closeModal()"><lucide-icon [img]="X" class="w-5 h-5"></lucide-icon></button>
          </div>
          <form [formGroup]="form" (ngSubmit)="saveCompany()">
            <div class="modal-body form-grid">
              
              <div class="form-group col-span-2">
                <label>Company Name <span class="required">*</span></label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Building2" class="input-icon"></lucide-icon>
                  <input type="text" formControlName="companyName" class="form-control"
                    [class.is-invalid]="isInvalid('companyName')"
                    placeholder="e.g. Acme Corp">
                </div>
                <div class="error-msg" *ngIf="isInvalid('companyName')">Company name is required.</div>
              </div>

              <div class="form-group">
                <label>Email Address</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Mail" class="input-icon"></lucide-icon>
                  <input type="email" formControlName="email" class="form-control"
                    [class.is-invalid]="isInvalid('email')"
                    placeholder="contact@acme.com">
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
                <label>Owner First Name</label>
                <input type="text" formControlName="ownerFirstName" class="form-control" placeholder="John">
              </div>

              <div class="form-group">
                <label>Owner Last Name</label>
                <input type="text" formControlName="ownerLastName" class="form-control" placeholder="Doe">
              </div>

              <div class="form-group">
                <label>GST Number</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="FileText" class="input-icon"></lucide-icon>
                  <input type="text" formControlName="gstNo" class="form-control"
                    [class.is-invalid]="isInvalid('gstNo')"
                    placeholder="22AAAAA0000A1Z5" maxlength="15"
                    style="text-transform:uppercase">
                </div>
                <div class="error-msg" *ngIf="isInvalid('gstNo')">GST must be 15 characters (e.g. 22AAAAA0000A1Z5).</div>
              </div>

              <div class="form-group">
                <label>PAN Number</label>
                <input type="text" formControlName="panNumber" class="form-control"
                  [class.is-invalid]="isInvalid('panNumber')"
                  placeholder="AAAAA0000A" maxlength="10"
                  style="text-transform:uppercase">
                <div class="error-msg" *ngIf="isInvalid('panNumber')">PAN must be 10 characters (e.g. ABCDE1234F).</div>
              </div>

              <div class="form-group col-span-2">
                <label>Company Address</label>
                <div class="input-with-icon align-top">
                  <lucide-icon [img]="MapPin" class="input-icon mt-2"></lucide-icon>
                  <textarea formControlName="companyAddress" class="form-control" rows="3" placeholder="Full address string"></textarea>
                </div>
              </div>

            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                <span *ngIf="saving()" class="spinner-sm mr-2"></span>
                {{ editingId() ? 'Update' : 'Save' }} Company
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    
    .glass-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.4);
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
    }

    .search-box {
      position: relative; display: flex; align-items: center;
      input {
        padding: 0.65rem 1rem 0.65rem 2.5rem; border-radius: 8px;
        border: 1px solid var(--border); background: var(--bg-primary);
        color: var(--text-primary); outline: none; transition: var(--transition);
        min-width: 260px;
        &:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
      }
      .search-icon { position: absolute; left: 0.8rem; width: 1.2rem; height: 1.2rem; color: var(--text-muted); }
    }

    .data-table {
      width: 100%; border-collapse: separate; border-spacing: 0;
      th { text-align: left; padding: 1rem; color: var(--text-muted); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border); }
      td { padding: 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: var(--bg-hover); }
    }

    .avatar-bg {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(124, 58, 237, 0.1); flex-shrink: 0;
    }
    .text-primary { color: var(--text-primary); }
    .text-accent { color: var(--accent); }
    
    .action-buttons { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .action-btn { background: none; border: none; padding: 0.4rem; border-radius: 6px; color: var(--text-muted); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; text-decoration: none; }
    .action-btn:hover { background: var(--bg-secondary); color: var(--accent); }
    .action-btn.text-danger:hover { color: var(--danger); background: rgba(239,68,68,0.1); }
    .btn-md { padding: 0.55rem 1.1rem; font-size: 0.875rem; }
    .co-link { display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; padding: 0.2rem 0; text-decoration: none; transition: 0.15s; }
    .email-lnk { color: var(--accent); &:hover { text-decoration: underline; } }
    .phone-lnk { color: #10b981; &:hover { text-decoration: underline; } }
    .mb-1 { margin-bottom: 0.3rem; }
    .block { display: flex; }

    /* Modal Form Styles */
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
    
    .input-with-icon { position: relative; display: flex; align-items: center; }
    .input-with-icon.align-top { align-items: flex-start; }
    .input-icon { position: absolute; left: 0.8rem; width: 1.1rem; height: 1.1rem; color: var(--text-muted); }
    .input-with-icon .form-control { padding-left: 2.5rem; }

    .empty-state { padding: 4rem 2rem; text-align: center; }
    .empty-icon { width: 64px; height: 64px; background: rgba(124,58,237,0.1); color: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; svg { width: 32px; height: 32px; } }
    
    .spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }
    .spinner-sm { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: middle; }
    .form-control.is-invalid { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
    .error-msg { color: #ef4444; font-size: 0.75rem; margin-top: 4px; margin-left: 4px; }
    .required { color: #ef4444; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class CompaniesComponent implements OnInit {
  companies = signal<CompanyMaster[]>([]);
  loading = signal(false);

  searchQuery = signal('');
  searchTimeout: any;

  // Modal State
  showModal = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);

  form: FormGroup;
  canCreate = false;
  canEdit = false;
  canDelete = false;

  readonly Search = Search;
  readonly Plus = Plus;
  readonly Filter = Filter;
  readonly MoreVertical = MoreVertical;
  readonly Building2 = Building2;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly MapPin = MapPin;
  readonly Phone = Phone;
  readonly Mail = Mail;
  readonly FileText = FileText;

  constructor(
    private companyService: CompanyService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.canCreate = this.authService.hasPermission('Companies', 'Create');
    this.canEdit = this.authService.hasPermission('Companies', 'Update');
    this.canDelete = this.authService.hasPermission('Companies', 'Delete');

    this.form = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      phoneNo: ['', [Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
      ownerFirstName: [''],
      ownerLastName: [''],
      gstNo: ['', [Validators.pattern(/^[A-Z0-9]{15}$/)]],
      panNumber: ['', [Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      companyAddress: ['']
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const char = event.key;
    return /[0-9+\-\s]/.test(char);
  }

  ngOnInit() {
    this.loadCompanies();
  }

  loadCompanies() {
    this.loading.set(true);
    this.companyService.getCompanies(1, 100, this.searchQuery()).subscribe({
      next: (res: any) => {
        // Backend returns paginated response, handle array mapped in items
        this.companies.set(res.items || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        alert('Failed to load companies.');
      }
    });
  }

  onSearch(event: any) {
    this.searchQuery.set(event.target.value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadCompanies(), 400);
  }

  openModal(company?: CompanyMaster) {
    if (company) {
      this.editingId.set(company.id);
      this.form.patchValue(company);
    } else {
      this.editingId.set(null);
      this.form.reset();
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveCompany() {
    if (this.form.invalid) return;
    this.saving.set(true);

    const req = this.editingId()
      ? this.companyService.updateCompany(this.editingId()!, this.form.value)
      : this.companyService.createCompany(this.form.value);

    (req as import('rxjs').Observable<any>).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadCompanies();
      },
      error: () => {
        this.saving.set(false);
        alert('Failed to save company.');
      }
    });
  }

  deleteCompany(id: string) {
    if (confirm('Are you sure you want to delete this company? Customers linked to it might be affected.')) {
      this.companyService.deleteCompany(id).subscribe({
        next: () => {
          this.loadCompanies();
        },
        error: () => {
          alert('Failed to delete. It might be linked to active deals or customers.');
        }
      });
    }
  }
}
