import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ReportSummary {
    totalContacts: number;
    newContactsThisMonth: number;
    totalLeads: number;
    newLeadsThisMonth: number;
    qualifiedLeads: number;
    totalDeals: number;
    wonDeals: number;
    lostDeals: number;
    totalRevenue: number;
    revenueThisMonth: number;
    conversionRate: number;
    avgDealValue: number;
}

export interface MonthlySales {
    month: string;
    revenue: number;
    deals: number;
    won: number;
    lost: number;
}

export interface LeadSourceAnalysis {
    source: string;
    count: number;
    converted: number;
    conversionRate: number;
}

export interface SalesRepPerformance {
    userId: string;
    name: string;
    dealsWon: number;
    revenue: number;
    leadsConverted: number;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
    constructor(private api: ApiService) { }

    getSummary(): Observable<ReportSummary> {
        return this.api.get<ReportSummary>('reports/summary');
    }

    getMonthlySales(year?: number): Observable<MonthlySales[]> {
        return this.api.get<MonthlySales[]>('reports/monthly-sales', year ? { year } : undefined);
    }

    getLeadSourceAnalysis(): Observable<LeadSourceAnalysis[]> {
        return this.api.get<LeadSourceAnalysis[]>('reports/lead-sources');
    }

    getSalesRepPerformance(params?: { startDate?: string; endDate?: string }): Observable<SalesRepPerformance[]> {
        return this.api.get<SalesRepPerformance[]>('reports/sales-performance', params);
    }

    getDealsByStage(): Observable<{ stage: string; count: number; value: number }[]> {
        return this.api.get('reports/deals-by-stage');
    }

    getActivityLog(params?: { page?: number; pageSize?: number }): Observable<any[]> {
        return this.api.get('reports/activity', params);
    }
}
