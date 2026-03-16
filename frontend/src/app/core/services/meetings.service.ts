import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Meeting {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime?: string;
    jitsiRoomName: string;
    status: 'Scheduled' | 'Ongoing' | 'Ended' | 'Cancelled';
    hostUserId: string;
    hostName?: string;
    attendees?: string;
    contactId?: string;
    dealId?: string;
    createdAt: string;
}

export interface MeetingCreateDto {
    title: string;
    description?: string;
    startTime: string;
    endTime?: string;
    attendees?: string;
    contactId?: string;
    dealId?: string;
}

@Injectable({ providedIn: 'root' })
export class MeetingsService {
    constructor(private api: ApiService) { }

    getAll(params?: { status?: string }): Observable<Meeting[]> {
        return this.api.get<Meeting[]>('meetings', params);
    }

    getById(id: string): Observable<Meeting> {
        return this.api.get<Meeting>(`meetings/${id}`);
    }

    create(dto: MeetingCreateDto): Observable<Meeting> {
        return this.api.post<Meeting>('meetings', dto);
    }

    update(id: string, dto: Partial<MeetingCreateDto>): Observable<Meeting> {
        return this.api.put<Meeting>(`meetings/${id}`, dto);
    }

    delete(id: string): Observable<void> {
        return this.api.delete<void>(`meetings/${id}`);
    }

    cancel(id: string): Observable<Meeting> {
        return this.api.patch<Meeting>(`meetings/${id}/cancel`, {});
    }

    /** Get join URL for a meeting */
    getJoinUrl(id: string): string {
        return this.api['baseUrl'] ? '' : '';
        // Constructed in component using environment.jitsiServer/roomName
    }
}
