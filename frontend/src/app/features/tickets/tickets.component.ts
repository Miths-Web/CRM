import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TicketService, Ticket, CreateTicketDto, UpdateTicketDto } from './services/ticket.service';
import { CompanyService } from '../../core/services/company.service';
import { CustomerService } from '../../core/services/customer.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LucideAngularModule, Ticket as TicketIcon, Plus, Trash2, Edit2, Info } from 'lucide-angular';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ConfirmDialogComponent, LucideAngularModule],
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h2 class="page-title">Support Tickets</h2>
          <p class="page-subtitle">Manage customer support tickets</p>
        </div>
        <div>
          <button class="btn btn-primary" (click)="openCreateModal()"><lucide-icon [img]="Plus" class="btn-icon-sm"></lucide-icon> New Ticket</button>
        </div>
      </div>

      <div class="flex-center" style="padding:2rem" *ngIf="loading()"><div class="spinner"></div></div>

      <div class="card" style="padding:0; overflow:hidden" *ngIf="!loading()">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket #</th><th>Title</th><th>Customer</th><th>Status</th>
              <th>Priority</th><th>Date</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of tickets()" (click)="openEditModal(t)" style="cursor:pointer">
              <td><strong>{{t.ticketNumber}}</strong></td>
              <td>{{t.title}}</td>
              <td>{{t.customerName || 'None'}}</td>
              <td>
                <span class="badge" [ngClass]="{'badge-green':t.status==='Closed','badge-yellow':t.status==='In Progress','badge-blue':t.status==='Open'}">
                  {{t.status}}
                </span>
              </td>
              <td>{{t.priority}}</td>
              <td>{{t.createdAt | date:'shortDate'}}</td>
              <td (click)="$event.stopPropagation()">
                <button class="btn-icon flex-center" (click)="confirmDelete(t)"><lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon></button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" *ngIf="tickets().length === 0">
          <div class="empty-icon text-muted"><lucide-icon [img]="TicketIcon"></lucide-icon></div>
          <div class="empty-title">No tickets yet</div>
          <p class="empty-text">Create a ticket to start tracking support issues.</p>
        </div>
      </div>

      <!-- Modal -->
      <app-modal [isOpen]="showModal()" [title]="editingId() ? 'Edit Ticket' : 'New Ticket'" [maxWidth]="'640px'" (close)="closeModal()">
        <form [formGroup]="form">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input formControlName="title" class="form-control" placeholder="Issue title" />
            <div class="text-xs text-danger mt-1" *ngIf="form.get('title')?.touched && form.get('title')?.invalid">Title is required</div>
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select formControlName="priority" class="form-control">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div class="form-group" *ngIf="editingId()">
              <label class="form-label">Status</label>
              <select formControlName="status" class="form-control">
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Customer Contact</label>
            <select formControlName="customerId" class="form-control">
              <option value="">No Customer</option>
              <option *ngFor="let c of customers()" [value]="c.id">{{c.firstName}} {{c.lastName}}</option>
            </select>
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Description</label>
            <textarea formControlName="description" class="form-control" rows="4"></textarea>
          </div>
        </form>
        <div modal-footer>
          <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving() || form.invalid">
            {{saving() ? 'Saving...' : (editingId() ? 'Update' : 'Create')}}
          </button>
        </div>
      </app-modal>

      <app-confirm-dialog [isOpen]="showDeleteDialog()" title="Delete Ticket?"
        [message]="'Delete ticket ' + (deletingItem()?.ticketNumber ?? '') + '?'"
        (confirm)="doDelete()" (cancel)="showDeleteDialog.set(false)">
      </app-confirm-dialog>
    </div>
  `
})
export class TicketsComponent implements OnInit {
  tickets = signal<Ticket[]>([]);
  customers = signal<any[]>([]);
  showModal = signal(false);
  showDeleteDialog = signal(false);
  editingId = signal<string | null>(null);
  deletingItem = signal<Ticket | null>(null);
  saving = signal(false);
  loading = signal(true);

  readonly TicketIcon = TicketIcon;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;

  form: FormGroup;

  constructor(
    private ticketService: TicketService,
    private customerService: CustomerService,
    private fb: FormBuilder,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['Open'],
      priority: ['Medium'],
      customerId: [''],
    });
  }

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.customerService.getCustomers(1, 100).subscribe({ next: (res: any) => this.customers.set(res.items || res) });
    this.ticketService.getAll().subscribe({ 
      next: data => { this.tickets.set(data); this.loading.set(false); }, 
      error: () => this.loading.set(false) 
    });
  }

  openCreateModal() { this.editingId.set(null); this.form.reset({ status: 'Open', priority: 'Medium' }); this.showModal.set(true); }
  openEditModal(t: Ticket) { this.editingId.set(t.id); this.form.patchValue(t); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const dto = this.form.value;
    const obs: any = this.editingId() ? this.ticketService.update(this.editingId()!, dto) : this.ticketService.create(dto);
    
    obs.subscribe({ 
      next: () => { 
        this.saving.set(false); 
        this.closeModal(); 
        this.loadAll(); 
        this.toast.success('Success', this.editingId() ? 'Ticket updated' : 'Ticket created');
      }, 
      error: () => { this.saving.set(false); } 
    });
  }

  confirmDelete(t: Ticket) { this.deletingItem.set(t); this.showDeleteDialog.set(true); }
  doDelete() { 
    this.ticketService.delete(this.deletingItem()!.id).subscribe({ 
      next: () => { 
        this.showDeleteDialog.set(false); 
        this.loadAll(); 
        this.toast.success('Deleted', 'Ticket deleted');
      } 
    }); 
  }
}
