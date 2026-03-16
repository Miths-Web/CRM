import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { setupGuard } from './core/guards/setup.guard';

// ─── Role Constants ───────────────────────────────────────────────
const ALL_ROLES = ['Admin', 'Manager', 'Sales Rep', 'Support Agent', 'Viewer'];
const STAFF_ROLES = ['Admin', 'Manager', 'Sales Rep', 'Support Agent'];
const SALES_ROLES = ['Admin', 'Manager', 'Sales Rep'];
const MANAGER_UP = ['Admin', 'Manager'];
const ADMIN_ONLY = ['Admin'];

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

    // ─── Initial Setup Page (Only when NO users exist in DB) ─────────
    {
        path: 'setup',
        canActivate: [setupGuard],
        loadComponent: () => import('./features/initial-setup/initial-setup.component').then(m => m.InitialSetupComponent)
    },

    // ─── Auth Pages (Public — no guard needed) ────────────────────────
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
    },

    // ─── 403 Page (Public) ───────────────────────────────────────────
    {
        path: 'unauthorized',
        loadComponent: () => import('./features/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
    },

    // ─── Protected Shell (all logged-in users) ───────────────────────
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
        children: [

            // ── Dashboard — Admin, Manager, Sales Rep ──
            {
                path: 'dashboard',
                canActivate: [roleGuard(SALES_ROLES)],
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },

            // ── Companies — All logged-in users ──
            {
                path: 'companies',
                canActivate: [roleGuard(ALL_ROLES)],
                loadComponent: () => import('./features/companies/companies.component').then(m => m.CompaniesComponent)
            },

            // ── Customers — All logged-in users ──
            {
                path: 'customers',
                canActivate: [roleGuard(ALL_ROLES)],
                loadComponent: () => import('./features/customers/customers.component').then(m => m.CustomersComponent)
            },

            // ── Products — Admin, Manager, Sales Rep ──
            {
                path: 'products',
                canActivate: [roleGuard(SALES_ROLES)],
                loadComponent: () => import('./features/products/products.component').then(m => m.ProductsComponent)
            },

            // ── Orders — Admin, Manager, Sales Rep ──
            {
                path: 'orders',
                canActivate: [roleGuard(SALES_ROLES)],
                loadComponent: () => import('./features/orders/orders.component').then(m => m.OrdersComponent)
            },

            // ── Invoices — Admin, Manager, Sales Rep ──
            {
                path: 'invoices',
                canActivate: [roleGuard(SALES_ROLES)],
                loadComponent: () => import('./features/invoices/invoices.component').then(m => m.InvoicesComponent)
            },

            // ── Payments — Admin, Manager, Sales Rep ──
            {
                path: 'payments',
                canActivate: [roleGuard(SALES_ROLES)],
                loadComponent: () => import('./features/payments/payments.component').then(m => m.PaymentsComponent)
            },

            // ── Leads — Admin, Manager, Sales Rep ──
            {
                path: 'leads',
                canActivate: [roleGuard(SALES_ROLES)],
                loadComponent: () => import('./features/leads/leads.component').then(m => m.LeadsComponent)
            },

            // ── Deals — Admin, Manager, Sales Rep ──
            {
                path: 'deals',
                canActivate: [roleGuard(SALES_ROLES)],
                loadComponent: () => import('./features/deals/deals.component').then(m => m.DealsComponent)
            },

            // ── Tasks — All logged-in users ──
            {
                path: 'tasks',
                canActivate: [roleGuard(ALL_ROLES)],
                loadComponent: () => import('./features/tasks/tasks.component').then(m => m.TasksComponent)
            },

            // ── Calendar — All logged-in users ──
            {
                path: 'calendar',
                canActivate: [roleGuard(ALL_ROLES)],
                loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent)
            },

            // ── Emails — All staff (no Viewers) ──
            {
                path: 'emails',
                canActivate: [roleGuard(STAFF_ROLES)],
                loadComponent: () => import('./features/emails/emails.component').then(m => m.EmailsComponent)
            },

            // ── Notes — All logged-in users ──
            {
                path: 'notes',
                canActivate: [roleGuard(ALL_ROLES)],
                loadComponent: () => import('./features/notes/notes.component').then(m => m.NotesComponent)
            },

            // ── Team Chat — All logged-in users ──
            {
                path: 'chat',
                canActivate: [roleGuard(ALL_ROLES)],
                loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)
            },

            // ── Meetings — All except no restrictions (Support Agent bhi allowed) ──
            {
                path: 'meetings',
                canActivate: [roleGuard(ALL_ROLES)],  // BUG-016 FIX: Support Agent bhi meetings dekh sake
                loadComponent: () => import('./features/meetings/meetings.component').then(m => m.MeetingsComponent)
            },

            // ── Live Chat — Agents only (no Viewer) ──
            {
                path: 'live-chat',
                canActivate: [roleGuard(STAFF_ROLES)],
                loadComponent: () => import('./features/live-chat/live-chat.component').then(m => m.LiveChatComponent)
            },

            // ── Reports — Admin & Manager only ──
            {
                path: 'reports',
                canActivate: [roleGuard(MANAGER_UP)],
                loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
            },

            // ── Settings — Admin ONLY ──
            {
                path: 'settings',
                canActivate: [roleGuard(ADMIN_ONLY)],
                loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
            },
        ]
    },

    // ─── Fallback ────────────────────────────────────────────────────
    { path: '**', redirectTo: 'dashboard' }
];
