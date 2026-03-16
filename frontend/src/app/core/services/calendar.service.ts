import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    allDay: boolean;
    type: 'Meeting' | 'Task' | 'Call' | 'Reminder' | 'Other';
    color?: string;
    contactId?: string;
    contactName?: string;
    dealId?: string;
    createdAt: string;
}

export interface CalendarEventCreateDto {
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    allDay?: boolean;
    type?: string;
    color?: string;
    contactId?: string;
    dealId?: string;
}

@Injectable({ providedIn: 'root' })
export class CalendarService {
    constructor(private api: ApiService) { }

    getAll(params?: { start?: string; end?: string; type?: string }): Observable<CalendarEvent[]> {
        return this.api.get<CalendarEvent[]>('calendar', params);
    }

    getById(id: string): Observable<CalendarEvent> {
        return this.api.get<CalendarEvent>(`calendar/${id}`);
    }

    create(dto: CalendarEventCreateDto): Observable<CalendarEvent> {
        return this.api.post<CalendarEvent>('calendar', dto);
    }

    update(id: string, dto: Partial<CalendarEventCreateDto>): Observable<CalendarEvent> {
        return this.api.put<CalendarEvent>(`calendar/${id}`, dto);
    }

    delete(id: string): Observable<void> {
        return this.api.delete<void>(`calendar/${id}`);
    }

    /** Get upcoming events for dashboard widget */
    getUpcoming(limit = 5): Observable<CalendarEvent[]> {
        return this.api.get<CalendarEvent[]>('calendar/upcoming', { limit });
    }
}
