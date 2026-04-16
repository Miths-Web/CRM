import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface DashboardData {
    totalContacts: number; totalLeads: number; totalDeals: number;
    openTasks: number; overdueTasks: number; upcomingEvents: number;
    totalPipelineValue: number; totalClosedWonValue: number; averageDealSize: number;
    leadConversionRate: number; dealWinRate: number; topDeals: TopDeal[];
}
export interface TopDeal { id: string; title: string; value: number; stageName: string; companyName?: string; }
export interface SalesReport { period: string; revenue: number; dealsWon: number; dealsLost: number; monthlyBreakdown: MonthlyBreakdown[]; }
export interface MonthlyBreakdown { month: string; revenue: number; dealsCount: number; }

@Injectable({ providedIn: 'root' })
export class ReportService {
    constructor(private api: ApiService) { }
    getDashboard(): Observable<DashboardData> { return this.api.get<DashboardData>('reports/dashboard'); }
    getSalesReport(year?: number): Observable<SalesReport> { return this.api.get<SalesReport>('reports/sales', year ? { year } : {}); }
    getLeadReport(): Observable<any> { return this.api.get<any>('reports/leads'); }
    getRecentActivity(): Observable<any[]> { return this.api.get<any[]>('reports/activity'); }
    getNotifications(): Observable<any[]> { return this.api.get<any[]>('reports/notifications'); }
}
