import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  LucideAngularModule, CreditCard, TrendingUp, CheckCircle,
  Clock, Search, RefreshCw, Building2, User
} from 'lucide-angular';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DatePipe],
  template: `
    <div class="animate-fadeIn page-container">

      <!-- Header -->
      <div class="glass-header">
        <div>
          <h2 class="page-title">Payment History</h2>
          <p class="page-subtitle">All received payments — customer, product and invoice details.</p>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="load()">
          <lucide-icon [img]="RefreshCw" class="w-4 h-4 mr-1"></lucide-icon> Refresh
        </button>
      </div>

      <!-- Summary Stats -->
      <div class="stats-bar" *ngIf="!loading()">
        <div class="stat-pill">
          <span class="stat-label">Total Received</span>
          <span class="stat-num text-success">₹{{ totalReceived() | number:'1.0-0' }}</span>
        </div>
        <div class="stat-pill">
          <span class="stat-label">Transactions</span>
          <span class="stat-num text-primary">{{ payments().length }}</span>
        </div>
        <div class="stat-pill">
          <span class="stat-label">Fully Paid</span>
          <span class="stat-num text-success">{{ countByStatus('Paid') }}</span>
        </div>
        <div class="stat-pill">
          <span class="stat-label">Partial</span>
          <span class="stat-num text-warning">{{ countByStatus('PartiallyPaid') }}</span>
        </div>
        <div class="stat-pill">
          <span class="stat-label">Unpaid</span>
          <span class="stat-num text-danger">{{ countByStatus('Unpaid') }}</span>
        </div>
      </div>

      <!-- Search -->
      <div class="filter-bar card p-3 mt-4 mb-0" style="border-bottom-left-radius:0;border-bottom-right-radius:0;">
        <div class="search-box">
          <lucide-icon [img]="Search" class="search-icon"></lucide-icon>
          <input type="text" placeholder="Search by customer, company, invoice or order number..." [value]="searchQuery()" (input)="setSearch($any($event.target).value)">
        </div>
      </div>

      <!-- Table -->
      <div class="card mt-0 p-0" style="border-top-left-radius:0;border-top-right-radius:0;border-top:none;">
        <div class="p-6 text-center" *ngIf="loading()">
          <div class="spinner"></div><p class="text-muted mt-3">Loading payments...</p>
        </div>

        <table class="data-table" *ngIf="!loading() && filtered().length > 0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer / Company</th>
              <th>Order #</th>
              <th>Products Bought</th>
              <th>Amount Paid</th>
              <th>Invoice Total</th>
              <th>Mode</th>
              <th>Invoice Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filtered()">
              <td>
                <div class="font-medium text-sm">{{ p.paymentDate | date:'dd MMM yyyy' }}</div>
                <div class="text-xs text-muted">{{ p.paymentDate | date:'shortTime' }}</div>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <div class="avatar-mini"><lucide-icon [img]="User" class="w-3 h-3"></lucide-icon></div>
                  <div>
                    <div class="text-sm font-medium">{{ p.customerName || '—' }}</div>
                    <div class="text-xs text-muted flex items-center gap-1">
                      <lucide-icon [img]="Building2" class="w-3 h-3"></lucide-icon>
                      {{ p.companyName || '—' }}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge badge-neutral text-xs">{{ p.orderNumber || '—' }}</span>
              </td>
              <td>
                <ng-container *ngIf="p.products && p.products.length > 0">
                  <div *ngFor="let prod of p.products" class="text-xs mb-1">
                    <span class="font-medium">{{ prod.name }}</span>
                    <span class="text-muted ml-1">×{{ prod.quantity }}</span>
                  </div>
                </ng-container>
                <span class="text-xs text-muted italic" *ngIf="!p.products || p.products.length === 0">Consolidated</span>
              </td>
              <td>
                <span class="amount-received">+ ₹{{ p.amount | number:'1.2-2' }}</span>
              </td>
              <td class="font-medium text-sm">₹{{ p.invoiceTotal | number:'1.2-2' }}</td>
              <td>
                <span class="badge badge-neutral">{{ p.paymentMode }}</span>
              </td>
              <td>
                <span class="badge"
                  [ngClass]="{
                    'badge-success': p.paymentStatus === 'Paid',
                    'badge-warning': p.paymentStatus === 'PartiallyPaid',
                    'badge-danger':  p.paymentStatus === 'Unpaid'
                  }">
                  {{ p.paymentStatus === 'PartiallyPaid' ? 'Partial' : p.paymentStatus }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty-state" *ngIf="!loading() && filtered().length === 0">
          <div class="empty-icon"><lucide-icon [img]="CreditCard"></lucide-icon></div>
          <h3>No Payments Recorded</h3>
          <p class="text-muted">When customers make payments, all records will appear here.</p>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .glass-header { display:flex; justify-content:space-between; align-items:center; padding:1.25rem 1.5rem; border-radius:16px; margin-bottom:1.5rem; background:rgba(255,255,255,0.6); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.4); box-shadow:0 10px 30px -10px rgba(0,0,0,0.05); }
    .stats-bar { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
    .stat-pill { display:flex; flex-direction:column; align-items:center; background:var(--bg-primary); border:1px solid var(--border); border-radius:10px; padding:0.6rem 1.25rem; flex:1; min-width:110px; }
    .stat-label { font-size:0.7rem; text-transform:uppercase; color:var(--text-muted); font-weight:600; letter-spacing:0.05em; }
    .stat-num { font-size:1.3rem; font-weight:800; margin-top:2px; }
    .filter-bar { display:flex; gap:1rem; align-items:center; }
    .search-box { position:relative; display:flex; align-items:center; flex:1; }
    .search-box input { padding:0.6rem 1rem 0.6rem 2.5rem; border-radius:8px; border:1px solid var(--border); background:var(--bg-secondary); width:100%; outline:none; font-size:0.875rem; }
    .search-box input:focus { border-color:var(--accent); }
    .search-icon { position:absolute; left:0.8rem; width:1.1rem; height:1.1rem; color:var(--text-muted); }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { text-align:left; padding:0.75rem 1rem; color:var(--text-muted); font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid var(--border); }
    .data-table td { padding:0.75rem 1rem; border-bottom:1px solid var(--border); vertical-align:middle; }
    .data-table tr:hover td { background:var(--bg-hover); }
    .avatar-mini { width:24px; height:24px; border-radius:6px; display:flex; align-items:center; justify-content:center; background:rgba(124,58,237,0.1); flex-shrink:0; color:var(--accent); }
    .amount-received { font-size:1rem; font-weight:800; color:#059669; }
    .badge-neutral { background:var(--bg-hover); color:var(--text-secondary); }
    .badge-success { background:rgba(16,185,129,0.12); color:#059669; }
    .badge-warning { background:rgba(245,158,11,0.12); color:#D97706; }
    .badge-danger { background:rgba(239,68,68,0.12); color:#DC2626; }
    .btn-sm { padding:0.4rem 0.85rem; font-size:0.8rem; }
    .text-success { color:#059669; } .text-warning { color:#D97706; } .text-danger { color:#DC2626; }
    .empty-state { padding:4rem 2rem; text-align:center; }
    .empty-icon { width:64px; height:64px; background:rgba(124,58,237,0.1); color:var(--accent); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem; }
    .spinner { width:36px; height:36px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.7s linear infinite; margin:0 auto; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `]
})
export class PaymentsComponent implements OnInit {
  payments = signal<any[]>([]);
  loading = signal(false);
  searchQuery = signal('');

  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.payments();
    return this.payments().filter(p =>
      p.customerName?.toLowerCase().includes(q) ||
      p.companyName?.toLowerCase().includes(q) ||
      p.invoiceNumber?.toLowerCase().includes(q) ||
      p.orderNumber?.toLowerCase().includes(q) ||
      p.products?.some((pr: any) => pr.name?.toLowerCase().includes(q))
    );
  });

  totalReceived = computed(() => this.payments().reduce((s, p) => s + (p.amount ?? 0), 0));
  countByStatus = (status: string) => {
    const invoiceIds = new Set<string>();
    const statusMap = new Map<string, string>();
    this.payments().forEach(p => {
      if (p.invoiceNumber && p.paymentStatus) {
        statusMap.set(p.invoiceNumber, p.paymentStatus);
        invoiceIds.add(p.invoiceNumber);
      }
    });
    return [...statusMap.values()].filter(s => s === status).length;
  };

  readonly CreditCard = CreditCard;
  readonly TrendingUp = TrendingUp;
  readonly CheckCircle = CheckCircle;
  readonly Clock = Clock;
  readonly Search = Search;
  readonly RefreshCw = RefreshCw;
  readonly Building2 = Building2;
  readonly User = User;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/payments?pageSize=200`).subscribe({
      next: res => {
        this.payments.set(res.items || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setSearch(q: string) { this.searchQuery.set(q); }
}
