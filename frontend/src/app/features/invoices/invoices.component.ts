import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { InvoiceService } from '../../core/services/invoice.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  LucideAngularModule, Search, Receipt, X, RefreshCw, Eye
} from 'lucide-angular';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DatePipe],
  template: `
    <div class="animate-fadeIn page-container">

      <!-- Header -->
      <div class="glass-header">
        <div>
          <h2 class="page-title">Invoices</h2>
          <p class="page-subtitle">Auto-generated billing records — view what each customer purchased.</p>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="loadInvoices()">
          <lucide-icon [img]="RefreshCw" class="w-4 h-4 mr-1"></lucide-icon> Refresh
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-bar" *ngIf="!loading()">
        <div class="stat-pill"><span class="stat-label">Total Invoices</span><span class="stat-num text-primary">{{ invoices().length }}</span></div>
        <div class="stat-pill"><span class="stat-label">Total Billed</span><span class="stat-num text-primary">₹{{ totalBilled() | number:'1.0-0' }}</span></div>
        <div class="stat-pill"><span class="stat-label">Paid</span><span class="stat-num text-success">{{ countByStatus('Paid') }}</span></div>
        <div class="stat-pill"><span class="stat-label">Partial</span><span class="stat-num text-warning">{{ countByStatus('PartiallyPaid') }}</span></div>
        <div class="stat-pill"><span class="stat-label">Unpaid</span><span class="stat-num text-danger">{{ countByStatus('Unpaid') }}</span></div>
      </div>

      <!-- Search + Filter -->
      <div class="filter-bar card p-3 mt-4 mb-0" style="border-bottom-left-radius:0;border-bottom-right-radius:0;">
        <div class="search-box">
          <lucide-icon [img]="Search" class="search-icon"></lucide-icon>
          <input type="text" placeholder="Search invoice number, customer, company..." [value]="searchQuery()" (input)="setSearch($any($event.target).value)">
        </div>
        <div class="flex items-center gap-2">
          <select class="filter-select" [value]="statusFilter()" (change)="setStatus($any($event.target).value)">
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="PartiallyPaid">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="card mt-0 p-0" style="border-top-left-radius:0;border-top-right-radius:0;border-top:none;">
        <div class="p-6 text-center" *ngIf="loading()">
          <div class="spinner"></div><p class="text-muted mt-3">Loading invoices...</p>
        </div>

        <table class="data-table" *ngIf="!loading() && filtered().length > 0">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Invoice Date</th>
              <th>Due Date</th>
              <th>Customer / Company</th>
              <th>Total Billed</th>
              <th>Payment Status</th>
              <th class="text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let inv of filtered()" (click)="viewDetails(inv)" class="cursor-pointer">
              <td>
                <div class="flex items-center gap-2">
                  <div class="avatar-bg"><lucide-icon [img]="Receipt" class="w-4 h-4 text-accent"></lucide-icon></div>
                  <strong class="text-primary">{{ inv.invoiceNumber }}</strong>
                </div>
              </td>
              <td class="text-sm text-muted">{{ inv.invoiceDate | date:'dd MMM yyyy' }}</td>
              <td class="text-sm" [class.text-danger]="isOverdue(inv)">{{ inv.dueDate | date:'dd MMM yyyy' }}</td>
              <td>
                <div class="text-sm font-medium">{{ inv.companyName || '—' }}</div>
                <div class="text-xs text-muted">{{ inv.customerName || '—' }}</div>
              </td>
              <td class="font-bold">₹{{ inv.totalAmount | number:'1.2-2' }}</td>
              <td>
                <span class="badge"
                  [ngClass]="{
                    'badge-success':  inv.paymentStatus === 'Paid',
                    'badge-warning':  inv.paymentStatus === 'PartiallyPaid',
                    'badge-danger':   inv.paymentStatus === 'Unpaid'
                  }">
                  {{ inv.paymentStatus === 'PartiallyPaid' ? 'Partial' : inv.paymentStatus }}
                </span>
              </td>
              <td class="text-right">
                <button *ngIf="(inv.paymentStatus === 'Unpaid' || inv.paymentStatus === 'PartiallyPaid') && !isAdmin()" 
                        class="btn btn-sm" style="background:#6366f1; color:white; border:none; border-radius:6px; padding:0.4rem 0.8rem; font-size:0.75rem; font-weight:600; margin-right:0.5rem;" 
                        (click)="viewDetails(inv); $event.stopPropagation()">
                  Pay Now
                </button>
                <button class="action-btn text-accent" title="View Invoice" (click)="viewDetails(inv); $event.stopPropagation()">
                  <lucide-icon [img]="Eye" class="w-4 h-4"></lucide-icon>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty-state" *ngIf="!loading() && filtered().length === 0">
          <div class="empty-icon"><lucide-icon [img]="Receipt"></lucide-icon></div>
          <h3>No Invoices Found</h3>
          <p class="text-muted">Invoices are auto-generated when orders are placed.</p>
        </div>
      </div>

      <!-- ═══ Invoice Detail Modal ═══ -->
      <div class="modal-backdrop" *ngIf="viewingInvoice()" style="padding:2rem;">
        <div class="modal-content animate-slideUp" style="max-width:850px;max-height:95vh;background:#fff;border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.3);overflow:hidden; position:relative;">

          <!-- Close Modal Top Right Button -->
          <button (click)="closeDetails()" class="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-all z-50 hide-on-print">
            <lucide-icon [img]="X" class="w-6 h-6 text-gray-400"></lucide-icon>
          </button>

          <!-- Invoice Document -->
          <div id="invoice-doc-content" class="invoice-scroll-container">

            <!-- Invoice Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:3rem; margin-top:0.5rem;">
              <div style="flex:1;">
                <img src="/logo.png" alt="Company Logo" style="height:40px; width: auto; margin-bottom:15px; object-fit:contain; filter: brightness(1.1) contrast(1.05); image-rendering: -webkit-optimize-contrast;">
                <div style="font-size:0.85rem; color:#6b7280; line-height:1.7;">
                  123 Business Avenue, Tech Hub<br>
                  Mumbai, Maharashtra 400001<br>
                  finance&#64;dhwiticrm.com
                </div>
              </div>
              
              <div style="flex:1; text-align:right;">
                <div style="font-size:2.25rem; font-weight:800; text-transform:uppercase; color:#e5e7eb; letter-spacing:4px; margin-bottom:1rem; line-height:1;">INVOICE</div>
                <div style="font-size:1.1rem; font-weight:700; color:#1f2937; margin-bottom: 0.5rem;"># {{ viewingInvoice()?.invoiceNumber }}</div>
                <div style="font-size:0.85rem; color:#6b7280; line-height:1.6; display:inline-block; text-align:left;">
                  <div style="display:flex; justify-content:space-between; gap:2.5rem;"><strong>Date:</strong> <span>{{ viewingInvoice()?.invoiceDate | date:'dd MMM yyyy' }}</span></div>
                  <div style="display:flex; justify-content:space-between; gap:2.5rem;"><strong>Due:</strong> <span [style.color]="isOverdue(viewingInvoice()) ? '#dc2626' : '#374151'">{{ viewingInvoice()?.dueDate | date:'dd MMM yyyy' }}</span></div>
                </div>
              </div>
            </div>

            <!-- Billed To -->
            <div style="margin-bottom:2rem;">
              <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin-bottom:0.5rem;">Billed To</div>
              <div style="font-size:1.15rem;font-weight:700;color:#111827;margin-bottom:4px;">{{ viewingInvoice()?.companyName || viewingInvoice()?.customerName || '—' }}</div>
              <div style="font-size:0.9rem;color:#6b7280;" *ngIf="viewingInvoice()?.customerName && viewingInvoice()?.companyName">{{ viewingInvoice()?.customerName }}</div>
              <div style="font-size:0.9rem;color:#6b7280;" *ngIf="viewingInvoice()?.gstNo">GST: {{ viewingInvoice()?.gstNo }}</div>
              <div style="font-size:0.9rem;color:#6b7280;line-height:1.6;margin-top:4px;max-width:300px;" *ngIf="viewingInvoice()?.billingAddress">
                {{ viewingInvoice()?.billingAddress?.addressLine1 }},
                {{ viewingInvoice()?.billingAddress?.city }},
                {{ viewingInvoice()?.billingAddress?.state }} - {{ viewingInvoice()?.billingAddress?.pincode }}
              </div>
            </div>

            <!-- Products Table -->
            <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:2.5rem;">
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                    <th style="padding:1rem;text-align:left;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Product / Description</th>
                    <th style="padding:1rem;text-align:center;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Qty</th>
                    <th style="padding:1rem;text-align:right;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Rate</th>
                    <th style="padding:1rem;text-align:right;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngIf="!viewingInvoice()?.orderItems?.length">
                    <td colspan="4" style="padding:2.5rem;text-align:center;color:#9ca3af;font-style:italic;font-size:0.9rem;">
                      Consolidated billing — no individual product breakdown.
                    </td>
                  </tr>
                  <tr *ngFor="let item of viewingInvoice()?.orderItems" style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:1.2rem 1rem;font-size:0.95rem;font-weight:500;color:#111827; line-height: 1.4; max-width: 350px; word-wrap: break-word;">{{ item.productName || 'Service/Item' }}</td>
                    <td style="padding:1.2rem 1rem;text-align:center;color:#6b7280;font-size:0.95rem; white-space: nowrap;">{{ item.quantity }}</td>
                    <td style="padding:1.2rem 1rem;text-align:right;color:#6b7280;font-size:0.95rem; white-space: nowrap;">₹{{ item.unitPrice | number:'1.2-2' }}</td>
                    <td style="padding:1.2rem 1rem;text-align:right;font-weight:700;color:#111827;font-size:0.95rem; white-space: nowrap;">₹{{ item.lineTotal | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totals -->
            <div style="display:flex;justify-content:flex-end;margin-bottom:2rem;">
              <div style="width:320px;">
                <div style="display:flex;justify-content:space-between;padding:0.6rem 0;font-size:0.9rem;color:#6b7280;border-bottom:1px dashed #e5e7eb;">
                  <span>Subtotal</span><span>₹{{ viewingInvoice()?.subTotal | number:'1.2-2' }}</span>
                </div>
                <div *ngIf="viewingInvoice()?.taxAmount > 0" style="display:flex;justify-content:space-between;padding:0.6rem 0;font-size:0.9rem;color:#6b7280;border-bottom:1px dashed #e5e7eb;">
                  <span>Tax</span><span>₹{{ viewingInvoice()?.taxAmount | number:'1.2-2' }}</span>
                </div>
                <div *ngIf="viewingInvoice()?.discountAmount > 0" style="display:flex;justify-content:space-between;padding:0.6rem 0;font-size:0.9rem;color:#059669;border-bottom:1px dashed #e5e7eb;">
                  <span>Discount</span><span>- ₹{{ viewingInvoice()?.discountAmount | number:'1.2-2' }}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:0.85rem 0;font-size:1.2rem;font-weight:900;color:#111827;border-top:2px solid #111827;margin-top:8px;">
                  <span>Total Amount</span><span>₹{{ viewingInvoice()?.totalAmount | number:'1.2-2' }}</span>
                </div>
                
                <!-- Payment Status Block -->
                <div style="margin-top:1rem; margin-bottom: 2rem; padding:1.25rem; border-radius:12px;"
                  [style.background]="viewingInvoice()?.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)'">
                  <div style="display:flex;justify-content:space-between;font-size:0.9rem;margin-bottom:6px;">
                    <span style="color:#6b7280;">Amount Paid</span>
                    <span style="font-weight:600;color:#059669;">₹{{ viewingInvoice()?.paidAmount | number:'1.2-2' }}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:800;">
                    <span>Balance Due</span>
                    <span [style.color]="viewingInvoice()?.paymentStatus === 'Paid' ? '#059669' : '#dc2626'">
                      ₹{{ (viewingInvoice()?.totalAmount - viewingInvoice()?.paidAmount) | number:'1.2-2' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Note -->
            <div style="margin-top:3rem; padding-top:2rem; border-top:1px dashed #e2e8f0; font-size:0.8rem; color:#9ca3af; text-align:center;">
              <p>{{ viewingInvoice()?.termsAndConditions || 'Payment is due within 30 days. Thank you for your business!' }}</p>
              <p style="margin-top:0.5rem; font-style:italic;">This is a system-generated invoice.</p>
            </div>

            <!-- This div provides the uniform bottom gap matching the top -->
            <div style="height: 4rem;"></div>
            
          </div>

          <!-- Invoice Actions Footer -->
          <div style="background:white; border-top:1px solid #f1f5f9; padding:1.25rem 3rem; display:flex; justify-content:space-between; align-items:center; border-bottom-left-radius:24px; border-bottom-right-radius:24px;">
            <div *ngIf="viewingInvoice()?.paymentStatus === 'Paid'" style="color:#059669; font-weight:700;">
               ✅ Fully Paid
            </div>
            <div *ngIf="viewingInvoice()?.paymentStatus !== 'Paid'" style="color:#6366f1; font-weight:700;">
               🔔 Pending Payment
            </div>
            <div style="margin-left:auto; display:flex; gap:0.75rem;" class="hide-on-print">
              <button class="btn btn-outline" style="border:1px solid #94a3b8; background:white; color:#475569; font-weight:600; padding:0.5rem 1rem; border-radius:6px;" (click)="downloadPdfAsFile()">
                📄 Download PDF
              </button>
              <button *ngIf="viewingInvoice()?.paymentStatus !== 'Paid'"
                class="btn btn-outline"
                style="border:1px solid #6366f1; background:white; color:#6366f1; font-weight:600; padding:0.5rem 1rem; border-radius:6px;"
                (click)="copyPaymentLink(viewingInvoice())"
                title="Copy Razorpay payment link to clipboard">
                🔗 Copy Payment Link
              </button>
              <button class="btn btn-outline" style="border:1px solid #94a3b8; background:white; color:#475569; font-weight:600; padding:0.5rem 1rem; border-radius:6px;" (click)="emailInvoice(viewingInvoice())">
                ✉️ Email Customer
              </button>
              <button class="btn btn-secondary" style="font-weight:600; padding:0.5rem 1.5rem;" (click)="closeDetails()">Close</button>
            </div>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1300px; margin: 0 auto; }
    .glass-header { display:flex; justify-content:space-between; align-items:center; padding:1.25rem 1.5rem; border-radius:16px; margin-bottom:1.5rem; background:rgba(255,255,255,0.6); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.4); box-shadow:0 10px 30px -10px rgba(0,0,0,0.05); }
    .stats-bar { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
    .stat-pill { display:flex; flex-direction:column; align-items:center; background:var(--bg-primary); border:1px solid var(--border); border-radius:10px; padding:0.6rem 1.25rem; flex:1; min-width:100px; }
    .stat-label { font-size:0.7rem; text-transform:uppercase; color:var(--text-muted); font-weight:600; letter-spacing:0.05em; }
    .stat-num { font-size:1.3rem; font-weight:800; margin-top:2px; }
    .filter-bar { display:flex; gap:1rem; align-items:center; }
    .search-box { position:relative; display:flex; align-items:center; flex:1; }
    .search-box input { padding:0.6rem 1rem 0.6rem 2.5rem; border-radius:8px; border:1px solid var(--border); background:var(--bg-secondary); width:100%; outline:none; font-size:0.875rem; }
    .search-box input:focus { border-color:var(--accent); }
    .search-icon { position:absolute; left:0.8rem; width:1.1rem; height:1.1rem; color:var(--text-muted); }
    .filter-select { padding:0.55rem 1rem; border-radius:8px; border:1px solid var(--border); background:var(--bg-secondary); color:var(--text-primary); font-size:0.85rem; outline:none; cursor:pointer; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { text-align:left; padding:0.75rem 1rem; color:var(--text-muted); font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid var(--border); }
    .data-table td { padding:0.75rem 1rem; border-bottom:1px solid var(--border); vertical-align:middle; }
    .data-table tr:hover td { background:var(--bg-hover); }
    .avatar-bg { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:rgba(124,58,237,0.1); flex-shrink:0; }
    .action-btn { background:none; border:none; padding:0.4rem; border-radius:6px; cursor:pointer; color:var(--text-muted); transition:all 0.2s; }
    .action-btn.text-accent:hover { color:var(--accent); background:rgba(124,58,237,0.1); }
    .badge-success { background:rgba(16,185,129,0.12); color:#059669; }
    .badge-warning { background:rgba(245,158,11,0.12); color:#D97706; }
    .badge-danger { background:rgba(239,68,68,0.12); color:#DC2626; }
    .modal-backdrop { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); z-index:1000; display:flex; align-items:center; justify-content:center; }
    .modal-content { width:100%; display:flex; flex-direction:column; max-height: 90vh; overflow: hidden; border-radius: 24px; }
    .btn-sm { padding:0.4rem 0.85rem; font-size:0.8rem; }
    .text-success { color:#059669; } .text-warning { color:#D97706; } .text-danger { color:#DC2626; }
    .empty-state { padding:4rem 2rem; text-align:center; }
    .empty-icon { width:64px; height:64px; background:rgba(124,58,237,0.1); color:var(--accent); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem; }
    .spinner { width:36px; height:36px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.7s linear infinite; margin:0 auto; }
    
    /* Scroll container for Invoice Content */
    .invoice-scroll-container { 
      overflow-y: auto; 
      flex: 1; 
      background: white; 
      padding: 4rem 5rem 6rem; /* Huge bottom padding to match top */
      scrollbar-width: thin;
      scrollbar-color: #e2e8f0 transparent;
    }
    .invoice-scroll-container::-webkit-scrollbar { width: 6px; }
    .invoice-scroll-container::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    .animate-slideUp { animation:slideUp 0.3s ease forwards; }
    .cursor-pointer { cursor:pointer; }

    @media print {
      @page { size: auto; margin: 0; }
      body { background: white !important; }
      .modal-backdrop { position: absolute !important; display: block !important; padding: 0 !important; margin: 0 !important; background: white !important; }
      .modal-content { display: block !important; width: 100% !important; margin: 0 !important; border-radius: 0 !important; height: auto !important; max-height: none !important; }
      .invoice-scroll-container { overflow: visible !important; height: auto !important; padding: 2cm !important; margin: 0 !important; background: white !important; width: 100% !important; border: none !important; }
      .hide-on-print { display: none !important; }
      body * { visibility: hidden !important; }
      .modal-content, .modal-content * { visibility: visible !important; }
    }
  `]
})
export class InvoicesComponent implements OnInit {
  invoices = signal<any[]>([]);
  loading = signal(false);
  searchQuery = signal('');
  statusFilter = signal('');
  viewingInvoice = signal<any>(null);
  processingPayment = signal(false);

  filtered = computed(() => {
    let list = this.invoices();
    const q = this.searchQuery().toLowerCase();
    const s = this.statusFilter();
    if (s) list = list.filter(i => i.paymentStatus === s);
    if (q) list = list.filter(i =>
      i.invoiceNumber?.toLowerCase().includes(q) ||
      i.customerName?.toLowerCase().includes(q) ||
      i.companyName?.toLowerCase().includes(q)
    );
    return list;
  });

  totalBilled = computed(() => this.invoices().reduce((s, i) => s + (i.totalAmount ?? 0), 0));
  countByStatus = (status: string) => this.invoices().filter(i => i.paymentStatus === status).length;
  isOverdue = (inv: any) => inv?.dueDate && new Date(inv.dueDate) < new Date() && inv.paymentStatus !== 'Paid';

  readonly Search = Search; readonly Receipt = Receipt;
  readonly X = X; readonly RefreshCw = RefreshCw; readonly Eye = Eye;

  constructor(
    private invoiceService: InvoiceService, 
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  isAdmin() { return this.authService.isAdmin(); }

  ngOnInit() { this.loadInvoices(); }

  loadInvoices() {
    this.loading.set(true);
    this.invoiceService.getInvoices(1, 200).subscribe({
      next: (res: any) => { this.invoices.set(res.items || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  setSearch(q: string) { this.searchQuery.set(q); }
  setStatus(s: string) { this.statusFilter.set(s); }

  viewDetails(invoice: any) {
    this.invoiceService.getInvoiceById(invoice.id).subscribe({
      next: res => this.viewingInvoice.set(res),
      error: () => this.viewingInvoice.set(invoice)
    });
  }

  closeDetails() { this.viewingInvoice.set(null); }

  copyPaymentLink(invoice: any, e?: Event) {
    if (e) e.stopPropagation();
    if (!invoice || !invoice.invoiceNumber) return;
    
    // Using our custom integrated Razorpay test checkout page
    // Ensures real Razorpay UI is triggered for the client tests
    const link = `http://localhost:4200/pay/${invoice.id}`;
    
    navigator.clipboard.writeText(link).then(() => {
       alert(`Razorpay Payment Link copied!\n\nLink: ${link}`);
    }).catch(err => {
       alert('Failed to copy link.');
    });
  }

  recordOffline(invoice: any) {
    if (!invoice) return;
    alert('Please go to the Payments module to record an offline payment for Invoice ' + (invoice.invoiceNumber || invoice.id));
  }

  router = inject(Router);

  emailInvoice(invoice: any) {
    if (!invoice) return;
    const customerEmail = invoice.customerEmail || invoice.customer?.customerEmail || '';
    const invNum = invoice.invoiceNumber;
    const amountDue = invoice.totalAmount - invoice.paidAmount;

    const rzpLink = `http://localhost:4200/pay/${invoice.id}`;
    
    const subject = `Invoice ${invNum} from Dhwiti CRM`;
    const defaultBody = `Dear ${invoice.customerName || 'Customer'},\n\nPlease find your Invoice ${invNum} attached to this email in PDF format.\n\nTotal Amount: Rs. ${invoice.totalAmount}\nBalance Due: Rs. ${amountDue}\n\nYou can pay securely via Razorpay using the link below:\n${rzpLink}\n\nThank you for your business!\nSales Team\nDhwiti CRM`;

    this.closeDetails();
    this.router.navigate(['/emails'], { 
      queryParams: { 
        composeTo: customerEmail,
        composeSubject: subject,
        prefillBody: defaultBody
      } 
    });
  }

  downloadPdfAsFile() {
    const data = document.getElementById('invoice-doc-content');
    if (!data) return;

    // Show loading or something if needed
    const invNum = this.viewingInvoice()?.invoiceNumber || 'Invoice';
    
    html2canvas(data, {
      scale: 2, // Higher quality
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    }).then(canvas => {
      const imgWidth = 208; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const contentDataURL = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${invNum}.pdf`);
    });
  }

  downloadPdf() {
    window.print();
  }
}

