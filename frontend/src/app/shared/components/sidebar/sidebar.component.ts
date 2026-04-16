import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs';
import {
  LucideAngularModule, Zap, LayoutDashboard, Users, Target, CircleDollarSign,
  CheckSquare, Calendar, Mail, FileText, MessageSquare, Video, Headset,
  BarChart2, Settings, LogOut, ChevronLeft, ChevronRight,
  Building2, UserCheck, Package, ShoppingCart, Receipt, CreditCard
} from 'lucide-angular';

interface NavItem {
  label: string;
  icon: any;
  path: string;
  roles?: string[];
  badge?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <!-- Logo -->
      <div class="sidebar-top">
        <div class="logo" *ngIf="!collapsed()">
          <lucide-icon [img]="Zap" class="logo-icon fill-accent" style="width:1.5rem;height:1.5rem"></lucide-icon>
          <span class="logo-text">Dhwiti CRM</span>
        </div>
        <lucide-icon *ngIf="collapsed()" [img]="Zap" class="logo-icon-only fill-accent" style="width:1.5rem;height:1.5rem"></lucide-icon>
        <button class="collapse-btn flex-center" (click)="collapsed.set(!collapsed())" [title]="collapsed() ? 'Expand' : 'Collapse'">
          <lucide-icon [img]="collapsed() ? ChevronRight : ChevronLeft" class="w-4 h-4"></lucide-icon>
        </button>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <div class="nav-section" *ngFor="let sec of navSections">
          <div class="nav-section-label" *ngIf="!collapsed()">{{ sec.label }}</div>
          <ng-container *ngFor="let item of sec.items">
            <a *ngIf="canSee(item)"
               [routerLink]="item.path"
               routerLinkActive="active"
               class="nav-item"
               [title]="item.label">
              <span class="nav-icon flex-center">
                <lucide-icon [img]="item.icon" class="w-5 h-5"></lucide-icon>
              </span>
              <span class="nav-label" *ngIf="!collapsed()">{{ item.label }}</span>
              <span class="nav-badge" *ngIf="item.badge && !collapsed()">{{ item.badge }}</span>
            </a>
          </ng-container>
        </div>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="user-chip" *ngIf="!collapsed()">
          <div class="avatar-sm">{{ initials() }}</div>
          <div class="user-details">
            <div class="u-name">{{ name() }}</div>
            <div class="u-role">{{ role() }}</div>
          </div>
        </div>
        <button class="logout-btn flex-center" (click)="logout()" title="Logout">
          <lucide-icon [img]="LogOut" class="w-4 h-4"></lucide-icon>
          <span *ngIf="!collapsed()">Logout</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width, 220px);
      min-width: var(--sidebar-width, 220px);
      background: var(--bg-secondary);
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column;
      transition: all 0.25s ease;
      overflow: hidden; z-index: 200;
      &.collapsed { width: 64px; min-width: 64px; }
    }
    .sidebar-top {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem; border-bottom: 1px solid var(--border); min-height: 64px;
    }
    .logo { display: flex; align-items: center; gap: 0.5rem; }
    .logo-text { font-size: 1rem; font-weight: 800; color: var(--accent-light); white-space: nowrap; }
    .logo-icon-only { margin: auto; }
    .collapse-btn {
      background: var(--bg-hover); border: 1px solid var(--border); border-radius: 6px;
      width: 28px; height: 28px; cursor: pointer; color: var(--text-secondary);
      transition: var(--transition); flex-shrink: 0;
      &:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
    }
    .sidebar-nav { flex: 1; overflow-y: auto; padding: 0.75rem 0.5rem; display: flex; flex-direction: column; gap: 0.25rem; }
    .nav-section { margin-bottom: 0.5rem; }
    .nav-section-label {
      font-size: 0.63rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 1px; color: var(--text-muted); padding: 0.5rem 0.75rem 0.25rem;
    }
    .nav-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.6rem 0.75rem; border-radius: var(--radius-sm);
      color: var(--text-secondary); text-decoration: none;
      transition: var(--transition); font-size: 0.875rem; font-weight: 500;
      white-space: nowrap; overflow: hidden;
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
      &.active { background: rgba(124,58,237,0.15); color: var(--accent-light); border-left: 2px solid var(--accent); }
    }
    .nav-icon { flex-shrink: 0; }
    .nav-label { flex: 1; }
    .nav-badge {
      background: var(--accent); color: #fff;
      font-size: 0.65rem; font-weight: 700;
      padding: 0.15rem 0.4rem; border-radius: 10px; min-width: 18px; text-align: center;
    }
    .sidebar-footer { padding: 0.75rem; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.5rem; }
    .user-chip { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem; overflow: hidden; }
    .avatar-sm {
      width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--info));
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.75rem;
    }
    .user-details { overflow: hidden; }
    .u-name { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .u-role { font-size: 0.7rem; color: var(--text-muted); }
    .logout-btn {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);
      background: none; border: 1px solid var(--border);
      color: var(--text-muted); cursor: pointer; font-size: 0.8rem;
      transition: var(--transition); width: 100%;
      &:hover { background: rgba(239,68,68,0.1); border-color: var(--danger); color: var(--danger); }
    }
    .fill-accent { color: var(--accent-light); }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  collapsed = signal(false);

  readonly Zap = Zap;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly LogOut = LogOut;

  navSections: NavSection[] = [
    {
      label: 'Main',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['Admin', 'Manager', 'Sales Rep'] },
        { label: 'Leads', icon: Target, path: '/leads', roles: ['Admin', 'Manager', 'Sales Rep'] },
        { label: 'Deals', icon: CircleDollarSign, path: '/deals', roles: ['Admin', 'Manager', 'Sales Rep'] },
      ]
    },
    {
      label: 'B2B CRM',
      items: [
        { label: 'Companies', icon: Building2, path: '/companies', roles: ['Admin', 'Manager', 'Sales Rep', 'Viewer'] },
        { label: 'Customers', icon: UserCheck, path: '/customers', roles: ['Admin', 'Manager', 'Sales Rep', 'Viewer', 'Support Agent'] }
      ]
    },
    {
      label: 'Sales & Inventory',
      items: [
        { label: 'Products', icon: Package, path: '/products', roles: ['Admin', 'Manager', 'Sales Rep'] },
        { label: 'Orders', icon: ShoppingCart, path: '/orders', roles: ['Admin', 'Manager', 'Sales Rep'] },
        { label: 'Invoices', icon: Receipt, path: '/invoices', roles: ['Admin', 'Manager', 'Sales Rep'] },
        { label: 'Payments', icon: CreditCard, path: '/payments', roles: ['Admin', 'Manager', 'Sales Rep'] }
      ]
    },
    {
      label: 'Work',
      items: [
        { label: 'Tasks', icon: CheckSquare, path: '/tasks', roles: ['Admin', 'Manager', 'Sales Rep', 'Support Agent', 'Viewer'] },
        { label: 'Emails', icon: Mail, path: '/emails', roles: ['Admin', 'Manager', 'Sales Rep', 'Support Agent'] }
      ]
    },
    {
      label: 'Communication',
      items: [
        { label: 'Meetings', icon: Video, path: '/meetings', roles: ['Admin', 'Manager', 'Sales Rep', 'Viewer'] }
      ]
    },
    {
      label: 'Insights',
      items: [
        { label: 'Reports', icon: BarChart2, path: '/reports', roles: ['Admin', 'Manager'] },
        { label: 'Settings', icon: Settings, path: '/settings', roles: ['Admin'] },
      ]
    }
  ];

  constructor(private auth: AuthService) { }

  ngOnInit(): void { }
  ngOnDestroy(): void { }

  canSee(item: NavItem): boolean {
    if (!item.roles?.length) return true;
    const userRoles = this.auth.getCurrentUser()?.roles ?? [];
    return item.roles.some(r => userRoles.includes(r));
  }

  name(): string {
    const u = this.auth.getCurrentUser();
    return u ? `${u.firstName} ${u.lastName}` : '';
  }

  initials(): string {
    const u = this.auth.getCurrentUser();
    return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '?';
  }

  role(): string {
    return this.auth.getCurrentUser()?.roles?.[0] ?? '';
  }

  logout(): void {
    this.auth.logout();
  }
}
