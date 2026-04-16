import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface Lead {
    id: string; title: string; firstName?: string; lastName?: string;
    email?: string; phone?: string; company?: string; jobTitle?: string;
    status: string; source?: string; score: number; estimatedValue?: number;
    description?: string; assignedToUserId?: string; createdAt: string; updatedAt: string;
}
export interface CreateLeadDto {
    title: string; firstName?: string; lastName?: string; email?: string; phone?: string;
    company?: string; jobTitle?: string; status?: string; source?: string;
    estimatedValue?: number; description?: string; assignedToUserId?: string;
}

@Injectable({ providedIn: 'root' })
export class LeadService {
    constructor(private api: ApiService) { }
    getPaged(page = 1, size = 20): Observable<Lead[]> { return this.api.get<Lead[]>('leads', { pageNumber: page, pageSize: size }); }
    getById(id: string): Observable<Lead> { return this.api.get<Lead>(`leads/${id}`); }
    create(dto: CreateLeadDto): Observable<Lead> { return this.api.post<Lead>('leads', dto); }
    update(id: string, dto: CreateLeadDto): Observable<void> { return this.api.put<void>(`leads/${id}`, dto); }
    delete(id: string): Observable<void> { return this.api.delete<void>(`leads/${id}`); }
    convert(id: string): Observable<any> { return this.api.post<any>(`leads/${id}/convert`, {}); }
    getUsersLookup(): Observable<{id: string, name: string}[]> { return this.api.get<{id: string, name: string}[]>('users/lookup'); }
}
