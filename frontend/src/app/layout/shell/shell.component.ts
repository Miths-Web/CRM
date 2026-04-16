import { Component, signal, HostListener, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { LucideAngularModule, Zap, ArrowLeftFromLine, ArrowRightFromLine, LogOut, Bell, LayoutDashboard, Users, Target, CircleDollarSign, CheckSquare, Calendar, Mail, FileText, MessageSquare, Video, Headset, BarChart2, Settings, Building2, UserCheck, Package, ShoppingCart, Receipt, CreditCard, X, Camera, Trash2, Eye, Ticket, BookOpen } from 'lucide-angular';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ReportService } from '../../features/reports/services/report.service';

interface NavItem {
  label: string; icon: any; path: string;
  roles?: string[]; badge?: number;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, ToastComponent],
  template: `
    <div class="shell" [class.sidebar-collapsed]="collapsed()">
      <!-- ─── Sidebar ─── -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <a (click)="reloadPage()" class="logo" *ngIf="!collapsed()" style="cursor: pointer;">
            <img src="logo.png" alt="Dhwiti CRM" class="main-logo-img" />
          </a>
          <a (click)="reloadPage()" class="logo-icon-only flex-center" *ngIf="collapsed()" style="cursor: pointer;">
            <img src="logo.png" alt="D" class="collapsed-logo-img" />
          </a>
          <button class="collapse-btn flex-center" (click)="collapsed.set(!collapsed())">
            <lucide-icon [img]="collapsed() ? ArrowRightFromLine : ArrowLeftFromLine" class="w-4 h-4"></lucide-icon>
          </button>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section" *ngFor="let section of navSections">
            <ng-container *ngIf="canSeeSection(section)">
              <span class="nav-section-label" *ngIf="!collapsed()">{{section.label}}</span>
              <ng-container *ngFor="let item of section.items">
                <a *ngIf="canSeeItem(item)"
                   [routerLink]="item.path"
                   routerLinkActive="active"
                   class="nav-item"
                   [title]="item.label">
                  <span class="nav-icon flex-center"><lucide-icon [img]="item.icon" class="w-5 h-5"></lucide-icon></span>
                  <span class="nav-label" *ngIf="!collapsed()">{{item.label}}</span>
                  <span class="nav-badge" *ngIf="$any(item).badge && !collapsed()">{{$any(item).badge}}</span>
                </a>
              </ng-container>
            </ng-container>
          </div>
        </nav>

              <div class="sidebar-footer">
                <div class="user-info" *ngIf="!collapsed()">
                  <ng-container *ngIf="!userAvatar()"><div class="avatar avatar-sm">{{userInitials()}}</div></ng-container>
                  <img *ngIf="userAvatar()" [src]="userAvatar()" class="avatar avatar-sm" style="object-fit:cover; padding:0" />
                  <div class="user-details">
                    <div class="user-name">{{userName()}}</div>
                    <div class="user-role">{{userRole()}}</div>
                  </div>
                </div>
          <button class="logout-btn flex items-center" (click)="logout()" [title]="'Logout'">
            <lucide-icon [img]="LogOut" class="w-4 h-4"></lucide-icon>
            <span *ngIf="!collapsed()">Logout</span>
          </button>
        </div>
      </aside>

      <!-- ─── Main Content ─── -->
      <div class="main-area">
        <!-- Header -->
        <header class="topbar">
          <div class="topbar-left">
            <h1 class="page-title-header">{{currentPage()}}</h1>
          </div>
          <div class="topbar-right">

            <!-- Notifications Bell -->
            <div class="topbar-dropdown-wrap">
              <button class="topbar-btn flex-center notification-btn" title="Notifications"
                (click)="toggleNotifications($event)">
                <lucide-icon [img]="Bell" class="w-5 h-5"></lucide-icon>
                <span class="notif-dot" *ngIf="unreadNotifs() > 0">{{unreadNotifs()}}</span>
              </button>
              <!-- Notification Dropdown -->
              <div class="topbar-dropdown notif-dropdown" *ngIf="showNotifPanel()">
                <div class="dropdown-header">
                  <span>Notifications</span>
                  <button class="mark-all-read" (click)="markAllRead()">Mark all read</button>
                </div>
                <div class="notif-list">
                  <div class="notif-item" *ngFor="let n of notifications" [class.unread]="!n.read">
                    <div class="notif-dot-small"></div>
                    <div class="notif-content">
                      <div class="notif-text">{{n.text}}</div>
                      <div class="notif-time">{{n.time}}</div>
                    </div>
                  </div>
                </div>
                <a routerLink="/tasks" class="dropdown-footer" (click)="showNotifPanel.set(false)">View All Activity →</a>
              </div>
            </div>

            <!-- Settings Icon (Admin Only) -->
            <a routerLink="/settings" class="topbar-btn flex-center" title="Settings" *ngIf="isAdmin()">
              <lucide-icon [img]="Settings" class="w-5 h-5"></lucide-icon>
            </a>

            <!-- User Avatar Dropdown -->
            <div class="topbar-dropdown-wrap">
                <div class="topbar-avatar" (click)="toggleUserMenu($event)" style="cursor:pointer">
                  <ng-container *ngIf="!userAvatar()"><div class="avatar avatar-sm">{{userInitials()}}</div></ng-container>
                  <img *ngIf="userAvatar()" [src]="userAvatar()" class="avatar avatar-sm" style="object-fit:cover; padding:0" />
                </div>
                <div class="topbar-dropdown user-dropdown" *ngIf="showUserMenu()">
                  <div class="user-dropdown-header">
                    <div style="position:relative">
                      <div class="avatar-view-container" style="position:relative; cursor:pointer;" (click)="toggleAvatarSubMenu($event)">
                        <ng-container *ngIf="!userAvatar()"><div class="avatar" style="width:40px;height:40px;font-size:1rem">{{userInitials()}}</div></ng-container>
                        <img *ngIf="userAvatar()" [src]="userAvatar()" class="avatar" style="width:40px;height:40px;object-fit:cover; padding:0" />
                        <div class="avatar-edit-icon" style="position:absolute;bottom:-2px;right:-2px;background:var(--accent);color:#fff;border-radius:50%;padding:3px;box-shadow:0 2px 4px rgba(0,0,0,0.2)">
                          <lucide-icon [img]="Camera" style="width:12px;height:12px;display:block"></lucide-icon>
                        </div>
                      </div>
                      
                      <!-- Avatar Submenu -->
                      <div class="avatar-dropdown-menu" *ngIf="showAvatarSubMenu()">
                        <div class="avatar-dropdown-item" *ngIf="userAvatar()" (click)="viewAvatar($event)">
                          <lucide-icon [img]="Eye" class="btn-icon-sm"></lucide-icon> View Photo
                        </div>
                        <div class="avatar-dropdown-item" (click)="triggerAvatarUpload($event)">
                          <lucide-icon [img]="Camera" class="btn-icon-sm"></lucide-icon> Upload Photo
                        </div>
                        <div class="avatar-dropdown-item text-danger" *ngIf="userAvatar()" (click)="deleteAvatar($event)">
                          <lucide-icon [img]="Trash2" class="btn-icon-sm"></lucide-icon> Remove Photo
                        </div>
                      </div>
                    </div>
                  <div style="display:flex; flex-direction:column; cursor:pointer; padding:6px; border-radius:6px; transition:0.15s; margin-left: 0.25rem" (click)="goToProfile()" title="My Profile" onmouseover="this.style.backgroundColor='var(--bg-hover)'" onmouseout="this.style.backgroundColor='transparent'">
                    <div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);line-height:1.2;margin-bottom:2px">{{userName()}}</div>
                    <div class="text-muted" style="font-size:0.75rem;line-height:1.4;display:flex;align-items:center"><lucide-icon [img]="Mail" style="width:12px;height:12px;margin-right:4px"></lucide-icon>{{userEmail()}}</div>
                    <div class="text-muted" style="font-size:0.75rem;line-height:1.4;display:flex;align-items:center" *ngIf="userPhone()"><span style="font-size:11px;margin-right:4px">📞</span>{{userPhone()}}</div>
                  </div>
                </div>
                <a routerLink="/profile" class="user-menu-item" (click)="showUserMenu.set(false)">
                  <lucide-icon [img]="UserCheck" class="w-4 h-4 mr-2"></lucide-icon> My Profile
                </a>
                <a routerLink="/settings" class="user-menu-item" (click)="showUserMenu.set(false)" *ngIf="isAdmin()">
                  <lucide-icon [img]="Settings" class="w-4 h-4 mr-2"></lucide-icon> System Settings
                </a>
                <button class="user-menu-item text-danger" (click)="logout()">
                  <lucide-icon [img]="LogOut" class="w-4 h-4 mr-2"></lucide-icon> Logout
                </button>
              </div>
            </div>
            
            <!-- Global Hidden File Input -->
            <input type="file" #avatarInput accept="image/*" style="display:none" (change)="onAvatarSelected($event)" />
            
          </div>
        </header>

        <!-- Page Content -->
        <main class="content-area">
          <router-outlet />
        </main>
      </div>
      
      <!-- Avatar View Modal -->
      <div *ngIf="viewingAvatar()" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:99999; animation: fadeIn 0.2s ease-out;" (click)="viewingAvatar.set(false)">
        <div style="max-width:500px; padding:1rem; text-align:center" (click)="$event.stopPropagation()">
          <img *ngIf="userAvatar()" [src]="userAvatar()" style="max-width:100%; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.5)" />
          <div *ngIf="!userAvatar()" class="avatar" style="width:150px;height:150px;font-size:4rem;margin:0 auto;box-shadow:0 10px 40px rgba(0,0,0,0.5)">{{userInitials()}}</div>
          <div style="margin-top:1.5rem">
            <button (click)="viewingAvatar.set(false)" style="background:rgba(255,255,255,0.15); color:#fff; border:1px solid rgba(255,255,255,0.3); padding:0.5rem 1.5rem; border-radius:50px; cursor:pointer; font-weight:500; transition:0.2s">Close Viewer</button>
          </div>
        </div>
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
      position: relative; overflow: hidden;
    }
    .sidebar-header::before {
      content: '';
      position: absolute; left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: 300px; height: 300px; border-radius: 50%;
      background: radial-gradient(circle, rgba(0,86,210,0.28) 0%, rgba(59,130,246,0.1) 50%, transparent 70%);
      filter: blur(18px); pointer-events: none; z-index: 0;
    }
    .sidebar-header::after { content: none; }
    .logo { display: flex; align-items: center; justify-content: flex-start; overflow: hidden; height: 40px; position: relative; z-index: 1; }
    .main-logo-img { height: 35px; width: auto; max-width: 100%; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.15)); }
    .logo-icon-only { display: flex; align-items: center; justify-content: center; height: 32px; width: 32px; overflow: hidden; border-radius: 4px; position: relative; z-index: 1; }
    .collapsed-logo-img { height: 32px; width: 32px; object-fit: cover; object-position: left; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.15)); }

    .collapse-btn {
      background: var(--bg-hover); border: 1px solid var(--border);
      color: var(--text-secondary); border-radius: 6px;
      width: 28px; height: 28px; cursor: pointer; font-size: 0.75rem;
      display: flex; align-items: center; justify-content: center;
      transition: var(--transition); flex-shrink: 0;
      &:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
    }

    .sidebar-nav { flex: 1; overflow-y: auto; padding: 0.75rem 0.5rem; display: flex; flex-direction: column; gap: 0.25rem; }
    .nav-section { margin-bottom: 0.5rem; }
    .nav-section-label { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); padding: 0.5rem 0.75rem 0.25rem; }

    .nav-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.6rem 0.75rem; border-radius: var(--radius-sm);
      color: var(--text-secondary); text-decoration: none;
      transition: var(--transition); font-size: 0.875rem; font-weight: 500;
      white-space: nowrap; overflow: hidden;
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
      &.active { background: rgba(124,58,237,0.15); color: var(--accent-light); border-left: 2px solid var(--accent); }
    }
    .nav-icon   { font-size: 1.1rem; flex-shrink: 0; }
    .nav-label  { flex: 1; }
    .nav-badge  { background: var(--accent); color: #fff; font-size: 0.65rem; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 10px; min-width: 18px; text-align: center; }

    .sidebar-footer { padding: 0.75rem; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.5rem; }
    .user-info { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem; overflow: hidden; }
    .user-details {
      overflow: hidden;
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
    .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

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
      text-decoration: none; color: var(--text-secondary);
      display: flex; align-items: center;
      &:hover { border-color: var(--accent); color: var(--accent); }
    }
    .notification-btn { position: relative; }
    .notif-dot { position: absolute; top: -4px; right: -4px; background: #ef4444; color: #fff; font-size: 0.6rem; font-weight: 700; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--bg-secondary); }

    .topbar-avatar { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); transition: 0.15s; &:hover { background: var(--bg-hover); } }
    .topbar-user-info { display: flex; flex-direction: column; }
    .topbar-name { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
    .topbar-role { font-size: 0.7rem; color: var(--text-muted); line-height: 1; }

    /* Dropdown */
    .topbar-dropdown-wrap { position: relative; }
    .topbar-dropdown {
      position: absolute; top: calc(100% + 0.5rem); right: 0; min-width: 280px;
      background: var(--bg-primary); border: 1px solid var(--border);
      border-radius: var(--radius-md); box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      z-index: 500; 
    }
    .dropdown-header { display: flex; justify-content: space-between; align-items: center; padding: 0.875rem 1rem; border-bottom: 1px solid var(--border); font-weight: 600; font-size: 0.875rem; border-radius: var(--radius-md) var(--radius-md) 0 0; }
    .mark-all-read { background: none; border: none; color: var(--accent); font-size: 0.75rem; cursor: pointer; }
    .dropdown-footer { display: block; padding: 0.75rem 1rem; text-align: center; font-size: 0.8rem; color: var(--accent); text-decoration: none; border-top: 1px solid var(--border); border-radius: 0 0 var(--radius-md) var(--radius-md); &:hover { background: var(--bg-hover); } }

    .notif-list { display: flex; flex-direction: column; max-height: 300px; overflow-y: auto; }
    .notif-item {
      display: flex; align-items: flex-start; gap: 0.75rem;
      padding: 0.875rem 1rem; border-bottom: 1px solid var(--border);
      transition: 0.15s;
      &:hover { background: var(--bg-hover); }
      &.unread { background: rgba(124,58,237,0.04); }
    }
    .notif-dot-small { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); margin-top: 0.35rem; flex-shrink: 0; }
    .notif-item:not(.unread) .notif-dot-small { background: var(--border); }
    .notif-content { flex: 1; }
    .notif-text { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; }
    .notif-time { font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem; }

    .user-dropdown-header { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-bottom: 1px solid var(--border); border-radius: var(--radius-md) var(--radius-md) 0 0; }
    .user-menu-item { display: flex; align-items: center; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--text-secondary); text-decoration: none; border: none; background: none; width: 100%; cursor: pointer; transition: 0.15s; &:hover { background: var(--bg-hover); color: var(--text-primary); } }
    .user-menu-item.text-danger { color: #dc2626; border-radius: 0 0 var(--radius-md) var(--radius-md); &:hover { background: rgba(239,68,68,0.08); } }
    .user-menu-divider { border-top: 1px solid var(--border); }
    .mr-2 { margin-right: 0.5rem; }

    /* Avatar Sub-Menu */
    .avatar-dropdown-menu { position:absolute; top:calc(100% + 5px); left:0; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.15); z-index:55; width:160px; padding:0.5rem; text-align:left; animation: slideUp 0.15s ease-out; }
    .avatar-dropdown-item { display:flex; align-items:center; gap:0.5rem; padding:0.5rem 0.75rem; border-radius:8px; cursor:pointer; font-size:0.8rem; color:var(--text); transition:var(--transition); white-space:nowrap; }
    .avatar-dropdown-item:hover { background:var(--bg-secondary); color:var(--accent); }
    .avatar-dropdown-item.text-danger { color:#ef4444; }
    .avatar-dropdown-item.text-danger:hover { background:rgba(239,68,68,0.1); }
    .btn-icon-sm { width:1rem; height:1rem; }

    .content-area { flex: 1; overflow-y: auto; padding: 1.5rem; background: var(--bg-primary); }
  `]
})
export class ShellComponent implements OnInit {
  collapsed = signal(false);
  showNotifPanel = signal(false);
  showUserMenu = signal(false);
  viewingAvatar = signal(false);
  showAvatarSubMenu = signal(false);

  navSections = [
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
        { label: 'Calendar', icon: Calendar, path: '/calendar', roles: ['Admin', 'Manager', 'Support Agent', 'Viewer'] },
        { label: 'Emails', icon: Mail, path: '/emails', roles: ['Admin', 'Manager', 'Sales Rep', 'Support Agent'] },
        { label: 'Notes', icon: FileText, path: '/notes', roles: ['Admin', 'Manager', 'Support Agent', 'Viewer'] },
      ]
    },
    {
      label: 'Communication',
      items: [
        { label: 'Team Chat', icon: MessageSquare, path: '/chat', roles: ['Support Agent', 'Viewer'] },
        { label: 'Meetings', icon: Video, path: '/meetings', roles: ['Admin', 'Manager', 'Sales Rep', 'Viewer'] },
        { label: 'Live Chat', icon: Headset, path: '/live-chat', roles: ['Support Agent'] },
      ]
    },
    {
      label: 'Support',
      items: [
        { label: 'Tickets', icon: Ticket, path: '/tickets', roles: ['Support Agent', 'Viewer'] },
        { label: 'Knowledge Base', icon: BookOpen, path: '/knowledge-base', roles: ['Support Agent', 'Viewer'] }
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

  notifications: any[] = [];

  unreadNotifs() { return this.notifications.filter(n => !n.read).length; }

  markAllRead() { this.notifications.forEach(n => n.read = true); }

  readonly Zap = Zap;
  readonly ArrowLeftFromLine = ArrowLeftFromLine;
  readonly ArrowRightFromLine = ArrowRightFromLine;
  readonly LogOut = LogOut;
  readonly Bell = Bell;
  readonly Settings = Settings;
  readonly X = X;
  readonly Camera = Camera;
  readonly Trash2 = Trash2;
  readonly Eye = Eye;
  readonly Mail = Mail;
  readonly Ticket = Ticket;
  readonly BookOpen = BookOpen;
  readonly UserCheck = UserCheck;

  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  constructor(
    private auth: AuthService, 
    private router: Router, 
    private reportSvc: ReportService,
    private settingsSvc: SettingsService,
    private toast: ToastService
  ) { }

  ngOnInit() {
    this.fetchNotifications();
  }

  fetchNotifications() {
    this.reportSvc.getNotifications().subscribe((res: any[]) => {
      this.notifications = res;
    });
  }

  viewAvatar(event: Event) {
    event.stopPropagation();
    this.viewingAvatar.set(true);
    this.showUserMenu.set(false);
    this.showAvatarSubMenu.set(false);
  }

  triggerAvatarUpload(event?: Event) {
    if(event) event.stopPropagation();
    this.avatarInput?.nativeElement?.click();
    this.showUserMenu.set(false);
    this.showAvatarSubMenu.set(false);
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.settingsSvc.uploadAvatar(formData).subscribe({
      next: (res) => {
        input.value = ''; // Reset input so same file can be selected again
        const currentUser = this.auth.getCurrentUser();
        if (currentUser) {
          currentUser.avatarUrl = res.avatarUrl;
          this.auth.updateCurrentUser(currentUser); 
        }
        this.toast.success('Avatar Uploaded', 'Your profile photo has been updated successfully!');
      },
      error: (e) => {
        input.value = ''; // Reset input on error
        this.toast.error('Upload Failed', e.error?.message ?? 'Failed to upload the avatar.');
      }
    });
  }

  deleteAvatar(event?: Event) {
    if(event) event.stopPropagation();
    if (!confirm('Are you sure you want to remove your profile photo?')) return;
    this.settingsSvc.removeAvatar().subscribe({
      next: () => {
        const currentUser = this.auth.getCurrentUser();
        if (currentUser) {
          currentUser.avatarUrl = undefined;
          this.auth.updateCurrentUser(currentUser);
        }
        this.toast.success('Avatar Removed', 'Your profile photo has been deleted.');
        this.showUserMenu.set(false);
        this.showAvatarSubMenu.set(false);
      },
      error: (e) => {
        this.toast.error('Remove Failed', e.error?.message ?? 'Could not remove avatar.');
      }
    });
  }

  @HostListener('document:click')
  onDocClick() {
    this.showNotifPanel.set(false);
    this.showUserMenu.set(false);
    this.showAvatarSubMenu.set(false);
  }

  toggleNotifications(e: Event) {
    e.stopPropagation();
    this.showNotifPanel.update(v => !v);
    this.showUserMenu.set(false);
    this.showAvatarSubMenu.set(false);
  }

  toggleAvatarSubMenu(e: Event) {
    e.stopPropagation();
    this.showAvatarSubMenu.update(v => !v);
  }

  toggleUserMenu(e: Event) {
    e.stopPropagation();
    this.showUserMenu.update(v => !v);
    this.showNotifPanel.set(false);
    this.showAvatarSubMenu.set(false);
  }

  reloadPage() { window.location.reload(); }

  canSeeSection(section: any): boolean {
    return section.items.some((item: any) => this.canSeeItem(item));
  }

  canSeeItem(item: any): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    const userRoles = this.auth.getCurrentUser()?.roles ?? [];
    return item.roles.some((r: string) => userRoles.includes(r));
  }

  logout() { this.auth.logout(); }
  userName() { const u = this.auth.getCurrentUser(); return u ? `${u.firstName} ${u.lastName}` : ''; }
  userInitials() { const u = this.auth.getCurrentUser(); return u ? `${u.firstName[0]}${u.lastName[0]}` : '?'; }
  userAvatar() { return this.auth.getCurrentUser()?.avatarUrl; }
  userRole() { return this.auth.getCurrentUser()?.roles?.[0] ?? ''; }
  userEmail() { return this.auth.getCurrentUser()?.email ?? ''; }
  userPhone() { return (this.auth.getCurrentUser() as any)?.phone ?? ''; }

  goToProfile() {
    this.router.navigate(['/profile']);
    this.showUserMenu.set(false);
  }

  isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  currentPage() {
    const path = this.router.url.split('/')[1];
    const map: Record<string, string> = {
      dashboard: 'Dashboard', contacts: 'Contacts', leads: 'Leads', deals: 'Deals',
      tasks: 'Tasks', calendar: 'Calendar', emails: 'Emails', notes: 'Notes',
      chat: 'Team Chat', meetings: 'Meetings', 'live-chat': 'Live Chat',
      reports: 'Reports', settings: 'Settings', companies: 'Companies',
      customers: 'Customers', products: 'Products', orders: 'Orders',
      invoices: 'Invoices', payments: 'Payments', tickets: 'Support Tickets',
      'knowledge-base': 'Knowledge Base'
    };
    return map[path] ?? 'Dhwiti CRM';
  }
}
