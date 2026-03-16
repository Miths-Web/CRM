import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Email {
    id: string;
    subject: string;
    body: string;
    toAddress: string;
    fromAddress?: string;
    ccAddress?: string;
    status: 'Draft' | 'Sent' | 'Scheduled' | 'Failed';
    scheduledAt?: string;
    sentAt?: string;
    contactId?: string;
    contactName?: string;
    openedAt?: string;
    createdAt: string;
}

export interface EmailSendDto {
    subject: string;
    body: string;
    toAddress: string;
    ccAddress?: string;
    contactId?: string;
    scheduledAt?: string;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
}

@Injectable({ providedIn: 'root' })
export class EmailsService {
    constructor(private api: ApiService) { }

    getAll(params?: { status?: string; contactId?: string }): Observable<Email[]> {
        return this.api.get<Email[]>('emails', params);
    }

    getById(id: string): Observable<Email> {
        return this.api.get<Email>(`emails/${id}`);
    }

    /** Send immediate email */
    send(dto: EmailSendDto): Observable<Email> {
        return this.api.post<Email>('emails/send', dto);
    }

    /** Schedule email for later */
    schedule(dto: EmailSendDto): Observable<Email> {
        return this.api.post<Email>('emails/schedule', dto);
    }

    /** Save as draft */
    saveDraft(dto: Partial<EmailSendDto>): Observable<Email> {
        return this.api.post<Email>('emails/draft', dto);
    }

    delete(id: string): Observable<void> {
        return this.api.delete<void>(`emails/${id}`);
    }

    /** Get all email templates */
    getTemplates(): Observable<EmailTemplate[]> {
        return this.api.get<EmailTemplate[]>('emails/templates');
    }

    /** Email open rate & click stats */
    getStats(): Observable<{ sent: number; opened: number; clicked: number; failed: number }> {
        return this.api.get('emails/stats');
    }
}
