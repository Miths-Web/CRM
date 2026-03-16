import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { InvoiceService } from '../../core/services/invoice.service';
import { Payment } from '../../core/models/payment.model';
import {
  LucideAngularModule, CreditCard, ExternalLink, Calendar
} from 'lucide-angular';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DatePipe],
  template: `
    <div class="animate-fadeIn page-container">
      <div class="glass-header">
        <div>
          <h2 class="page-title">Payments History</h2>
          <p class="page-subtitle">A global log of all recorded payments received.</p>
        </div>
      </div>

      <div class="card p-0 mt-4">
        <div class="p-6 text-center" *ngIf="loading()">
            <div class="spinner"></div><p class="text-muted mt-3">Loading payments...</p>
        </div>

        <table class="data-table" *ngIf="!loading() && payments().length > 0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice Number</th>
              <th>Amount Received</th>
              <th>Payment Mode</th>
              <th>Txn Reference</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of payments()">
              <td>
                <div class="font-medium flex items-center gap-2">
                  <lucide-icon [img]="Calendar" class="w-4 h-4 text-muted"></lucide-icon>
                  {{ p.paymentDate | date:'mediumDate' }}
                </div>
                <div class="text-xs text-muted">{{ p.paymentDate | date:'shortTime' }}</div>
              </td>
              <td>
                <span class="badge badge-primary">{{ p.invoiceNumber || 'INV-...' }}</span>
              </td>
              <td class="font-bold text-success">
                + ₹{{ p.amount | number:'1.2-2' }}
              </td>
              <td>
                <span class="badge badge-neutral">{{ p.paymentMode }}</span>
              </td>
              <td class="text-sm font-mono text-muted">
                {{ p.transactionReference || 'N/A' }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!loading() && payments().length === 0">
          <div class="empty-icon"><lucide-icon [img]="CreditCard"></lucide-icon></div>
          <h3>No Payments found</h3>
          <p class="text-muted">You haven't recorded any payments yet. Go to Invoices to collect payments.</p>
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
    
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 1rem; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--border); }
    .data-table td { padding: 1rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .data-table tr:hover td { background: var(--bg-hover); }

    .badge-primary { background: rgba(124, 58, 237, 0.1); color: var(--accent); }
    .badge-neutral { background: var(--bg-hover); color: var(--text-secondary); }
    .text-success { color: #059669; }

    .empty-state { padding: 4rem 2rem; text-align: center; }
    .empty-icon { width: 64px; height: 64px; background: rgba(124,58,237,0.1); color: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
// Payment Component gets payments globally by iterating through invoices for now (or a dedicated endpoint in a full setup)
// Since we don't have a GET /payments global API, we fetch invoices and extract payments client side for this view
export class PaymentsComponent implements OnInit {
  payments = signal<Payment[]>([]);
  loading = signal(false);

  readonly CreditCard = CreditCard;
  readonly ExternalLink = ExternalLink;
  readonly Calendar = Calendar;

  constructor(private invoiceService: InvoiceService) { }

  ngOnInit() {
    this.loading.set(true);
    // Fetch all invoices to extract payments globally
    this.invoiceService.getInvoices(1, 1000).subscribe({
      next: (res: any) => {
        let allPayments: Payment[] = [];
        const invoices = res.items || [];
        invoices.forEach((inv: any) => {
          if (inv.payments && inv.payments.length) {
            allPayments = [...allPayments, ...inv.payments];
          }
        });

        // Sort descending by date
        allPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

        this.payments.set(allPayments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
