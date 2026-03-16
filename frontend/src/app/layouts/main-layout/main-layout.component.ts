import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  LucideAngularModule,
  LayoutDashboard, Users, Target, CircleDollarSign,
  CheckSquare, Calendar, Mail, FileText, MessageSquare,
  Video, Headset, BarChart2, Settings, Zap,
  ArrowLeftFromLine, ArrowRightFromLine, LogOut, Bell
} from 'lucide-angular';
import { ToastComponent } from '../../shared/components/toast/toast.component';

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
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, ToastComponent],
  template: `
    <div class="shell" [class.sidebar-collapsed]="collapsed()">
      <!-- ─── Sidebar ─── -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo" *ngIf="!collapsed()">
            <lucide-icon [img]="Zap" class="logo-icon text-accent-light"></lucide-icon>
            <span class="logo-text">Dhwiti CRM</span>
          </div>
          <lucide-icon [img]="Zap" *ngIf="collapsed()" class="logo-icon-only text-accent-light"></lucide-icon>
          <button class="collapse-btn flex-center" (click)="collapsed.set(!collapsed())">
            <lucide-icon [img]="collapsed() ? ArrowRightFromLine : ArrowLeftFromLine" class="w-4 h-4 m-0"></lucide-icon>
          </button>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section" *ngFor="let section of navSections">
            <span class="nav-section-label" *ngIf="!collapsed()">{{ section.label }}</span>
            <ng-container *ngFor="let item of section.items">
              <a *ngIf="canSeeItem(item)"
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

        <div class="sidebar-footer">
          <div class="user-info" *ngIf="!collapsed()">
            <div class="avatar avatar-sm">{{ userInitials() }}</div>
            <div class="user-details">
              <div class="user-name">{{ userName() }}</div>
              <div class="user-role">{{ userRole() }}</div>
            </div>
          </div>
          <button class="logout-btn flex-center" (click)="logout()" [title]="'Logout'">
            <lucide-icon [img]="LogOut" class="w-4 h-4"></lucide-icon>
            <span *ngIf="!collapsed()">Logout</span>
          </button>
        </div>
      </aside>

      <!-- ─── Main Content ─── -->
      <div class="main-area">
        <!-- Topbar -->
        <header class="topbar">
          <div class="topbar-left">
            <h1 class="page-title-header">{{ currentPage() }}</h1>
          </div>
          <div class="topbar-right">
            <button class="topbar-btn flex-center" title="Notifications">
              <lucide-icon [img]="Bell" class="w-5 h-5"></lucide-icon>
            </button>
            <div class="topbar-avatar">
              <div class="avatar avatar-sm">{{ userInitials() }}</div>
              <span class="topbar-name">{{ userName() }}</span>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="content-area">
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- Global Toast Notifications -->
    <app-toast></app-toast>
  `,
  styles: [`
    .shell {
      display: flex; height: 100vh; overflow: hidden;
      --sw: var(--sidebar-width);
      &.sidebar-collapsed { --sw: 64px; }
    }

    /* ─── Sidebar ─── */
    .sidebar {
      width: var(--sw); min-width: var(--sw);
      background: var(--bg-secondary);
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column;
      transition: all 0.25s ease;
      overflow: hidden; z-index: 100;
    }

    .sidebar-header {
      padding: 1rem;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid var(--border); min-height: 64px;
    }
    .logo {
      display: flex; align-items: center; gap: 0.5rem;
      .logo-icon { color: var(--accent-light); }
      .logo-text  { font-size: 1rem; font-weight: 800; color: var(--accent-light); white-space: nowrap; }
    }
    .logo-icon-only { color: var(--accent-light); margin: auto; }

    .collapse-btn {
      background: var(--bg-hover); border: 1px solid var(--border);
      color: var(--text-secondary); border-radius: 6px;
      width: 28px; height: 28px; cursor: pointer; font-size: 0.75rem;
      display: flex; align-items: center; justify-content: center;
      transition: var(--transition); flex-shrink: 0;
      &:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
    }

    .sidebar-nav {
      flex: 1; overflow-y: auto; padding: 0.75rem 0.5rem;
      display: flex; flex-direction: column; gap: 0.25rem;
    }
    .nav-section { margin-bottom: 0.5rem; }
    .nav-section-label {
      font-size: 0.65rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 1px; color: var(--text-muted);
      padding: 0.5rem 0.75rem 0.25rem;
    }

    .nav-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.6rem 0.75rem; border-radius: var(--radius-sm);
      color: var(--text-secondary); text-decoration: none;
      transition: var(--transition); font-size: 0.875rem; font-weight: 500;
      white-space: nowrap; overflow: hidden;
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
      &.active { background: rgba(124,58,237,0.15); color: var(--accent-light);
        border-left: 2px solid var(--accent); }
    }
    .nav-icon   { font-size: 1.1rem; flex-shrink: 0; }
    .nav-label  { flex: 1; }
    .nav-badge  {
      background: var(--accent); color: #fff;
      font-size: 0.65rem; font-weight: 700;
      padding: 0.15rem 0.4rem; border-radius: 10px; min-width: 18px; text-align: center;
    }

    .sidebar-footer {
      padding: 0.75rem; border-top: 1px solid var(--border);
      display: flex; flex-direction: column; gap: 0.5rem;
    }
    .user-info {
      display: flex; align-items: center; gap: 0.6rem;
      padding: 0.5rem; overflow: hidden;
    }
    .user-details { overflow: hidden;
      .user-name { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .user-role { font-size: 0.7rem; color: var(--text-muted); }
    }
    .logout-btn {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);
      background: none; border: 1px solid var(--border);
      color: var(--text-muted); cursor: pointer; font-size: 0.8rem;
      transition: var(--transition); width: 100%;
      &:hover { background: rgba(239,68,68,0.1); border-color: var(--danger); color: var(--danger); }
    }

    /* ─── Main Area ─── */
    .main-area {
      flex: 1; display: flex; flex-direction: column; overflow: hidden;
    }

    .topbar {
      height: var(--header-height); min-height: var(--header-height);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1.5rem;
      background: var(--bg-secondary); border-bottom: 1px solid var(--border);
      gap: 1rem;
    }
    .topbar-left { display: flex; align-items: center; gap: 1rem; }
    .topbar-right { display: flex; align-items: center; gap: 0.75rem; }
    .page-title-header { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }

    .topbar-btn {
      background: var(--bg-hover); border: 1px solid var(--border);
      border-radius: var(--radius-sm); padding: 0.4rem 0.6rem;
      cursor: pointer; font-size: 1rem; transition: var(--transition);
      color: var(--text-secondary);
      &:hover { border-color: var(--accent); color: var(--accent-light); }
    }
    .topbar-avatar {
      display: flex; align-items: center; gap: 0.5rem;
      .topbar-name { font-size: 0.875rem; font-weight: 500; }
    }

    .content-area {
      flex: 1; overflow-y: auto; padding: 1.5rem;
      background: var(--bg-primary);
    }

    .text-accent-light { color: var(--accent-light); }
  `]
})
export class MainLayoutComponent {
  collapsed = signal(false);

  readonly Zap = Zap;
  readonly ArrowLeftFromLine = ArrowLeftFromLine;
  readonly ArrowRightFromLine = ArrowRightFromLine;
  readonly LogOut = LogOut;
  readonly Bell = Bell;

  navSections: NavSection[] = [
    {
      label: 'Main',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['Admin', 'Manager', 'Sales Rep'] },
        { label: 'Contacts', icon: Users, path: '/contacts', roles: ['Admin', 'Manager', 'Sales Rep', 'Support Agent', 'Viewer'] },
        { label: 'Leads', icon: Target, path: '/leads', roles: ['Admin', 'Manager', 'Sales Rep'] },
        { label: 'Deals', icon: CircleDollarSign, path: '/deals', roles: ['Admin', 'Manager', 'Sales Rep'] },
      ]
    },
    {
      label: 'Work',
      items: [
        { label: 'Tasks', icon: CheckSquare, path: '/tasks', roles: ['Admin', 'Manager', 'Sales Rep', 'Support Agent', 'Viewer'] },
        { label: 'Calendar', icon: Calendar, path: '/calendar', roles: ['Admin', 'Manager', 'Sales Rep', 'Support Agent', 'Viewer'] },
        { label: 'Emails', icon: Mail, path: '/emails', roles: ['Admin', 'Manager', 'Sales Rep', 'Support Agent'] },
        { label: 'Notes', icon: FileText, path: '/notes', roles: ['Admin', 'Manager', 'Sales Rep', 'Support Agent', 'Viewer'] },
      ]
    },
    {
      label: 'Communication',
      items: [
        { label: 'Team Chat', icon: MessageSquare, path: '/chat', roles: ['Admin', 'Manager', 'Sales Rep', 'Support Agent', 'Viewer'] },
        { label: 'Meetings', icon: Video, path: '/meetings', roles: ['Admin', 'Manager', 'Sales Rep', 'Viewer'] },
        { label: 'Live Chat', icon: Headset, path: '/live-chat', roles: ['Admin', 'Manager', 'Sales Rep', 'Support Agent'] },
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

  constructor(private auth: AuthService, private router: Router) { }

  canSeeItem(item: NavItem): boolean {
    if (!item.roles?.length) return true;
    const userRoles = this.auth.getCurrentUser()?.roles ?? [];
    return item.roles.some(r => userRoles.includes(r));
  }

  logout() { this.auth.logout(); }

  userName(): string {
    const u = this.auth.getCurrentUser();
    return u ? `${u.firstName} ${u.lastName}` : '';
  }

  userInitials(): string {
    const u = this.auth.getCurrentUser();
    return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '?';
  }

  userRole(): string {
    return this.auth.getCurrentUser()?.roles?.[0] ?? '';
  }

  currentPage(): string {
    const path = this.router.url.split('/')[1];
    const map: Record<string, string> = {
      dashboard: 'Dashboard', contacts: 'Contacts', leads: 'Leads', deals: 'Deals',
      tasks: 'Tasks', calendar: 'Calendar', emails: 'Emails', notes: 'Notes',
      chat: 'Team Chat', meetings: 'Meetings', 'live-chat': 'Live Chat',
      reports: 'Reports', settings: 'Settings'
    };
    return map[path] ?? 'Dhwiti CRM';
  }
}
