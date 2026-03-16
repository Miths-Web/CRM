import { Component, Input, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, Bell, Search, ChevronDown } from 'lucide-angular';

@Component({
    selector: 'app-header',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <header class="topbar">
      <!-- Left: Page Title -->
      <div class="topbar-left">
        <h1 class="page-title-header">{{ currentPageTitle() }}</h1>
      </div>

      <!-- Right: actions -->
      <div class="topbar-right">
        <!-- Notifications -->
        <button class="topbar-btn flex-center" title="Notifications">
          <lucide-icon [img]="Bell" class="w-5 h-5"></lucide-icon>
        </button>

        <!-- Avatar + Name -->
        <div class="topbar-user">
          <div class="avatar-sm">{{ initials() }}</div>
          <span class="tuser-name">{{ name() }}</span>
          <lucide-icon [img]="ChevronDown" class="w-4 h-4 text-muted"></lucide-icon>
        </div>
      </div>
    </header>
  `,
    styles: [`
    .topbar {
      height: var(--header-height, 64px); min-height: var(--header-height, 64px);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1.5rem;
      background: var(--bg-secondary); border-bottom: 1px solid var(--border);
      gap: 1rem; position: sticky; top: 0; z-index: 100;
    }
    .topbar-left { display: flex; align-items: center; gap: 1rem; }
    .page-title-header { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }
    .topbar-right { display: flex; align-items: center; gap: 0.75rem; }
    .topbar-btn {
      background: var(--bg-hover); border: 1px solid var(--border); border-radius: var(--radius-sm);
      padding: 0.45rem; cursor: pointer; color: var(--text-secondary); transition: var(--transition);
      &:hover { border-color: var(--accent); color: var(--accent-light); }
    }
    .topbar-user {
      display: flex; align-items: center; gap: 0.5rem; cursor: pointer;
      padding: 0.25rem 0.75rem; border-radius: var(--radius-sm);
      transition: var(--transition);
      &:hover { background: var(--bg-hover); }
    }
    .avatar-sm {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--info));
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.75rem; flex-shrink: 0;
    }
    .tuser-name { font-size: 0.875rem; font-weight: 600; }
    .text-muted { opacity: 0.5; }
  `]
})
export class HeaderComponent implements OnInit {
    readonly Bell = Bell;
    readonly Search = Search;
    readonly ChevronDown = ChevronDown;

    currentPageTitle = signal('Dashboard');

    private readonly pageMap: Record<string, string> = {
        dashboard: 'Dashboard', contacts: 'Contacts', leads: 'Leads', deals: 'Deals',
        tasks: 'Tasks', calendar: 'Calendar', emails: 'Emails', notes: 'Notes',
        chat: 'Team Chat', meetings: 'Meetings', 'live-chat': 'Live Chat',
        reports: 'Reports', settings: 'Settings'
    };

    constructor(private auth: AuthService, private router: Router) { }

    ngOnInit(): void {
        this.updateTitle(this.router.url);
        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe((e: any) => this.updateTitle(e.urlAfterRedirects ?? e.url));
    }

    private updateTitle(url: string): void {
        const seg = url.split('/')[1]?.split('?')[0] ?? '';
        this.currentPageTitle.set(this.pageMap[seg] ?? 'Dhwiti CRM');
    }

    name(): string {
        const u = this.auth.getCurrentUser();
        return u ? `${u.firstName} ${u.lastName}` : '';
    }

    initials(): string {
        const u = this.auth.getCurrentUser();
        return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '?';
    }
}
