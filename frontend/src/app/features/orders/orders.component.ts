import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { CompanyService } from '../../core/services/company.service';
import { OrderMaster } from '../../core/models/order.model';
import { CompanyMaster } from '../../core/models/company.model';
import { InvoiceService } from '../../core/services/invoice.service';
import {
  LucideAngularModule, Search, ShoppingCart, Plus, Edit2, Trash2, X,
  Building2, Hash, Edit3, ArrowRight, Zap
} from 'lucide-angular';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, DatePipe],
  template: `
    <div class="animate-fadeIn page-container">
      <div class="glass-header">
        <div>
          <h2 class="page-title">Orders</h2>
          <p class="page-subtitle">Track and manage customer purchase orders.</p>
        </div>
        <div class="flex gap-3">
          <button class="btn btn-primary" (click)="openModal()"><lucide-icon [img]="Plus" class="btn-icon"></lucide-icon> Create Order</button>
        </div>
      </div>

      <div class="card mt-4 p-0">
        <div class="p-6 text-center" *ngIf="loading()">
            <div class="spinner"></div><p class="text-muted mt-3">Loading orders...</p>
        </div>

        <table class="data-table" *ngIf="!loading() && orders().length > 0">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Date</th>
              <th>Customer / Company</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of orders()">
              <td>
                <div class="flex items-center gap-2">
                  <div class="avatar-bg border-circle"><lucide-icon [img]="ShoppingCart" class="w-4 h-4 text-accent"></lucide-icon></div>
                  <strong class="text-primary">{{ o.orderNumber }}</strong>
                </div>
              </td>
              <td class="text-sm font-medium">{{ o.orderDate | date:'mediumDate' }}</td>
              <td>
                <div class="text-sm">{{ o.companyName || o.customerName || '—' }}</div>
              </td>
              <td class="font-bold">₹{{ o.totalAmount | number:'1.2-2' }}</td>
              <td>
                <span class="badge" 
                  [ngClass]="{
                    'bg-warning': o.status === 'Draft',
                    'bg-info': o.status === 'Confirmed',
                    'bg-accent': o.status === 'Shipped',
                    'bg-success': o.status === 'Delivered',
                    'bg-danger': o.status === 'Cancelled'
                  }">
                  {{ o.status }}
                </span>
              </td>
              <td class="text-right">
                <div class="action-buttons">
                  <button class="action-btn text-accent" (click)="generateInvoice(o.id)" title="Generate Invoice"><lucide-icon [img]="Zap" class="w-4 h-4"></lucide-icon></button>
                  <button class="action-btn text-danger" (click)="deleteOrder(o.id)" title="Delete"><lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!loading() && orders().length === 0">
          <div class="empty-icon"><lucide-icon [img]="ShoppingCart"></lucide-icon></div>
          <h3>No Orders yet</h3>
          <p class="text-muted">Create a new order to track sales revenue.</p>
          <button class="btn btn-primary mt-4" (click)="openModal()">Create Order</button>
        </div>
      </div>

      <!-- Quick Add Order Modal -->
      <div class="modal-backdrop" *ngIf="showModal()">
        <div class="modal-content animate-slideUp">
          <div class="modal-header">
            <h3>New Order Shell</h3>
            <button class="close-btn" (click)="closeModal()"><lucide-icon [img]="X" class="w-5 h-5"></lucide-icon></button>
          </div>
          <form [formGroup]="form" (ngSubmit)="saveOrder()">
            <div class="modal-body form-grid">
              
              <div class="form-group col-span-2">
                <label>Company/Customer</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Building2" class="input-icon"></lucide-icon>
                  <select formControlName="companyId" class="form-control">
                    <option value="">-- Select Company (Optional) --</option>
                    <option *ngFor="let comp of companiesList()" [value]="comp.id">{{ comp.companyName }}</option>
                  </select>
                </div>
              </div>

              <!-- Note: In a complete CRM, we would have a dynamic array of items here. For brevity, 
                   we allow entering a direct Total Amount to simulate an order creation quickly. -->
              <div class="form-group">
                <label>Manual SubTotal (₹) *</label>
                <input type="number" formControlName="subTotal" class="form-control" placeholder="0.00">
              </div>

              <div class="form-group">
                <label>Tax Amount (₹)</label>
                <input type="number" formControlName="taxAmount" class="form-control" placeholder="0.00">
              </div>

              <div class="form-group col-span-2">
                <label>Order Status</label>
                <select formControlName="status" class="form-control">
                  <option value="Draft">Draft</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                <span *ngIf="saving()" class="spinner-sm mr-2"></span>
                Save Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    
    .glass-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem;
      background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
    }
    
    .bg-warning { background: rgba(245, 158, 11, 0.1); color: #D97706; }
    .bg-info { background: rgba(59, 130, 246, 0.1); color: #2563EB; }
    .bg-accent { background: rgba(124, 58, 237, 0.1); color: var(--accent); }
    .bg-success { background: rgba(16, 185, 129, 0.1); color: #059669; }
    .bg-danger { background: rgba(239, 68, 68, 0.1); color: #DC2626; }

    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 1rem; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--border); }
    .data-table td { padding: 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .data-table tr:hover td { background: var(--bg-hover); }

    .avatar-bg { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(124, 58, 237, 0.1); }
    .action-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .action-btn { background: none; border: none; padding: 0.4rem; border-radius: 6px; cursor: pointer; color: var(--text-muted); transition: all 0.2s; }
    .action-btn:hover { background: var(--bg-secondary); color: var(--accent); }
    .action-btn.text-danger:hover { color: var(--danger); background: rgba(239,68,68,0.1); }
    .action-btn.text-accent:hover { color: var(--accent-light); }
    
    /* Modal Form Styles */
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-content { background: var(--bg-primary); width: 100%; max-width: 500px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); display: flex; flex-direction: column; max-height: 90vh; }
    .modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }
    .modal-body { padding: 1.5rem; overflow-y: auto; }
    .modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; background: var(--bg-secondary); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .col-span-2 { grid-column: span 2; }
    .form-group label { display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.4rem; }
    .form-control { width: 100%; padding: 0.65rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); outline: none; transition: 0.2s; }
    .form-control:focus { border-color: var(--accent); }
    .input-with-icon { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 0.8rem; width: 1.1rem; height: 1.1rem; color: var(--text-muted); }
    .input-with-icon .form-control { padding-left: 2.5rem; }

    .empty-state { padding: 4rem 2rem; text-align: center; }
    .empty-icon { width: 64px; height: 64px; background: rgba(124,58,237,0.1); color: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }
    .spinner-sm { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slideUp { animation: slideUp 0.3s cubic forwards; }
  `]
})
export class OrdersComponent implements OnInit {
  orders = signal<OrderMaster[]>([]);
  companiesList = signal<CompanyMaster[]>([]);
  loading = signal(false);

  // Modal State
  showModal = signal(false);
  saving = signal(false);
  form: FormGroup;

  readonly Search = Search;
  readonly ShoppingCart = ShoppingCart;
  readonly Plus = Plus;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly Building2 = Building2;
  readonly Zap = Zap;

  constructor(
    private orderService: OrderService,
    private companyService: CompanyService,
    private invoiceService: InvoiceService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      companyId: [''],
      subTotal: [0, [Validators.required, Validators.min(0)]],
      taxAmount: [0, [Validators.min(0)]],
      status: ['Draft']
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.companyService.getCompanies(1, 1000).subscribe(res => {
      this.companiesList.set(res.items || []);
    });
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.orderService.getOrders(1, 100).subscribe({
      next: (res: any) => {
        this.orders.set(res.items || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openModal() {
    this.form.reset({ status: 'Draft', subTotal: 0, taxAmount: 0, companyId: '' });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveOrder() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const payload = { ...this.form.value };
    if (!payload.companyId) payload.companyId = null;

    this.orderService.createOrder(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadOrders();
      },
      error: () => {
        this.saving.set(false);
        alert('Failed to save order.');
      }
    });
  }

  generateInvoice(orderId: string) {
    if (confirm('Generate an Invoice for this Order?')) {
      this.invoiceService.generateFromOrder(orderId).subscribe({
        next: () => {
          alert('Invoice generated successfully! You can view it in the Invoices tab.');
        },
        error: () => {
          alert('Failed to generate Invoice. Maybe it already exists.');
        }
      });
    }
  }

  deleteOrder(id: string) {
    if (confirm('Are you sure you want to delete this order?')) {
      this.orderService.deleteOrder(id).subscribe({
        next: () => {
          this.loadOrders();
        },
        error: () => alert('Failed to delete order.')
      });
    }
  }
}
