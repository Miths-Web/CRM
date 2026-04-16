import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ReportService, DashboardData, SalesReport } from '../reports/services/report.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { BaseChartDirective } from 'ng2-charts';

import { LucideAngularModule, LayoutDashboard, RefreshCw, Users, Target, CircleDollarSign, CheckSquare, TrendingUp, Rocket, Trophy, AlertTriangle, Flame, Plus, Mail, Video, BarChart2, ArrowRight, Activity } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, BaseChartDirective],
  template: `
    <div class="animate-fadeIn">

      <!-- Header -->
      <div class="page-header" style="align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        
        <div style="flex: 1; min-width: 300px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--accent); margin-bottom: 0.25rem;">{{ userRoleDisplay() }} Overview</div>
          <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px;">Welcome back, {{userName()}}! 👋</h2>
          <p class="text-muted text-sm mt-1">Here's what's happening with your pipeline today.</p>
        </div>

        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem;">
          <button class="btn btn-secondary btn-sm shadow-sm" (click)="load()" style="margin-bottom: 0.25rem;">
            <lucide-icon [img]="RefreshCw" class="btn-icon-sm"></lucide-icon> Refresh Data
          </button>
          
          <div class="quick-links-grid" style="justify-content: flex-end;">
            <a *ngIf="canRead('Leads')" routerLink="/leads" class="quick-link"><lucide-icon [img]="Target" class="quick-link-icon"></lucide-icon> Lead</a>
            <a *ngIf="canRead('Deals')" routerLink="/deals" class="quick-link"><lucide-icon [img]="CircleDollarSign" class="quick-link-icon"></lucide-icon> Deal</a>
            <a *ngIf="canRead('Tasks')" routerLink="/tasks" class="quick-link"><lucide-icon [img]="CheckSquare" class="quick-link-icon"></lucide-icon> Task</a>
            <a *ngIf="canRead('Customers')" routerLink="/customers" class="quick-link"><lucide-icon [img]="Users" class="quick-link-icon"></lucide-icon> Customer</a>
            <a *ngIf="canRead('Emails')" routerLink="/emails" class="quick-link"><lucide-icon [img]="Mail" class="quick-link-icon"></lucide-icon> Email</a>
            <a *ngIf="canRead('Meetings')" routerLink="/meetings" class="quick-link"><lucide-icon [img]="Video" class="quick-link-icon"></lucide-icon> Meeting</a>
          </div>
        </div>

      </div>

      <!-- Loading -->
      <div class="flex-center" style="padding:3rem" *ngIf="loading()">
        <div class="spinner"></div>
      </div>

      <ng-container *ngIf="!loading() && data()">

        <!-- KPI Cards — All Clickable -->
        <div class="stats-grid mb-4">
          <div class="stat-card clickable-card" routerLink="/customers" title="View all customers" *ngIf="canRead('Customers')">
            <div class="stat-value">{{data()!.totalContacts | number}}</div>
            <div class="stat-label">Total Customers</div>
            <div class="stat-icon"><lucide-icon [img]="Users"></lucide-icon></div>
            <div class="stat-trend"><lucide-icon [img]="ArrowRight" class="trend-icon"></lucide-icon></div>
          </div>
          <div class="stat-card clickable-card" routerLink="/leads" title="View all leads" *ngIf="canRead('Leads')">
            <div class="stat-value">{{data()!.totalLeads | number}}</div>
            <div class="stat-label">Total Leads</div>
            <div class="stat-icon"><lucide-icon [img]="Target"></lucide-icon></div>
            <div class="stat-trend"><lucide-icon [img]="ArrowRight" class="trend-icon"></lucide-icon></div>
          </div>
          <div class="stat-card clickable-card" routerLink="/deals" title="View all deals" *ngIf="canRead('Deals')">
            <div class="stat-value">{{data()!.totalDeals | number}}</div>
            <div class="stat-label">Active Deals</div>
            <div class="stat-icon"><lucide-icon [img]="CircleDollarSign"></lucide-icon></div>
            <div class="stat-trend"><lucide-icon [img]="ArrowRight" class="trend-icon"></lucide-icon></div>
          </div>
          <div class="stat-card clickable-card" routerLink="/tasks" title="View open tasks" *ngIf="canRead('Tasks')">
            <div class="stat-value">{{data()!.openTasks | number}}</div>
            <div class="stat-label">Open Tasks</div>
            <div class="stat-icon"><lucide-icon [img]="CheckSquare"></lucide-icon></div>
            <div class="stat-trend"><lucide-icon [img]="ArrowRight" class="trend-icon"></lucide-icon></div>
          </div>
          <ng-container *ngIf="isAdminOrManager()">
            <div class="stat-card clickable-card" routerLink="/reports" title="View pipeline report">
              <div class="stat-value">₹{{data()!.totalPipelineValue | number:'1.0-0'}}</div>
              <div class="stat-label">Pipeline Value</div>
              <div class="stat-icon"><lucide-icon [img]="TrendingUp"></lucide-icon></div>
              <div class="stat-trend"><lucide-icon [img]="ArrowRight" class="trend-icon"></lucide-icon></div>
            </div>
            <div class="stat-card clickable-card" routerLink="/reports" title="View lead report">
              <div class="stat-value">{{data()!.leadConversionRate}}%</div>
              <div class="stat-label">Lead Conversion</div>
              <div class="stat-icon"><lucide-icon [img]="Rocket"></lucide-icon></div>
              <div class="stat-trend"><lucide-icon [img]="ArrowRight" class="trend-icon"></lucide-icon></div>
            </div>
            <div class="stat-card clickable-card" routerLink="/reports" title="View win rate report">
              <div class="stat-value">{{data()!.dealWinRate}}%</div>
              <div class="stat-label">Win Rate</div>
              <div class="stat-icon"><lucide-icon [img]="Trophy"></lucide-icon></div>
              <div class="stat-trend"><lucide-icon [img]="ArrowRight" class="trend-icon"></lucide-icon></div>
            </div>
          </ng-container>
          <div class="stat-card clickable-card" routerLink="/tasks" title="View overdue tasks" [class.danger-card]="data()!.overdueTasks > 0" *ngIf="canRead('Tasks')">
            <div class="stat-value" [class.text-danger]="data()!.overdueTasks > 0">
              {{data()!.overdueTasks | number}}
            </div>
            <div class="stat-label">Overdue Tasks</div>
            <div class="stat-icon"><lucide-icon [img]="AlertTriangle"></lucide-icon></div>
            <div class="stat-trend"><lucide-icon [img]="ArrowRight" class="trend-icon"></lucide-icon></div>
          </div>
        </div>

        <!-- Main Dashboard Layout Grid -->
        <div class="dashboard-grid mb-4">
          
          <!-- LEFT COLUMN (Main Content) -->
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            
            <!-- Revenue Chart (Admin Only) -->
            <div class="card" *ngIf="isAdmin()">
              <div class="flex-between mb-4">
                <div>
                  <h3>Revenue Growth (This Year)</h3>
                  <p class="text-muted text-sm">Monthly: Orders Billed vs Payments Collected</p>
                </div>
                <div class="flex gap-2 items-center">
                  <span class="badge badge-purple">{{salesData()?.period || currentYear}}</span>
                  <a routerLink="/reports" class="btn btn-secondary btn-sm">Full Report →</a>
                </div>
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
                  <div style="text-align:center">
                    <div style="font-size:3rem; opacity:0.3; margin-bottom:1rem;">📊</div>
                    <div>No sales data available for this year yet.</div>
                    <a routerLink="/deals" class="btn btn-primary btn-sm mt-4">Add Your First Deal →</a>
                  </div>
                </div>
              </ng-template>
            </div>

            <!-- Top Open Deals (Moved Up) -->
            <ng-container *ngIf="canRead('Deals')">
              <div class="card" style="flex: 1;" *ngIf="data()!.topDeals?.length; else topDealsPlaceholder">
                <div class="flex-between mb-4">
                  <h3>Top Open Deals</h3>
                  <a routerLink="/deals" class="btn btn-secondary btn-sm">View All →</a>
                </div>
                <!-- Switched to more compact grid for the left column layout -->
                <div class="deal-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                  <div class="deal-item" *ngFor="let deal of data()!.topDeals | slice:0:4; let i = index">
                    <div class="deal-rank">{{i+1}}</div>
                    <div class="deal-info">
                      <div class="deal-title">{{deal.title}}</div>
                      <div class="deal-company text-muted text-sm">{{deal.companyName || '—'}}</div>
                    </div>
                    <div class="deal-right">
                      <div class="deal-value">₹{{deal.value | number:'1.0-0'}}</div>
                      <div class="badge badge-purple">{{deal.stageName}}</div>
                    </div>
                  </div>
                </div>
              </div>
              <ng-template #topDealsPlaceholder>
                <div class="card" style="flex: 1;">
                  <div class="flex-between mb-4">
                    <h3>Top Open Deals</h3>
                  </div>
                  <p class="text-muted text-sm">No open deals yet. <a *ngIf="canCreate('Deals')" routerLink="/deals">Create one →</a></p>
                </div>
              </ng-template>
            </ng-container>

          </div>

          <!-- RIGHT COLUMN (Sidebar area) -->
          <div style="display: flex; flex-direction: column;">
            <!-- Recent Activity (Moved to Sidebar) -->
            <div class="card" style="flex: 1; display: flex; flex-direction: column;">
              <div class="flex-between mb-4">
                <h3>Recent Activity</h3>
              </div>
              
              <div class="activity-timeline">
                 <div *ngIf="!recentActivities || recentActivities.length === 0" class="text-muted text-sm p-4">No recent activity detected.</div>
                <div class="activity-item clickable-activity" *ngFor="let act of recentActivities | slice:0:6" (click)="navigateToTarget(act.action)" title="Click to view details">
                  <div class="avatar" style="width: 2.25rem; height: 2.25rem;">{{act.user}}</div>
                  <div class="activity-content">
                    <div class="activity-text">
                      <strong>{{act.name}}</strong> {{act.action}} 
                      <span style="color: var(--text-primary); font-weight: 500;">{{act.target}}</span>
                    </div>
                    <div class="activity-time">{{act.time}}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </ng-container>

    </div>
  `,
  styles: [`
    .stats-grid { display: grid; gap: 1rem; grid-template-columns: repeat(8, minmax(0, 1fr)); }
    @media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
    @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    .text-danger { color: var(--danger) !important; }
    .text-success { color: var(--success) !important; }

    /* Clickable stat cards */
    .clickable-card {
      cursor: pointer; position: relative; overflow: hidden;
      transition: all 0.2s ease !important;
    }
    .clickable-card:hover { 
      transform: translateY(-3px) !important; 
      box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
      border-color: var(--accent) !important;
    }
    .stat-trend {
      position: absolute; bottom: 0.75rem; right: 0.75rem;
      opacity: 0; transform: translateX(-4px); transition: all 0.2s;
    }
    .clickable-card:hover .stat-trend { opacity: 1; transform: translateX(0); }
    .trend-icon { width: 14px; height: 14px; color: var(--accent); }
    .danger-card { border-color: rgba(239,68,68,0.4) !important; background: rgba(239,68,68,0.03) !important; }

    .dashboard-grid { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 1rem; }
    @media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }

    .deal-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .deal-item { display: flex; justify-content: space-between; align-items: center;
      padding: 0.875rem 1rem; background: var(--bg-card); border-radius: 12px;
      border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      transition: var(--transition); gap: 0.75rem;
      &:hover { border-color: var(--accent); transform: translateX(2px); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    }
    .deal-rank { width: 24px; height: 24px; border-radius: 50%; background: rgba(124,58,237,0.1); color: var(--accent); font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .deal-info { flex: 1; }
    .deal-title { font-weight: 700; font-size: 0.9rem; color: var(--text-primary); margin-bottom: 0.25rem; }
    .deal-right { text-align: right; display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-end; }
    .deal-value { font-weight: 800; color: var(--text-primary); font-size: 1.05rem; }

    .quick-actions-bar { padding: 1rem 1.5rem; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
    .quick-links-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .quick-link { display: flex; align-items: center; justify-content: center; padding: 0.6rem 1rem; background: var(--bg-secondary);
      border: 1px solid var(--border); border-radius: 9999px;
      font-size: 0.85rem; font-weight: 600; color: var(--text-primary); text-decoration: none;
      transition: var(--transition);
      &:hover { border-color: var(--accent); color: var(--accent); background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transform: translateY(-2px); }
    }
    .spinner { width: 36px; height: 36px; border: 3px solid var(--border);
      border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Activity Timeline */
    .activity-timeline { display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem; flex: 1; max-height: 290px; overflow-y: auto; padding-right: 0.5rem; }
    .activity-timeline::-webkit-scrollbar { width: 4px; }
    .activity-timeline::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
    .activity-item { display: flex; gap: 0.875rem; align-items: flex-start; transition: all 0.2s; padding: 0.25rem; border-radius: 8px;}
    .clickable-activity { cursor: pointer; }
    .clickable-activity:hover { background: rgba(124, 58, 237, 0.05); transform: translateX(2px); }
    .activity-content { flex: 1; padding-bottom: 0.75rem; border-bottom: 1px solid var(--bg-secondary); }
    .activity-item:last-child .activity-content { border-bottom: none; padding-bottom: 0; }
    .activity-text { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; }
    .activity-time { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; font-weight: 500;}
    .quick-link-icon { width: 14px; height: 14px; margin-right: 4px; }
    .mt-4 { margin-top: 1rem; }
  `]
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  data = signal<DashboardData | null>(null);
  salesData = signal<SalesReport | null>(null);
  isAdminOrManager = signal(false);
  currentYear = new Date().getFullYear();

  recentActivities: any[] = [];

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
  readonly ArrowRight = ArrowRight;
  readonly Activity = Activity;

  // Chart configuration
  public barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { font: { size: 11 }, boxWidth: 12, padding: 12 }
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val: number) => val >= 1000 ? `₹${(val / 1000).toFixed(1)}K` : `₹${val}`
        },
        grid: { color: 'rgba(0,0,0,0.04)' }
      },
      x: { grid: { display: false } }
    }
  };

  public monthlyRevenueChartData: any = { labels: [], datasets: [] };

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.isAdminOrManager.set(this.authService.isManager());
    this.load();
  }

  userName() {
    const u = this.authService.getCurrentUser();
    return u ? u.firstName : '';
  }

  userRoleDisplay() {
    const roles = this.authService.getCurrentUser()?.roles || [];
    if (roles.includes('Admin')) return 'Global Administration';
    if (roles.includes('Manager')) return 'Manager & Team';
    return 'Sales Representative';
  }

  canRead(module: string): boolean {
    return this.authService.hasPermission(module, 'Read');
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  canCreate(module: string): boolean {
    return this.authService.hasPermission(module, 'Create');
  }

  navigateToTarget(action: string) {
    if (!action) return;
    const lower = action.toLowerCase();
    if (lower.includes('task')) this.router.navigate(['/tasks']);
    else if (lower.includes('deal')) this.router.navigate(['/deals']);
    else if (lower.includes('lead')) this.router.navigate(['/leads']);
    else if (lower.includes('customer')) this.router.navigate(['/customers']);
    else if (lower.includes('product')) this.router.navigate(['/products']);
    else if (lower.includes('company')) this.router.navigate(['/companies']);
    else if (lower.includes('order')) this.router.navigate(['/orders']);
  }

  load() {
    this.loading.set(true);

    this.reportService.getDashboard().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });

    this.reportService.getRecentActivity().subscribe(res => {
      this.recentActivities = res;
    });

    if (this.isAdminOrManager()) {
      // Use real Orders + Payments data instead of deals (which need ActualCloseDate)
      this.http.get<any>(`${environment.apiUrl}/reports/business-summary?year=${this.currentYear}`)
        .subscribe(res => {
          if (res?.monthlyBreakdown) {
            const months = res.monthlyBreakdown.map((m: any) => m.month);
            const billed    = res.monthlyBreakdown.map((m: any) => m.orderValue);
            const collected = res.monthlyBreakdown.map((m: any) => m.collectedAmt);

            const hasData = billed.some((v: number) => v > 0) || collected.some((v: number) => v > 0);
            if (hasData) {
              this.monthlyRevenueChartData = {
                labels: months,
                datasets: [
                  {
                    label: 'Billed (Orders)',
                    data: billed,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)', // Professional Blue
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    barThickness: 12, // Thin bars
                    borderSkipped: false
                  },
                  {
                    label: 'Collected (Payments)',
                    data: collected,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)', // Emerald Green
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    barThickness: 12, // Thin bars
                    borderSkipped: false
                  }
                ]
              };
            }
          }
        });
    }
  }
}
