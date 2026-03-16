import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService, DashboardData } from '../reports/services/report.service';

import { LucideAngularModule, LayoutDashboard, RefreshCw, Users, Target, CircleDollarSign, CheckSquare, TrendingUp, Rocket, Trophy, AlertTriangle, Flame, Plus, Mail, Video, BarChart2 } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
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

        <!-- Bottom Grid -->
        <div class="dashboard-grid">
          <!-- Top Deals -->
          <div class="card">
            <div class="flex-between mb-4">
              <h3>Top Open Deals</h3>
              <a routerLink="/deals" class="btn btn-secondary btn-sm">View All →</a>
            </div>
            <div class="deal-list" *ngIf="data()!.topDeals?.length; else noDeals">
              <div class="deal-item" *ngFor="let deal of data()!.topDeals">
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
            <ng-template #noDeals>
              <p class="text-muted text-sm">No open deals yet. <a routerLink="/deals">Create one →</a></p>
            </ng-template>
          </div>

          <!-- Quick Stats -->
          <div class="card">
            <h3 class="mb-4">Quick Stats</h3>
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
              <div class="quick-stat">
                <span class="text-muted">Overdue Tasks</span>
                <strong [class.text-danger]="data()!.overdueTasks > 0">{{data()!.overdueTasks}}</strong>
              </div>
            </div>

            <div class="quick-links mt-6">
              <h4 class="mb-2" style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Quick Actions</h4>
              <div class="quick-links-grid">
                <a routerLink="/customers" class="quick-link"><lucide-icon [img]="Plus" class="quick-link-icon"></lucide-icon> New Customer</a>
                <a routerLink="/leads" class="quick-link"><lucide-icon [img]="Target" class="quick-link-icon"></lucide-icon> New Lead</a>
                <a routerLink="/deals" class="quick-link"><lucide-icon [img]="CircleDollarSign" class="quick-link-icon"></lucide-icon> New Deal</a>
                <a routerLink="/tasks" class="quick-link"><lucide-icon [img]="CheckSquare" class="quick-link-icon"></lucide-icon> New Task</a>
                <a routerLink="/emails" class="quick-link"><lucide-icon [img]="Mail" class="quick-link-icon"></lucide-icon> Send Email</a>
                <a routerLink="/meetings" class="quick-link"><lucide-icon [img]="Video" class="quick-link-icon"></lucide-icon> New Meeting</a>
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
      padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      &:hover { border-color: var(--border-accent); }
    }
    .deal-title { font-weight: 600; font-size: 0.875rem; }
    .deal-right { text-align: right; display: flex; flex-direction: column; gap: 0.25rem; align-items: flex-end; }
    .deal-value { font-weight: 700; color: var(--success); }

    .quick-stat-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .quick-stat { display: flex; justify-content: space-between; align-items: center;
      padding: 0.5rem 0; border-bottom: 1px solid var(--border); font-size: 0.875rem;
      &:last-child { border-bottom: none; }
    }
    .quick-links-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
    .quick-link { display: block; padding: 0.5rem 0.75rem; background: var(--bg-secondary);
      border: 1px solid var(--border); border-radius: var(--radius-sm);
      font-size: 0.8rem; color: var(--text-secondary); text-decoration: none;
      transition: var(--transition); text-align: center;
      &:hover { border-color: var(--accent); color: var(--accent-light); background: rgba(124,58,237,0.1); }
    }
    .spinner { width: 36px; height: 36px; border: 3px solid var(--border);
      border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  data = signal<DashboardData | null>(null);

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

  constructor(private reportService: ReportService) { }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.reportService.getDashboard().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }
}
