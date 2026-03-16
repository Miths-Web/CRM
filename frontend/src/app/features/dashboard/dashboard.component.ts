import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService, DashboardData, SalesReport } from '../reports/services/report.service';
import { AuthService } from '../../core/services/auth.service';
import { BaseChartDirective } from 'ng2-charts';

import { LucideAngularModule, LayoutDashboard, RefreshCw, Users, Target, CircleDollarSign, CheckSquare, TrendingUp, Rocket, Trophy, AlertTriangle, Flame, Plus, Mail, Video, BarChart2 } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, BaseChartDirective],
  template: `
    <div class="animate-fadeIn">

      <!-- Header -->
      <div class="page-header" style="align-items: flex-end;">
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--accent); margin-bottom: 0.25rem;">Business Overview</div>
          <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px;">Welcome back! 👋</h2>
          <p class="text-muted text-sm mt-1">Here's what's happening with your pipeline today.</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm shadow-sm" (click)="load()"><lucide-icon [img]="RefreshCw" class="btn-icon-sm"></lucide-icon> Refresh Data</button>
        </div>
      </div>

      <!-- Loading -->
      <div class="flex-center" style="padding:3rem" *ngIf="loading()">
        <div class="spinner"></div>
      </div>

      <ng-container *ngIf="!loading() && data()">
        <!-- KPI Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{data()!.totalContacts | number}}</div>
            <div class="stat-label">Total Customers</div>
            <div class="stat-icon"><lucide-icon [img]="Users"></lucide-icon></div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{data()!.totalLeads | number}}</div>
            <div class="stat-label">Total Leads</div>
            <div class="stat-icon"><lucide-icon [img]="Target"></lucide-icon></div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{data()!.totalDeals | number}}</div>
            <div class="stat-label">Active Deals</div>
            <div class="stat-icon"><lucide-icon [img]="CircleDollarSign"></lucide-icon></div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{data()!.openTasks | number}}</div>
            <div class="stat-label">Open Tasks</div>
            <div class="stat-icon"><lucide-icon [img]="CheckSquare"></lucide-icon></div>
          </div>
          <div class="stat-card">
            <div class="stat-value">₹{{data()!.totalPipelineValue | number:'1.0-0'}}</div>
            <div class="stat-label">Pipeline Value</div>
            <div class="stat-icon"><lucide-icon [img]="TrendingUp"></lucide-icon></div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{data()!.leadConversionRate}}%</div>
            <div class="stat-label">Lead Conversion</div>
            <div class="stat-icon"><lucide-icon [img]="Rocket"></lucide-icon></div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{data()!.dealWinRate}}%</div>
            <div class="stat-label">Win Rate</div>
            <div class="stat-icon"><lucide-icon [img]="Trophy"></lucide-icon></div>
          </div>
          <div class="stat-card">
            <div class="stat-value" [class.text-danger]="data()!.overdueTasks > 0">
              {{data()!.overdueTasks | number}}
            </div>
            <div class="stat-label">Overdue Tasks</div>
            <div class="stat-icon"><lucide-icon [img]="AlertTriangle"></lucide-icon></div>
          </div>
        </div>

        <!-- Admin/Manager Charts Section -->
        <div class="card mb-4" *ngIf="isAdminOrManager()">
          <div class="flex-between mb-4">
            <h3>Revenue Growth (This Year)</h3>
            <span class="badge badge-purple">{{salesData()?.period || '—'}}</span>
          </div>
          <div style="height: 300px; width: 100%; position: relative;" *ngIf="monthlyRevenueChartData.labels.length > 0; else noSalesData">
             <canvas baseChart
              [data]="monthlyRevenueChartData"
              [options]="barChartOptions"
              [type]="'bar'">
            </canvas>
          </div>
          <ng-template #noSalesData>
            <div class="flex-center text-muted" style="height: 300px;">
              No sales data available for this year yet.
            </div>
          </ng-template>
        </div>

        <!-- Bottom Grid 2 Columns -->
        <div class="dashboard-grid">
          <!-- Top Deals -->
          <div class="card">
            <div class="flex-between mb-4">
              <h3>Top Open Deals</h3>
              <a routerLink="/deals" class="btn btn-secondary btn-sm">View All →</a>
            </div>
            <div class="deal-list" *ngIf="data()!.topDeals?.length; else noDeals">
              <div class="deal-item" *ngFor="let deal of data()!.topDeals; let i = index">
                <div class="deal-info">
                  <div class="deal-title">{{deal.title}}</div>
                  <div class="deal-company text-muted text-sm">{{deal.companyName || '—'}}</div>
                </div>
                <!-- Venture Style Avatar Stack Mockup -->
                <div class="avatar-group" style="margin-left:auto; margin-right:1rem; display:none;">
                   <div class="avatar" title="Assigned Agent">A</div>
                </div>
                <div class="deal-right">
                  <div class="deal-value">₹{{deal.value | number:'1.0-0'}}</div>
                  <div class="badge badge-purple">{{deal.stageName}}</div>
                </div>
              </div>
            </div>
            <ng-template #noDeals>
              <p class="text-muted text-sm">No open deals yet. <a routerLink="/deals">Create one →</a></p>
            </ng-template>
          </div>

          <!-- Quick Actions / Quick Stats -->
          <div class="card">
            <h3 class="mb-4">Quick Links & Stats</h3>
            <div class="quick-links-grid mb-6">
              <a routerLink="/customers" class="quick-link"><lucide-icon [img]="Plus" class="quick-link-icon"></lucide-icon> New Customer</a>
              <a routerLink="/deals" class="quick-link"><lucide-icon [img]="CircleDollarSign" class="quick-link-icon"></lucide-icon> New Deal</a>
              <a routerLink="/tasks" class="quick-link"><lucide-icon [img]="CheckSquare" class="quick-link-icon"></lucide-icon> New Task</a>
              <a routerLink="/emails" class="quick-link"><lucide-icon [img]="Mail" class="quick-link-icon"></lucide-icon> Send Email</a>
            </div>

            <div class="quick-stat-list">
              <div class="quick-stat">
                <span class="text-muted">Avg. Deal Size</span>
                <strong>₹{{data()!.averageDealSize | number:'1.0-0'}}</strong>
              </div>
              <div class="quick-stat">
                <span class="text-muted">Total Won Value</span>
                <strong class="text-success">₹{{data()!.totalClosedWonValue | number:'1.0-0'}}</strong>
              </div>
              <div class="quick-stat">
                <span class="text-muted">Upcoming Events</span>
                <strong>{{data()!.upcomingEvents}}</strong>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

    </div>
  `,
  styles: [`
    .stats-grid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
    .text-danger { color: var(--danger) !important; }
    .text-success { color: var(--success) !important; }

    .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }

    .deal-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .deal-item { display: flex; justify-content: space-between; align-items: center;
      padding: 1rem 1.25rem; background: var(--bg-card); border-radius: 12px;
      border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      transition: var(--transition);
      &:hover { border-color: var(--accent); transform: translateX(2px); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    }
    .deal-title { font-weight: 700; font-size: 0.9rem; color: var(--text-primary); margin-bottom: 0.25rem; }
    .deal-right { text-align: right; display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-end; }
    .deal-value { font-weight: 800; color: var(--text-primary); font-size: 1.05rem; }

    .quick-stat-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .quick-stat { display: flex; justify-content: space-between; align-items: center;
      padding: 0.75rem 0; border-bottom: 1px solid var(--border); font-size: 0.875rem;
      &:last-child { border-bottom: none; }
    }
    .quick-links-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .quick-link { display: flex; align-items: center; justify-content: center; padding: 0.75rem; background: var(--bg-secondary);
      border: 1px solid var(--border); border-radius: 9999px;
      font-size: 0.85rem; font-weight: 500; color: var(--text-primary); text-decoration: none;
      transition: var(--transition);
      &:hover { border-color: var(--accent); color: var(--accent); background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    }
    .spinner { width: 36px; height: 36px; border: 3px solid var(--border);
      border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  data = signal<DashboardData | null>(null);
  salesData = signal<SalesReport | null>(null);
  isAdminOrManager = signal(false);

  readonly LayoutDashboard = LayoutDashboard;
  readonly RefreshCw = RefreshCw;
  readonly Users = Users;
  readonly Target = Target;
  readonly CircleDollarSign = CircleDollarSign;
  readonly CheckSquare = CheckSquare;
  readonly TrendingUp = TrendingUp;
  readonly Rocket = Rocket;
  readonly Trophy = Trophy;
  readonly AlertTriangle = AlertTriangle;
  readonly Flame = Flame;
  readonly Plus = Plus;
  readonly Mail = Mail;
  readonly Video = Video;
  readonly BarChart2 = BarChart2;

  // Chart configuration
  public barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };
  
  public monthlyRevenueChartData: any = { labels: [], datasets: [] };
  
  constructor(
    private reportService: ReportService,
    private authService: AuthService
  ) { }

  ngOnInit() { 
    this.isAdminOrManager.set(this.authService.isManager());
    this.load(); 
  }

  load() {
    this.loading.set(true);
    
    // Load general KPI Dashboard
    this.reportService.getDashboard().subscribe({
      next: (d) => { 
        this.data.set(d); 
        this.loading.set(false); 
      },
      error: () => { this.loading.set(false); }
    });

    // If Admin/Manager, load monthly sales chart data
    if (this.isAdminOrManager()) {
      this.reportService.getSalesReport().subscribe(res => {
        this.salesData.set(res);
        if (res.monthlyBreakdown) {
          this.monthlyRevenueChartData = {
            labels: res.monthlyBreakdown.map(m => m.month.substring(0, 3)),
            datasets: [{
              label: 'Revenue (₹)',
              data: res.monthlyBreakdown.map(m => m.revenue),
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
              borderRadius: 4
            }]
          };
        }
      });
    }
  }
}

