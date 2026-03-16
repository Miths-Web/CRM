import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    source: string;
    status: 'New' | 'Contacted' | 'Qualified' | 'Lost' | 'Converted';
    estimatedValue?: number;
    notes?: string;
    assignedTo?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LeadCreateDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    source: string;
    status?: string;
    estimatedValue?: number;
    notes?: string;
    assignedTo?: string;
}

@Injectable({ providedIn: 'root' })
export class LeadsService {
    constructor(private api: ApiService) { }

    getAll(params?: { search?: string; status?: string; source?: string }): Observable<Lead[]> {
        return this.api.get<Lead[]>('leads', params);
    }

    getById(id: string): Observable<Lead> {
        return this.api.get<Lead>(`leads/${id}`);
    }

    create(dto: LeadCreateDto): Observable<Lead> {
        return this.api.post<Lead>('leads', dto);
    }

    update(id: string, dto: Partial<LeadCreateDto>): Observable<Lead> {
        return this.api.put<Lead>(`leads/${id}`, dto);
    }

    delete(id: string): Observable<void> {
        return this.api.delete<void>(`leads/${id}`);
    }

    /** Convert lead to CRM contact */
    convert(id: string): Observable<{ contactId: string; message: string }> {
        return this.api.post(`leads/${id}/convert`, {});
    }

    /** Update just the status of a lead */
    updateStatus(id: string, status: string): Observable<Lead> {
        return this.api.patch<Lead>(`leads/${id}/status`, { status });
    }
}
