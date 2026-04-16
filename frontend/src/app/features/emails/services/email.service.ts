import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface Email {
    id: string; subject: string; body: string; fromEmail?: string; toEmail: string;
    ccEmails?: string; bccEmails?: string; status: string;
    scheduledAt?: string; sentAt?: string; openedAt?: string; createdAt: string;
    isStarred?: boolean; isArchived?: boolean;
}
export interface CreateEmailDto {
    subject: string; body: string; toEmail: string; ccEmails?: string; bccEmails?: string;
    scheduledAt?: string; templateId?: string;
    relatedCustomerId?: string; relatedLeadId?: string; relatedDealId?: string;
}

@Injectable({ providedIn: 'root' })
export class EmailFeatureService {
    constructor(private api: ApiService) { }
    getPaged(page = 1, size = 20): Observable<Email[]> { return this.api.get<Email[]>('emails', { pageNumber: page, pageSize: size }); }
    getById(id: string): Observable<Email> { return this.api.get<Email>(`emails/${id}`); }
    send(dto: CreateEmailDto): Observable<Email> { return this.api.post<Email>('emails', dto); }
    getTemplates(): Observable<any[]> { return this.api.get<any[]>('emails/templates'); }

    delete(id: string): Observable<any> { return this.api.delete(`emails/${id}`); }
    toggleStar(id: string): Observable<Email> { return this.api.patch<Email>(`emails/${id}/star`, {}); }
    archive(id: string): Observable<Email> { return this.api.patch<Email>(`emails/${id}/archive`, {}); }
}
