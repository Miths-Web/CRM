import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Note {
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    contactId?: string;
    contactName?: string;
    dealId?: string;
    dealTitle?: string;
    color?: string;
    createdAt: string;
    updatedAt: string;
}

export interface NoteCreateDto {
    title: string;
    content: string;
    isPinned?: boolean;
    contactId?: string;
    dealId?: string;
    color?: string;
}

@Injectable({ providedIn: 'root' })
export class NotesService {
    constructor(private api: ApiService) { }

    getAll(params?: { search?: string; isPinned?: boolean; contactId?: string }): Observable<Note[]> {
        return this.api.get<Note[]>('notes', params);
    }

    getById(id: string): Observable<Note> {
        return this.api.get<Note>(`notes/${id}`);
    }

    create(dto: NoteCreateDto): Observable<Note> {
        return this.api.post<Note>('notes', dto);
    }

    update(id: string, dto: Partial<NoteCreateDto>): Observable<Note> {
        return this.api.put<Note>(`notes/${id}`, dto);
    }

    delete(id: string): Observable<void> {
        return this.api.delete<void>(`notes/${id}`);
    }

    togglePin(id: string): Observable<Note> {
        return this.api.patch<Note>(`notes/${id}/pin`, {});
    }
}
