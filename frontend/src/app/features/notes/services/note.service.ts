import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface Note {
    id: string; title: string; content: string; category?: string; isPinned: boolean;
    relatedCustomerId?: string; relatedLeadId?: string; relatedDealId?: string; createdAt: string; updatedAt: string;
}
export interface CreateNoteDto { title: string; content: string; category?: string; isPinned?: boolean; relatedCustomerId?: string; relatedLeadId?: string; relatedDealId?: string; }

@Injectable({ providedIn: 'root' })
export class NoteService {
    constructor(private api: ApiService) { }
    getPaged(page = 1, size = 20): Observable<Note[]> { return this.api.get<Note[]>('notes', { pageNumber: page, pageSize: size }); }
    getById(id: string): Observable<Note> { return this.api.get<Note>(`notes/${id}`); }
    create(dto: CreateNoteDto): Observable<Note> { return this.api.post<Note>('notes', dto); }
    update(id: string, dto: CreateNoteDto): Observable<void> { return this.api.put<void>(`notes/${id}`, dto); }
    delete(id: string): Observable<void> { return this.api.delete<void>(`notes/${id}`); }
}
