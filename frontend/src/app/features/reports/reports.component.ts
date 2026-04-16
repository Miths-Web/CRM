import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ReportService, DashboardData } from './services/report.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { LucideAngularModule, RefreshCw, ShoppingCart, Receipt, CreditCard, AlertCircle, Download, TrendingUp, BarChart2 } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, BaseChartDirective],
  template: `
    <div class="animate-fadeIn">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Reports & Analytics</h2>
          <p class="page-subtitle">Business insights from Orders, Invoices & Payments</p>
        </div>
        <div class="flex gap-2 items-center">
          <div class="year-pill">
            <button (click)="changeYear(-1)">‹</button>
            <span>{{ currentYear }}</span>
            <button (click)="changeYear(1)">›</button>
          </div>
          <button class="btn btn-secondary btn-sm" (click)="loadAll()">
            <lucide-icon [img]="RefreshCw" class="w-4 h-4 mr-1"></lucide-icon> Refresh
          </button>
          <button class="btn btn-primary btn-sm" (click)="downloadCSV()">
            <lucide-icon [img]="Download" class="w-4 h-4 mr-1"></lucide-icon> Export
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div class="flex-center" style="padding:3rem" *ngIf="loading()">
        <div class="spinner"></div>
      </div>

      <ng-container *ngIf="!loading() && biz()">

        <!-- KPI Cards (4 compact) Admin Only -->
        <div class="kpi-row" *ngIf="isAdmin()">
          <div class="kpi-card">
            <div class="kpi-left">
              <div class="kpi-icon icon-blue"><lucide-icon [img]="ShoppingCart" class="w-4 h-4"></lucide-icon></div>
            </div>
            <div class="kpi-right">
              <div class="kpi-val">₹{{ biz()!.totalOrderValue | number:'1.0-0' }}</div>
              <div class="kpi-lbl">Orders Value</div>
              <div class="kpi-sub">{{ biz()!.totalOrderCount }} orders</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-left">
              <div class="kpi-icon icon-green"><lucide-icon [img]="Receipt" class="w-4 h-4"></lucide-icon></div>
            </div>
            <div class="kpi-right">
              <div class="kpi-val">₹{{ biz()!.totalBilled | number:'1.0-0' }}</div>
              <div class="kpi-lbl">Total Billed</div>
              <div class="kpi-sub">{{ biz()!.paidInvoices }} paid · {{ biz()!.unpaidInvoices }} unpaid</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-left">
              <div class="kpi-icon icon-teal"><lucide-icon [img]="CreditCard" class="w-4 h-4"></lucide-icon></div>
            </div>
            <div class="kpi-right">
              <div class="kpi-val">₹{{ biz()!.totalPaymentsReceived | number:'1.0-0' }}</div>
              <div class="kpi-lbl">Collected</div>
              <div class="kpi-sub">{{ biz()!.totalPaymentCount }} transactions</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-left">
              <div class="kpi-icon icon-red"><lucide-icon [img]="AlertCircle" class="w-4 h-4"></lucide-icon></div>
            </div>
            <div class="kpi-right">
              <div class="kpi-val" style="color:var(--danger)">₹{{ biz()!.totalOutstanding | number:'1.0-0' }}</div>
              <div class="kpi-lbl">Outstanding Due</div>
              <div class="kpi-sub">{{ biz()!.unpaidInvoices + biz()!.partialInvoices }} invoices pending</div>
            </div>
          </div>
        </div>

        <!-- Main Content: 2-column -->
        <div class="two-col mt-4">

          <!-- LEFT COLUMN -->
          <div style="display:flex;flex-direction:column;gap:1rem;">
            
            <!-- Monthly Chart -->
            <div class="card" *ngIf="isAdmin()">
            <div class="card-head mb-3">
              <div>
                <div class="card-title">Monthly Revenue ({{ currentYear }})</div>
                <div class="card-sub">Orders Billed vs Payments Collected</div>
              </div>
            </div>
            <div style="height: 260px; position: relative; width: 100%;">
              <canvas *ngIf="lineChartData.labels.length" baseChart
                [data]="lineChartData"
                [options]="lineChartOptions"
                type="line">
              </canvas>
            </div>
            </div> <!-- End of Monthly Chart Card -->

            <!-- CRM Pipeline (Moved up to fill gap) -->
            <div class="card" *ngIf="dashboard()">
              <div class="card-title mb-3">CRM Pipeline</div>
              <div class="pipeline-grid">
                <div class="pip-item">
                  <div class="pip-val" style="color:var(--accent)">₹{{ dashboard()!.totalPipelineValue | number:'1.0-0' }}</div>
                  <div class="pip-lbl">Open Pipeline</div>
                </div>
                <div class="pip-item">
                  <div class="pip-val clr-success">₹{{ dashboard()!.totalClosedWonValue | number:'1.0-0' }}</div>
                  <div class="pip-lbl">Won Revenue</div>
                </div>
                <div class="pip-item">
                  <div class="pip-val">{{ dashboard()!.leadConversionRate }}%</div>
                  <div class="pip-lbl">Lead Conversion</div>
                </div>
                <div class="pip-item">
                  <div class="pip-val">{{ dashboard()!.dealWinRate }}%</div>
                  <div class="pip-lbl">Deal Win Rate</div>
                </div>
              </div>
            </div> <!-- End of CRM Pipeline Card -->
            <!-- Top Customers (Moved into left column to fill remaining space) -->
            <div class="card" *ngIf="isAdmin() && biz() && biz()!.topCustomers?.length">
              <div class="card-title mb-3">Top 5 Customers by Revenue ({{ currentYear }})</div>
              <div class="cust-table">
                <div class="cust-row head-row">
                  <span>#</span><span>Customer</span><span>Total Billed</span><span>Share</span>
                </div>
                <div class="cust-row" *ngFor="let c of biz()!.topCustomers; let i = index">
                  <span class="rank-badge">{{ i + 1 }}</span>
                  <span class="cust-name">{{ c.customerName }}</span>
                  <span class="cust-val">₹{{ c.totalBilled | number:'1.0-0' }}</span>
                  <div class="cust-bar-wrap">
                    <div class="cust-bar" [style.width]="getCustPct(c.totalBilled) + '%'"></div>
                  </div>
                </div>
              </div>
            </div>

          </div> <!-- End of LEFT COLUMN -->

          <!-- RIGHT COLUMN: Status + Collection Summary -->
          <div style="display:flex;flex-direction:column;gap:1rem;">

            <!-- Financial Summary -->
            <div class="card" *ngIf="isAdmin()">
              <div class="card-title mb-3">Financial Summary</div>
              <div class="fin-row"><span>Total Billed</span><strong>₹{{ biz()!.totalBilled | number:'1.2-2' }}</strong></div>
              <div class="fin-row clr-success"><span>Total Collected</span><strong>₹{{ biz()!.totalPaymentsReceived | number:'1.2-2' }}</strong></div>
              <div class="fin-row clr-danger"><span>Outstanding Due</span><strong>₹{{ biz()!.totalOutstanding | number:'1.2-2' }}</strong></div>
              <div class="fin-divider"></div>
              <div class="fin-row fin-total">
                <span>Collection Rate</span>
                <strong>{{ biz()!.totalBilled > 0 ? ((biz()!.totalPaymentsReceived / biz()!.totalBilled) * 100 | number:'1.1-1') : 0 }}%</strong>
              </div>
              <!-- Collection rate bar -->
              <div class="rate-bar-track mt-2">
                <div class="rate-bar"
                  [style.width]="(biz()!.totalBilled > 0 ? (biz()!.totalPaymentsReceived / biz()!.totalBilled) * 100 : 0) + '%'">
                </div>
              </div>
            </div>

            <!-- Invoice Status -->
            <div class="card" *ngIf="isAdmin()">
              <div class="card-title mb-3">Invoice Status</div>
              <div class="inv-row">
                <span class="inv-dot" style="background:var(--success)"></span>
                <span class="inv-lbl">Paid</span>
                <div class="inv-bar-track">
                  <div class="inv-bar" style="background:var(--success)" [style.width]="getInvPct(biz()!.paidInvoices) + '%'"></div>
                </div>
                <strong>{{ biz()!.paidInvoices }}</strong>
              </div>
              <div class="inv-row">
                <span class="inv-dot" style="background:#D97706"></span>
                <span class="inv-lbl">Partial</span>
                <div class="inv-bar-track">
                  <div class="inv-bar" style="background:#D97706" [style.width]="getInvPct(biz()!.partialInvoices) + '%'"></div>
                </div>
                <strong>{{ biz()!.partialInvoices }}</strong>
              </div>
              <div class="inv-row">
                <span class="inv-dot" style="background:var(--danger)"></span>
                <span class="inv-lbl">Unpaid</span>
                <div class="inv-bar-track">
                  <div class="inv-bar" style="background:var(--danger)" [style.width]="getInvPct(biz()!.unpaidInvoices) + '%'"></div>
                </div>
                <strong>{{ biz()!.unpaidInvoices }}</strong>
              </div>
            </div>

            <!-- Order Status -->
            <div class="card">
              <div class="card-title mb-3">Order Status</div>
              <div class="inv-row" *ngFor="let s of biz()!.orderStatusBreakdown">
                <span class="inv-dot" [style.background]="statusColor(s.status)"></span>
                <span class="inv-lbl">{{ s.status }}</span>
                <div class="inv-bar-track">
                  <div class="inv-bar" [style.background]="statusColor(s.status)"
                       [style.width]="getStatusPct(s.count) + '%'"></div>
                </div>
                <strong>{{ s.count }}</strong>
              </div>
            </div>
            <!-- Lead Analysis (Moved up) -->
            <div class="card" *ngIf="leadReport()">
              <div class="card-title mb-1">Lead Analysis</div>
              <div class="two-half mt-2">
                <div>
                  <div class="card-sub mb-2">By Status</div>
                  <div class="inv-row" *ngFor="let item of leadReport().byStatus">
                    <span class="inv-lbl">{{ item.status }}</span>
                    <div class="inv-bar-track"><div class="inv-bar" style="background:var(--accent)" [style.width]="getLeadPct(item.count, leadReport().byStatus) + '%'"></div></div>
                    <strong>{{ item.count }}</strong>
                  </div>
                </div>
                <div>
                  <div class="card-sub mb-2">By Source</div>
                  <div class="inv-row" *ngFor="let item of leadReport().bySource">
                    <span class="inv-lbl">{{ item.source }}</span>
                    <div class="inv-bar-track"><div class="inv-bar" style="background:var(--success)" [style.width]="getLeadPct(item.count, leadReport().bySource) + '%'"></div></div>
                    <strong>{{ item.count }}</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Top Customers moved into the left column -->

      </ng-container>
    </div>
  `,
  styles: [`
    /* === Layout === */
    .page-header { margin-bottom: 1.25rem; }

    /* === Year Switcher === */
    .year-pill { display:flex; align-items:center; gap:0.4rem; background:var(--bg-secondary); border:1px solid var(--border); border-radius:8px; padding:0.3rem 0.6rem; font-size:0.82rem; font-weight:700; }
    .year-pill button { background:none; border:none; cursor:pointer; font-size:1rem; color:var(--accent); padding:0 2px; line-height:1; }

    /* === KPI Row === */
    .kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:0.875rem; }
    @media(max-width:900px) { .kpi-row { grid-template-columns:1fr 1fr; } }
    .kpi-card { display:flex; align-items:center; gap:0.875rem; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:0.875rem 1rem; }
    .kpi-icon { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .icon-blue  { background:rgba(59,130,246,0.1);  color:#60a5fa; }
    .icon-green { background:rgba(5,150,105,0.1);   color:#34d399; }
    .icon-teal  { background:rgba(20,184,166,0.1);  color:#2dd4bf; }
    .icon-red   { background:rgba(220,38,38,0.1);   color:#f87171; }
    .kpi-val  { font-size:1.15rem; font-weight:800; line-height:1.1; }
    .kpi-lbl  { font-size:0.7rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em; margin-top:2px; }
    .kpi-sub  { font-size:0.68rem; color:var(--text-muted); margin-top:1px; }

    /* === Two Column === */
    .two-col  { display:grid; grid-template-columns:1.4fr 1fr; gap:1rem; }
    .two-half { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    @media(max-width:900px) { .two-col { grid-template-columns:1fr; } .two-half { grid-template-columns:1fr; } }

    /* === Card internals === */
    .card-head { display:flex; justify-content:space-between; align-items:flex-start; }
    .card-title { font-size:0.88rem; font-weight:700; color:var(--text-primary); }
    .card-sub   { font-size:0.72rem; color:var(--text-muted); margin-top:2px; }

    /* === Legend === */
    .legend-row { display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; }
    .leg-dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
    .leg-txt { font-size:0.7rem; color:var(--text-muted); }

    /* === Monthly Chart === */
    .monthly-chart { display:flex; flex-direction:column; gap:0.45rem; }
    .bar-row    { display:flex; align-items:center; gap:0.6rem; }
    .bar-month  { width:26px; font-size:0.68rem; color:var(--text-muted); flex-shrink:0; font-weight:600; }
    .bar-tracks { flex:1; display:flex; flex-direction:column; gap:3px; }
    .bar-track  { height:11px; background:var(--bg-secondary); border-radius:4px; overflow:hidden; position:relative; }
    .bar-fill   { height:100%; border-radius:4px; transition:width 0.5s ease; min-width:0; }
    .bar-amt    { position:absolute; right:4px; top:50%; transform:translateY(-50%); font-size:0.58rem; color:var(--text-muted); white-space:nowrap; }

    /* === Financial Summary === */
    .fin-row { display:flex; justify-content:space-between; align-items:center; font-size:0.82rem; padding:0.3rem 0; color:var(--text-secondary); border-bottom:1px dashed var(--border); }
    .fin-row:last-child { border:none; }
    .fin-divider { border-top:1.5px solid var(--border); margin:0.4rem 0 0.2rem; }
    .fin-total { font-weight:700; font-size:0.88rem; color:var(--text-primary); }
    .clr-success { color:var(--success) !important; }
    .clr-danger  { color:var(--danger) !important; }
    .rate-bar-track { height:6px; background:var(--bg-secondary); border-radius:3px; overflow:hidden; }
    .rate-bar { height:100%; background:var(--success); border-radius:3px; transition:width 0.7s ease; }

    /* === Invoice / Status Bars === */
    .inv-row { display:flex; align-items:center; gap:0.5rem; margin-bottom:0.45rem; }
    .inv-dot  { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
    .inv-lbl  { width:58px; font-size:0.75rem; color:var(--text-secondary); flex-shrink:0; }
    .inv-bar-track { flex:1; height:7px; background:var(--bg-secondary); border-radius:3px; overflow:hidden; }
    .inv-bar  { height:100%; border-radius:3px; transition:width 0.4s ease; }
    .inv-row strong { font-size:0.8rem; color:var(--text-primary); min-width:20px; text-align:right; }

    /* === Pipeline === */
    .pipeline-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
    .pip-item { background:var(--bg-secondary); border-radius:8px; padding:0.75rem; border:1px solid var(--border); text-align:center; }
    .pip-val  { font-size:1.05rem; font-weight:800; }
    .pip-lbl  { font-size:0.68rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em; margin-top:3px; }

    /* === Top Customers Table === */
    .cust-table { display:flex; flex-direction:column; gap:0.4rem; }
    .cust-row { display:grid; grid-template-columns:30px 1fr 120px 140px; align-items:center; gap:0.75rem; font-size:0.82rem; }
    .head-row { font-size:0.68rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em; padding-bottom:0.3rem; border-bottom:1px solid var(--border); }
    .rank-badge { width:22px; height:22px; border-radius:50%; background:var(--bg-secondary); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700; color:var(--text-muted); }
    .cust-name { font-weight:600; color:var(--text-primary); }
    .cust-val  { font-weight:700; color:var(--success); }
    .cust-bar-wrap { height:6px; background:var(--bg-secondary); border-radius:3px; overflow:hidden; }
    .cust-bar { height:100%; background:var(--accent); opacity:0.7; border-radius:3px; transition:width 0.5s ease; }

    /* === Misc === */
    .mt-2 { margin-top:0.5rem; } .mt-3 { margin-top:0.75rem; } .mt-4 { margin-top:1rem; } .mb-1 { margin-bottom:0.25rem; } .mb-2 { margin-bottom:0.5rem; } .mb-3 { margin-bottom:0.75rem; }
    .spinner { width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .btn-sm { padding:0.35rem 0.8rem; font-size:0.78rem; }
  `]
})
export class ReportsComponent implements OnInit {
  biz = signal<any>(null);
  dashboard = signal<DashboardData | null>(null);
  leadReport = signal<any>(null);
  loading = signal(true);
  currentYear = new Date().getFullYear();

  readonly RefreshCw = RefreshCw; readonly ShoppingCart = ShoppingCart;
  readonly Receipt = Receipt; readonly CreditCard = CreditCard;
  readonly AlertCircle = AlertCircle; readonly Download = Download;
  readonly TrendingUp = TrendingUp; readonly BarChart2 = BarChart2;

  // Chart configuration
  public lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { tension: 0.4 }, // Smooth curving
      point: { radius: 3, hitRadius: 10, hoverRadius: 5 }
    },
    plugins: {
      legend: { display: true, position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } },
      tooltip: {
        mode: 'index', intersect: false,
        callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}` }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { callback: (val: number) => val >= 1000 ? `₹${(val / 1000).toFixed(1)}K` : `₹${val}` }
      }
    }
  };

  public lineChartData: any = { labels: [], datasets: [] };

  constructor(private http: HttpClient, private reportSvc: ReportService, private authService: AuthService) { }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/reports/business-summary?year=${this.currentYear}`)
      .subscribe({
        next: d => {
          this.biz.set(d);
          if (d.monthlyBreakdown) {
            this.lineChartData = {
              labels: d.monthlyBreakdown.map((m: any) => m.month.substring(0, 3)),
              datasets: [
                {
                  label: 'Billed',
                  data: d.monthlyBreakdown.map((m: any) => m.orderValue),
                  borderColor: '#7c3aed',
                  backgroundColor: 'rgba(124, 58, 237, 0.1)',
                  borderWidth: 2,
                  fill: true
                },
                {
                  label: 'Collected',
                  data: d.monthlyBreakdown.map((m: any) => m.collectedAmt),
                  borderColor: '#059669',
                  backgroundColor: 'rgba(5, 150, 105, 0.1)',
                  borderWidth: 2,
                  fill: true
                }
              ]
            };
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    this.reportSvc.getDashboard().subscribe({ next: d => this.dashboard.set(d) });
    this.reportSvc.getLeadReport().subscribe({ next: d => this.leadReport.set(d) });
  }

  changeYear(delta: number) { this.currentYear += delta; this.loadAll(); }

  private get maxOrder(): number {
    if (!this.biz()?.monthlyBreakdown) return 1;
    return Math.max(...this.biz().monthlyBreakdown.map((m: any) => Math.max(m.orderValue, m.collectedAmt)), 1);
  }

  getBarPct(val: number): number { return Math.min(100, Math.round((val / this.maxOrder) * 100)); }

  getStatusPct(count: number): number {
    const total = this.biz()?.totalOrderCount || 1;
    return Math.round((count / total) * 100);
  }

  getInvPct(count: number): number {
    const total = (this.biz()?.paidInvoices ?? 0) + (this.biz()?.unpaidInvoices ?? 0) + (this.biz()?.partialInvoices ?? 0);
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }

  getLeadPct(count: number, list: any[]): number {
    const max = Math.max(...list.map((i: any) => i.count), 1);
    return Math.round((count / max) * 100);
  }

  getCustPct(val: number): number {
    const topCustomers = this.biz()?.topCustomers || [];
    const max = Math.max(...topCustomers.map((c: any) => c.totalBilled), 1);
    return Math.round((val / max) * 100);
  }

  statusColor(status: string): string {
    return { 'Draft': '#D97706', 'Confirmed': '#0284c7', 'Active': '#3b82f6', 'Completed': '#059669', 'Cancelled': '#dc2626',
             'Pending': '#D97706', 'Shipped': '#3b82f6', 'Delivered': '#059669' }[status] ?? 'var(--accent)';
  }

  downloadCSV() {
    const b = this.biz();
    if (!b) return;
    let csv = `CRM Business Report - ${this.currentYear}\n\n`;
    csv += `FINANCIAL SUMMARY\n`;
    csv += `Total Order Value,₹${b.totalOrderValue}\nTotal Billed,₹${b.totalBilled}\nTotal Collected,₹${b.totalPaymentsReceived}\nOutstanding Due,₹${b.totalOutstanding}\n\n`;
    csv += `MONTHLY BREAKDOWN\nMonth,Orders Value,Orders Count,Collected\n`;
    b.monthlyBreakdown.forEach((m: any) => { csv += `${m.month},${m.orderValue},${m.orderCount},${m.collectedAmt}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `CRM_Report_${this.currentYear}.csv`;
    a.click();
  }
}
