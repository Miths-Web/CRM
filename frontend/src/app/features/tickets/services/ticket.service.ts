import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface TicketComment {
    id: string;
    ticketId: string;
    userId: string;
    userName?: string;
    commentText: string;
    isInternal: boolean;
    createdAt: string;
}

export interface Ticket {
    id: string;
    ticketNumber: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    customerId?: string;
    customerName?: string;
    assignedToUserId?: string;
    assignedToName?: string;
    createdByUserId: string;
    createdByName?: string;
    createdAt: string;
    updatedAt: string;
    comments: TicketComment[];
}

export interface CreateTicketDto {
    title: string;
    description: string;
    priority: string;
    customerId?: string;
    assignedToUserId?: string;
}

export interface UpdateTicketDto {
    title: string;
    description: string;
    status: string;
    priority: string;
    customerId?: string;
    assignedToUserId?: string;
}

export interface CreateTicketCommentDto {
    commentText: string;
    isInternal: boolean;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
    private apiUrl = `${environment.apiUrl}/tickets`;

    constructor(private http: HttpClient) { }

    getAll(page = 1, pageSize = 100): Observable<Ticket[]> {
        return this.http.get<Ticket[]>(`${this.apiUrl}?pageNumber=${page}&pageSize=${pageSize}`);
    }

    getById(id: string): Observable<Ticket> {
        return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
    }

    create(dto: CreateTicketDto): Observable<Ticket> {
        return this.http.post<Ticket>(this.apiUrl, dto);
    }

    update(id: string, dto: UpdateTicketDto): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, dto);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    addComment(id: string, dto: CreateTicketCommentDto): Observable<TicketComment> {
        return this.http.post<TicketComment>(`${this.apiUrl}/${id}/comments`, dto);
    }
}
