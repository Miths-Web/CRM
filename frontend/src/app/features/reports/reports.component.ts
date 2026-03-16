import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService, SalesReport, DashboardData } from './services/report.service';
import { LucideAngularModule, BarChart2, RefreshCw, CircleDollarSign, Target } from 'lucide-angular';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h2 class="page-title">Reports & Analytics</h2>
          <p class="page-subtitle">Business insights and performance metrics</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" (click)="loadAll()"><lucide-icon [img]="RefreshCw" class="btn-icon-sm"></lucide-icon> Refresh</button>
        </div>
      </div>

      <div class="flex-center" style="padding:3rem" *ngIf="loading()"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading()">
        <!-- Overview Cards -->
        <div class="stats-grid" *ngIf="dashboard()">
          <div class="stat-card">
            <div class="stat-value" style="color:var(--success)">₹{{dashboard()!.totalPipelineValue | number:'1.0-0'}}</div>
            <div class="stat-label">Total Pipeline</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--accent-light)">₹{{dashboard()!.totalClosedWonValue | number:'1.0-0'}}</div>
            <div class="stat-label">Total Won Revenue</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{dashboard()!.leadConversionRate}}%</div>
            <div class="stat-label">Lead Conversion Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{dashboard()!.dealWinRate}}%</div>
            <div class="stat-label">Deal Win Rate</div>
          </div>
        </div>

        <!-- Sales Report -->
        <div class="reports-grid">
          <div class="card" *ngIf="salesReport()">
            <div class="flex-between mb-4">
              <h3>Monthly Sales ({{currentYear}})</h3>
              <div class="flex gap-2">
                <button class="btn btn-secondary btn-sm" (click)="currentYear = currentYear - 1; loadSales()">‹ {{currentYear - 1}}</button>
                <button class="btn btn-secondary btn-sm" (click)="currentYear = currentYear + 1; loadSales()">{{currentYear + 1}} ›</button>
              </div>
            </div>
            <div class="monthly-chart">
              <div class="bar-row" *ngFor="let m of salesReport()!.monthlyBreakdown">
                <div class="bar-label">{{m.month.slice(0,3)}}</div>
                <div class="bar-track">
                  <div class="bar-fill" [style.width]="getBarWidth(m.revenue) + '%'">
                    <span class="bar-val" *ngIf="m.revenue > 0">₹{{m.revenue | number:'1.0-0'}}</span>
                  </div>
                </div>
                <div class="bar-count">{{m.dealsCount}} deals</div>
              </div>
            </div>
            <div class="report-summary">
              <div class="summary-item">
                <span>Total Revenue</span>
                <strong style="color:var(--success)">₹{{salesReport()!.revenue | number:'1.0-0'}}</strong>
              </div>
              <div class="summary-item">
                <span>Deals Won</span>
                <strong>{{salesReport()!.dealsWon}}</strong>
              </div>
              <div class="summary-item">
                <span>Deals Lost</span>
                <strong style="color:var(--danger)">{{salesReport()!.dealsLost}}</strong>
              </div>
            </div>
          </div>

          <!-- Lead Report -->
          <div class="card" *ngIf="leadReport()">
            <h3 class="mb-4">Lead Analysis</h3>
            <div class="lead-sections">
              <div class="lead-section">
                <h4 style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:0.75rem">By Status</h4>
                <div class="lead-row" *ngFor="let item of leadReport().byStatus">
                  <span class="badge" [ngClass]="getLeadStatusBadge(item.status)">{{item.status}}</span>
                  <div class="lead-bar-track">
                    <div class="lead-bar" [style.width]="getLeadBarWidth(item.count, leadReport().byStatus) + '%'"></div>
                  </div>
                  <strong>{{item.count}}</strong>
                </div>
              </div>
              <div class="lead-section" style="margin-top:1.5rem">
                <h4 style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:0.75rem">By Source</h4>
                <div class="lead-row" *ngFor="let item of leadReport().bySource">
                  <span class="lead-src">{{item.source}}</span>
                  <div class="lead-bar-track">
                    <div class="lead-bar" style="background:var(--info)" [style.width]="getLeadBarWidth(item.count, leadReport().bySource) + '%'"></div>
                  </div>
                  <strong>{{item.count}}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .reports-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 900px) { .reports-grid { grid-template-columns: 1fr; } }

    .monthly-chart { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
    .bar-row { display: flex; align-items: center; gap: 0.75rem; }
    .bar-label { width: 28px; font-size: 0.75rem; color: var(--text-muted); flex-shrink: 0; }
    .bar-track { flex: 1; height: 20px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; }
    .bar-fill  { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-light));
      border-radius: 4px; transition: width 0.5s ease; display: flex; align-items: center; padding-left: 6px; min-width: 2px; }
    .bar-val   { font-size: 0.65rem; color: #fff; font-weight: 600; white-space: nowrap; }
    .bar-count { width: 55px; font-size: 0.7rem; color: var(--text-muted); text-align: right; flex-shrink: 0; }

    .report-summary { display: flex; gap: 1rem; border-top: 1px solid var(--border); padding-top: 1rem; flex-wrap: wrap; }
    .summary-item { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; color: var(--text-secondary); }

    .lead-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .lead-bar-track { flex: 1; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; }
    .lead-bar { height: 100%; background: var(--success); border-radius: 4px; transition: width 0.4s ease; }
    .lead-src { width: 80px; font-size: 0.75rem; color: var(--text-secondary); flex-shrink: 0; }

    .spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ReportsComponent implements OnInit {
  dashboard = signal<DashboardData | null>(null);
  salesReport = signal<SalesReport | null>(null);
  leadReport = signal<any>(null);
  loading = signal(true);
  currentYear = new Date().getFullYear();

  readonly BarChart2 = BarChart2;
  readonly RefreshCw = RefreshCw;
  readonly CircleDollarSign = CircleDollarSign;
  readonly Target = Target;

  constructor(private reportService: ReportService) { }
  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.reportService.getDashboard().subscribe({ next: d => this.dashboard.set(d) });
    this.reportService.getLeadReport().subscribe({ next: d => this.leadReport.set(d) });
    this.loadSales();
  }

  loadSales() {
    this.reportService.getSalesReport(this.currentYear).subscribe({
      next: d => { this.salesReport.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  getBarWidth(val: number): number {
    if (!this.salesReport()) return 0;
    const max = Math.max(...this.salesReport()!.monthlyBreakdown.map(m => m.revenue), 1);
    return Math.round((val / max) * 100);
  }

  getLeadBarWidth(count: number, list: any[]): number {
    const max = Math.max(...list.map(i => i.count), 1);
    return Math.round((count / max) * 100);
  }

  getLeadStatusBadge(status: string): string {
    const map: Record<string, string> = { New: 'badge-blue', Contacted: 'badge-yellow', Qualified: 'badge-green', Proposal: 'badge-purple', Negotiation: 'badge-yellow', Lost: 'badge-red', Converted: 'badge-green' };
    return map[status] ?? 'badge-gray';
  }
}
