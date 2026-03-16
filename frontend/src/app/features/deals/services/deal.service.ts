import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface Deal {
    id: string; title: string; value: number; currency: string;
    stageId?: number; stageName?: string; probability: number;
    expectedCloseDate?: string; actualCloseDate?: string;
    status: string; lostReason?: string; customerId?: string; customerName?: string;
    companyId?: string; companyName?: string; description?: string; assignedToUserId?: string; createdAt: string;
}
export interface DealStage { id: number; name: string; orderIndex: number; probability: number; isActive: boolean; }
export interface CreateDealDto {
    title: string; value: number; currency?: string; stageId?: number;
    probability?: number; expectedCloseDate?: string; status?: string;
    customerId?: string; companyId?: string; description?: string; assignedToUserId?: string;
}

@Injectable({ providedIn: 'root' })
export class DealService {
    constructor(private api: ApiService) { }
    getPaged(page = 1, size = 50): Observable<Deal[]> { return this.api.get<Deal[]>('deals', { pageNumber: page, pageSize: size }); }
    getById(id: string): Observable<Deal> { return this.api.get<Deal>(`deals/${id}`); }
    getStages(): Observable<DealStage[]> { return this.api.get<DealStage[]>('deals/stages'); }
    create(dto: CreateDealDto): Observable<Deal> { return this.api.post<Deal>('deals', dto); }
    update(id: string, dto: CreateDealDto): Observable<void> { return this.api.put<void>(`deals/${id}`, dto); }
    updateStage(id: string, stageId: number): Observable<void> { return this.api.put<void>(`deals/${id}/stage`, { stageId }); }
    delete(id: string): Observable<void> { return this.api.delete<void>(`deals/${id}`); }
}
