import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InvoiceService } from '../../core/services/invoice.service';
import { Invoice } from '../../core/models/invoice.model';
import { Payment } from '../../core/models/payment.model';
import {
  LucideAngularModule, Search, Receipt, CreditCard, ExternalLink, X, DollarSign, Text
} from 'lucide-angular';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, DatePipe],
  template: `
    <div class="animate-fadeIn page-container">
      <div class="glass-header">
        <div>
          <h2 class="page-title"><lucide-icon [img]="Receipt" class="inline-icon"></lucide-icon> Invoices</h2>
          <p class="page-subtitle">Manage billing, collect payments, and track receivables.</p>
        </div>
        <div class="flex gap-3">
          <div class="search-box">
            <lucide-icon [img]="Search" class="search-icon"></lucide-icon>
            <input type="text" placeholder="Search invoices..." [value]="searchQuery()" (input)="onSearch($event)">
          </div>
        </div>
      </div>

      <div class="card mt-4 p-0">
        <div class="p-6 text-center" *ngIf="loading()">
            <div class="spinner"></div><p class="text-muted mt-3">Loading invoices...</p>
        </div>

        <table class="data-table" *ngIf="!loading() && invoices().length > 0">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer / Company</th>
              <th>Amount Details</th>
              <th>Status</th>
              <th class="text-right">Payment</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let i of invoices()">
              <td>
                <div class="font-bold text-accent mb-1">{{ i.invoiceNumber }}</div>
                <div class="text-xs text-muted">Due: {{ i.dueDate | date:'mediumDate' }}</div>
              </td>
              <td>
                <div class="font-medium">{{ i.companyName || i.customerName || '—' }}</div>
                <div class="text-xs text-muted mt-1">Order #{{ i.orderNumber || 'N/A' }}</div>
              </td>
              <td>
                <div class="font-bold">Total: ₹{{ i.totalAmount | number:'1.2-2' }}</div>
                <div class="text-sm font-medium" [ngClass]="{'text-success': i.paidAmount >= i.totalAmount, 'text-warning': i.paidAmount > 0 && i.paidAmount < i.totalAmount}">
                  Paid: ₹{{ i.paidAmount | number:'1.2-2' }}
                </div>
              </td>
              <td>
                <span class="badge" 
                  [ngClass]="{
                    'badge-danger': i.status === 'Unpaid' || i.status === 'Overdue',
                    'badge-warning': i.status === 'Partially Paid',
                    'badge-success': i.status === 'Paid',
                    'badge-neutral': i.status === 'Draft'
                  }">
                  {{ i.status }}
                </span>
                <div class="text-xs text-danger font-medium mt-1" *ngIf="i.dueAmount > 0">Due: ₹{{ i.dueAmount | number:'1.2-2' }}</div>
              </td>
              <td class="text-right">
                <button class="btn btn-primary btn-sm" *ngIf="i.dueAmount > 0" (click)="openPaymentModal(i)">
                  <lucide-icon [img]="CreditCard" class="btn-icon-sm"></lucide-icon> Collect Payment
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty-state" *ngIf="!loading() && invoices().length === 0">
          <div class="empty-icon"><lucide-icon [img]="Receipt"></lucide-icon></div>
          <h3>No Invoices found</h3>
          <p class="text-muted">Generate invoices from the Orders tab to see them here.</p>
        </div>
      </div>

      <!-- Payment Modal -->
      <div class="modal-backdrop" *ngIf="showModal()">
        <div class="modal-content animate-slideUp">
          <div class="modal-header">
            <h3>Record Payment</h3>
            <button class="close-btn" (click)="closeModal()"><lucide-icon [img]="X" class="w-5 h-5"></lucide-icon></button>
          </div>
          <form [formGroup]="paymentForm" (ngSubmit)="savePayment()">
            <div class="modal-body form-grid block-grid">
              
              <div class="bg-gray p-4 mb-4 rounded border">
                <p class="text-sm font-medium mb-1">Invoice: <strong>{{ selectedInvoice()?.invoiceNumber }}</strong></p>
                <p class="text-sm">Pending Amount: <strong class="text-danger">₹{{ selectedInvoice()?.dueAmount | number:'1.2-2' }}</strong></p>
              </div>

              <div class="form-group">
                <label>Amount Received (₹) *</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="DollarSign" class="input-icon"></lucide-icon>
                  <input type="number" formControlName="amount" class="form-control" placeholder="0.00" autoFocus>
                </div>
              </div>

              <div class="form-group">
                <label>Payment Mode *</label>
                <select formControlName="paymentMode" class="form-control">
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div class="form-group">
                <label>Transaction Reference ID</label>
                <div class="input-with-icon">
                  <lucide-icon [img]="Text" class="input-icon"></lucide-icon>
                  <input type="text" formControlName="transactionReference" class="form-control" placeholder="Txn ID...">
                </div>
              </div>

            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="paymentForm.invalid || saving()">
                <span *ngIf="saving()" class="spinner-sm mr-2"></span>
                Record Payment
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

    .badge-success { background: rgba(16, 185, 129, 0.1); color: #059669; }
    .badge-warning { background: rgba(245, 158, 11, 0.1); color: #D97706; }
    .badge-danger { background: rgba(239, 68, 68, 0.1); color: #DC2626; }
    .badge-neutral { background: var(--bg-hover); color: var(--text-muted); }

    .text-success { color: #059669; }
    .text-warning { color: #D97706; }
    .text-danger { color: #DC2626; }

    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 1rem; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--border); }
    .data-table td { padding: 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .data-table tr:hover td { background: var(--bg-hover); }

    .bg-gray { background: var(--bg-hover); }
    .border { border: 1px solid var(--border); }
    .rounded { border-radius: 8px; }

    /* Modal Styles */
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-content { background: var(--bg-primary); width: 100%; max-width: 450px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); display: flex; flex-direction: column; max-height: 90vh; }
    .modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }
    .modal-body { padding: 1.5rem; overflow-y: auto; }
    .block-grid { display: block; }
    .form-group { margin-bottom: 1.25rem; }
    .modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; background: var(--bg-secondary); }
    
    .form-group label { display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.4rem; }
    .form-control { width: 100%; padding: 0.65rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); outline: none; transition: 0.2s; }
    .form-control:focus { border-color: var(--accent); }
    .input-with-icon { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 0.8rem; width: 1.1rem; height: 1.1rem; color: var(--text-muted); }
    .input-with-icon .form-control { padding-left: 2.5rem; }

    .search-box { position: relative; display: flex; align-items: center; }
    .search-box input { padding: 0.65rem 1rem 0.65rem 2.5rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-primary); min-width: 260px; outline: none; }
    .search-box input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
    .search-icon { position: absolute; left: 0.8rem; width: 1.2rem; height: 1.2rem; color: var(--text-muted); }

    .empty-state { padding: 4rem 2rem; text-align: center; }
    .empty-icon { width: 64px; height: 64px; background: rgba(124,58,237,0.1); color: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slideUp { animation: slideUp 0.3s cubic forwards; }
  `]
})
export class InvoicesComponent implements OnInit {
  invoices = signal<Invoice[]>([]);
  loading = signal(false);

  searchQuery = signal('');
  searchTimeout: any;

  // Modal State
  selectedInvoice = signal<Invoice | null>(null);
  showModal = signal(false);
  saving = signal(false);
  paymentForm: FormGroup;

  readonly Search = Search;
  readonly Receipt = Receipt;
  readonly CreditCard = CreditCard;
  readonly ExternalLink = ExternalLink;
  readonly X = X;
  readonly DollarSign = DollarSign;
  readonly Text = Text;

  constructor(
    private invoiceService: InvoiceService,
    private fb: FormBuilder
  ) {
    this.paymentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      paymentMode: ['Bank Transfer', Validators.required],
      transactionReference: ['']
    });
  }

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    this.loading.set(true);
    this.invoiceService.getInvoices(1, 100).subscribe({
      next: (res: any) => {
        // filter client-side search since we don't have full search param in invoices yet API
        let data = res.items || [];
        if (this.searchQuery()) {
          data = data.filter((i: any) =>
            i.invoiceNumber.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
            i.companyName?.toLowerCase().includes(this.searchQuery().toLowerCase())
          );
        }
        this.invoices.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onSearch(event: any) {
    this.searchQuery.set(event.target.value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadInvoices(), 400);
  }

  openPaymentModal(invoice: Invoice) {
    this.selectedInvoice.set(invoice);
    this.paymentForm.reset({
      amount: invoice.dueAmount,
      paymentMode: 'Bank Transfer'
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  savePayment() {
    if (this.paymentForm.invalid || !this.selectedInvoice()) return;
    this.saving.set(true);

    const payload = this.paymentForm.value;

    this.invoiceService.recordPayment(this.selectedInvoice()!.id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadInvoices(); // Reload to get updated payments and statuses
      },
      error: (err) => {
        this.saving.set(false);
        alert(err.error?.message || 'Failed to record payment.');
      }
    });
  }
}
