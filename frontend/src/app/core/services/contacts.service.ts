import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    address?: string;
    status: 'Active' | 'Inactive' | 'Prospect';
    source?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    ownerId?: string;
}

export interface ContactCreateDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    address?: string;
    status?: string;
    source?: string;
    notes?: string;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ContactsService {
    constructor(private api: ApiService) { }

    getAll(params?: { search?: string; status?: string; page?: number; pageSize?: number }): Observable<Contact[]> {
        return this.api.get<Contact[]>('contacts', params);
    }

    getById(id: string): Observable<Contact> {
        return this.api.get<Contact>(`contacts/${id}`);
    }

    create(dto: ContactCreateDto): Observable<Contact> {
        return this.api.post<Contact>('contacts', dto);
    }

    update(id: string, dto: Partial<ContactCreateDto>): Observable<Contact> {
        return this.api.put<Contact>(`contacts/${id}`, dto);
    }

    delete(id: string): Observable<void> {
        return this.api.delete<void>(`contacts/${id}`);
    }

    import(file: File): Observable<{ imported: number; errors: string[] }> {
        const fd = new FormData();
        fd.append('file', file);
        return this.api.upload('contacts/import', fd);
    }

    export(): Observable<Blob> {
        // Returns CSV blob — use HttpClient directly for blob response
        return this.api.get<Blob>('contacts/export');
    }
}
