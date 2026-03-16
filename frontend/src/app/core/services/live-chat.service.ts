import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

export interface LiveSession {
    id: string;
    visitorName: string;
    visitorEmail: string;
    subject?: string;
    status: 'Waiting' | 'Active' | 'Closed';
    assignedTo?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LiveMessage {
    id?: string;
    sessionId: string;
    content: string;
    senderType: 'Visitor' | 'Agent' | 'System';
    senderName: string;
    sentAt: string;
}

@Injectable({ providedIn: 'root' })
export class LiveChatService {
    private hub: signalR.HubConnection | null = null;

    /** New incoming message */
    message$ = new Subject<LiveMessage>();

    /** New session created by a visitor */
    newSession$ = new Subject<LiveSession>();

    /** Session status changed */
    sessionUpdated$ = new Subject<LiveSession>();

    connected$ = new BehaviorSubject<boolean>(false);

    constructor(private auth: AuthService, private api: ApiService) { }

    // ── Hub ───────────────────────────────────────────────────────
    connect(): void {
        if (this.hub?.state === signalR.HubConnectionState.Connected) return;

        this.hub = new signalR.HubConnectionBuilder()
            .withUrl(`${environment.hubUrl}/livechat`, {
                withCredentials: true
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        this.hub.on('NewMessage', (msg: LiveMessage) => this.message$.next(msg));
        this.hub.on('NewSession', (session: LiveSession) => this.newSession$.next(session));
        this.hub.on('SessionUpdated', (session: LiveSession) => this.sessionUpdated$.next(session));
        this.hub.onreconnected(() => this.connected$.next(true));
        this.hub.onclose(() => this.connected$.next(false));

        this.hub.start()
            .then(() => this.connected$.next(true))
            .catch(() => this.connected$.next(false));
    }

    disconnect(): void {
        this.hub?.stop().catch(() => { });
        this.connected$.next(false);
    }

    sendAgentMessage(sessionId: string, content: string): Promise<void> {
        return this.hub?.invoke('SendAgentMessage', sessionId, content) ?? Promise.resolve();
    }

    assignSession(sessionId: string): Promise<void> {
        return this.hub?.invoke('AssignSession', sessionId) ?? Promise.resolve();
    }

    closeSession(sessionId: string): Promise<void> {
        return this.hub?.invoke('CloseSession', sessionId) ?? Promise.resolve();
    }

    // ── REST ──────────────────────────────────────────────────────
    getSessions(params?: { status?: string }): Observable<LiveSession[]> {
        return this.api.get<LiveSession[]>('livechat/sessions', params);
    }

    getSessionById(id: string): Observable<LiveSession> {
        return this.api.get<LiveSession>(`livechat/sessions/${id}`);
    }

    getMessages(sessionId: string): Observable<{ messages: LiveMessage[] }> {
        return this.api.get<{ messages: LiveMessage[] }>(`livechat/sessions/${sessionId}/messages`);
    }

    convertToCustomer(sessionId: string): Observable<{ customerId: string; message: string }> {
        return this.api.post(`livechat/sessions/${sessionId}/convert-to-customer`, {});
    }

    assignToMe(sessionId: string): Observable<LiveSession> {
        return this.api.patch<LiveSession>(`livechat/sessions/${sessionId}/assign`, {});
    }
}
