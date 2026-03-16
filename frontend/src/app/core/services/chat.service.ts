import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface ChatRoom {
    id: string;
    name: string;
    description?: string;
    type: 'Public' | 'Private' | 'Direct';
    memberCount: number;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount?: number;
}

export interface ChatMessage {
    id?: string;
    roomId: string;
    content: string;
    senderId: string;
    senderName: string;
    senderInitials: string;
    sentAt: string;
    type?: 'text' | 'file' | 'system';
    fileUrl?: string;
    isOwn?: boolean;  // UI-only flag — set by component
}

@Injectable({ providedIn: 'root' })
export class ChatService {
    private hub: signalR.HubConnection | null = null;

    /** Stream of incoming new messages */
    message$ = new Subject<ChatMessage>();

    /** Connection status */
    connected$ = new BehaviorSubject<boolean>(false);

    /** Typing indicators: { roomId, userName } */
    typing$ = new Subject<{ roomId: string; userName: string }>();

    constructor(private auth: AuthService, private api: ApiService) { }

    // ── Hub Connection ────────────────────────────────────────────
    connect(): void {
        if (this.hub?.state === signalR.HubConnectionState.Connected) return;

        this.hub = new signalR.HubConnectionBuilder()
            .withUrl(`${environment.hubUrl}/chat`, {
                withCredentials: true
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        this.hub.on('ReceiveMessage', (msg: ChatMessage) => this.message$.next(msg));
        this.hub.on('UserTyping', (roomId: string, userName: string) => this.typing$.next({ roomId, userName }));
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

    joinRoom(roomId: string): Promise<void> {
        return this.hub?.invoke('JoinRoom', roomId) ?? Promise.resolve();
    }

    leaveRoom(roomId: string): Promise<void> {
        return this.hub?.invoke('LeaveRoom', roomId) ?? Promise.resolve();
    }

    sendMessage(roomId: string, content: string): Promise<void> {
        return this.hub?.invoke('SendMessage', roomId, content) ?? Promise.resolve();
    }

    sendTyping(roomId: string): Promise<void> {
        return this.hub?.invoke('SendTyping', roomId) ?? Promise.resolve();
    }

    // ── REST API (rooms & history) ────────────────────────────────
    getRooms(): Observable<ChatRoom[]> {
        return this.api.get<ChatRoom[]>('chat/rooms');
    }

    createRoom(dto: { name: string; description?: string; type?: string }): Observable<ChatRoom> {
        return this.api.post<ChatRoom>('chat/rooms', dto);
    }

    getMessages(roomId: string, params?: { before?: string; limit?: number }): Observable<ChatMessage[]> {
        return this.api.get<ChatMessage[]>(`chat/rooms/${roomId}/messages`, params);
    }

    deleteMessage(roomId: string, messageId: string): Observable<void> {
        return this.api.delete<void>(`chat/rooms/${roomId}/messages/${messageId}`);
    }
}
