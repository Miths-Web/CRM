import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface DashboardStats {
    totalContacts: number;
    newContactsThisMonth: number;
    activeLeads: number;
    newLeadsThisMonth: number;
    openDeals: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
    pendingTasks: number;
    overdueTasks: number;
    upcomingMeetings: number;
}

export interface RecentActivity {
    id: string;
    type: 'contact_added' | 'lead_created' | 'deal_won' | 'deal_lost' | 'task_done' | 'note_added' | 'email_sent';
    title: string;
    description: string;
    timestamp: string;
    userId: string;
    userName: string;
}

export interface QuickAction {
    label: string;
    route: string;
    icon: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    constructor(private api: ApiService) { }

    getStats(): Observable<DashboardStats> {
        return this.api.get<DashboardStats>('dashboard/stats');
    }

    getRecentActivity(limit = 10): Observable<RecentActivity[]> {
        return this.api.get<RecentActivity[]>('dashboard/activity', { limit });
    }

    getUpcomingTasks(limit = 5): Observable<any[]> {
        return this.api.get('dashboard/upcoming-tasks', { limit });
    }

    getRecentDeals(limit = 5): Observable<any[]> {
        return this.api.get('dashboard/recent-deals', { limit });
    }

    getMonthlyRevenue(): Observable<{ month: string; revenue: number }[]> {
        return this.api.get('dashboard/monthly-revenue');
    }
}
