import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Deal {
    id: string;
    title: string;
    contactId?: string;
    contactName?: string;
    stage: 'Prospect' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
    value: number;
    currency: string;
    probability?: number;
    expectedCloseDate?: string;
    actualCloseDate?: string;
    description?: string;
    ownerId?: string;
    ownerName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DealCreateDto {
    title: string;
    contactId?: string;
    stage?: string;
    value: number;
    currency?: string;
    probability?: number;
    expectedCloseDate?: string;
    description?: string;
}

export interface DealStageCount {
    stage: string;
    count: number;
    totalValue: number;
}

@Injectable({ providedIn: 'root' })
export class DealsService {
    constructor(private api: ApiService) { }

    getAll(params?: { search?: string; stage?: string; ownerId?: string }): Observable<Deal[]> {
        return this.api.get<Deal[]>('deals', params);
    }

    getById(id: string): Observable<Deal> {
        return this.api.get<Deal>(`deals/${id}`);
    }

    create(dto: DealCreateDto): Observable<Deal> {
        return this.api.post<Deal>('deals', dto);
    }

    update(id: string, dto: Partial<DealCreateDto>): Observable<Deal> {
        return this.api.put<Deal>(`deals/${id}`, dto);
    }

    delete(id: string): Observable<void> {
        return this.api.delete<void>(`deals/${id}`);
    }

    /** Move a deal to a different stage (Kanban board drag) */
    moveStage(id: string, stage: string): Observable<Deal> {
        return this.api.patch<Deal>(`deals/${id}/stage`, { stage });
    }

    /** Pipeline summary for dashboard widget */
    getPipelineSummary(): Observable<DealStageCount[]> {
        return this.api.get<DealStageCount[]>('deals/pipeline-summary');
    }
}
