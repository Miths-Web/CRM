import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage, ChatRoom } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, MessageSquare, RefreshCw, Hash, Wifi, WifiOff, Send } from 'lucide-angular';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fadeIn chat-layout">
      <!-- Sidebar — Rooms -->
      <div class="chat-sidebar">
        <div class="chat-sidebar-header">
          <h3><lucide-icon [img]="MessageSquare" class="inline-icon" style="width:1.1rem;height:1.1rem"></lucide-icon> Team Chat</h3>
          <button class="btn btn-secondary btn-sm" (click)="loadRooms()"><lucide-icon [img]="RefreshCw" class="btn-icon-sm"></lucide-icon></button>
        </div>
        <div class="room-list">
          <div class="room-item" *ngFor="let room of rooms()"
               [class.active]="selectedRoom()?.id === room.id"
               (click)="selectRoom(room)">
            <div class="room-icon"><lucide-icon [img]="Hash" class="w-4 h-4"></lucide-icon></div>
            <div class="room-info">
              <div class="room-name">{{room.name}}</div>
              <div class="room-last text-sm text-muted" *ngIf="room.lastMessage">{{room.lastMessage | slice:0:35}}</div>
            </div>
          </div>
          <div class="empty-state" style="padding:1rem" *ngIf="rooms().length === 0">
            <p class="text-sm text-muted">No chat rooms yet</p>
          </div>
        </div>
      </div>

      <!-- Main Chat Window -->
      <div class="chat-main">
        <div class="chat-header" *ngIf="selectedRoom()">
          <div class="chat-room-title flex items-center gap-1"><lucide-icon [img]="Hash" class="inline-icon"></lucide-icon> {{selectedRoom()?.name}}</div>
          <div class="chat-status flex-center" [class.connected]="connected()">
            <lucide-icon [img]="connected() ? Wifi : WifiOff" class="w-3 h-3 mr-1" style="margin-right:0.25rem"></lucide-icon>
            {{connected() ? 'Connected' : 'Connecting...'}}
          </div>
        </div>

        <div class="chat-empty" *ngIf="!selectedRoom()">
          <div class="empty-icon text-muted"><lucide-icon [img]="MessageSquare" style="width:48px;height:48px;"></lucide-icon></div>
          <div class="empty-title">Select a room to start chatting</div>
        </div>

        <ng-container *ngIf="selectedRoom()">
          <!-- Messages -->
          <div class="messages-area" #msgArea>
            <div class="msg-day-divider" *ngIf="messages().length > 0">Today</div>
            <div class="message-wrapper" *ngFor="let msg of messages()"
                 [class.own]="msg.isOwn">
              <div class="msg-avatar" *ngIf="!msg.isOwn">
                {{msg.senderName.charAt(0).toUpperCase()}}
              </div>
              <div class="msg-bubble">
                <div class="msg-sender" *ngIf="!msg.isOwn">{{msg.senderName}}</div>
                <div class="msg-content">{{msg.content}}</div>
                <div class="msg-time">{{msg.sentAt | date:'HH:mm'}}</div>
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="chat-input-area">
            <input class="chat-input" [(ngModel)]="newMessage" placeholder="Type a message..."
                   (keydown.enter)="sendMessage()" [disabled]="!connected()" />
            <button class="btn btn-primary btn-sm flex-center" (click)="sendMessage()" [disabled]="!connected() || !newMessage.trim()">
              Send <lucide-icon [img]="Send" class="w-4 h-4 ml-1" style="margin-left:0.4rem"></lucide-icon>
            </button>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .chat-layout { display: flex; height: calc(100vh - 130px); background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border); overflow: hidden; }

    .chat-sidebar { width: 260px; min-width: 260px; border-right: 1px solid var(--border); display: flex; flex-direction: column; background: var(--bg-secondary); }
    .chat-sidebar-header { padding: 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); h3 { font-size: 1rem; font-weight: 700; } }

    .room-list { flex: 1; overflow-y: auto; padding: 0.5rem; }
    .room-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition);
      &:hover { background: var(--bg-hover); }
      &.active { background: rgba(124,58,237,0.15); border-left: 2px solid var(--accent); }
    }
    .room-icon { width: 32px; height: 32px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.8rem; flex-shrink: 0; }
    .room-name  { font-size: 0.875rem; font-weight: 600; }
    .room-last  { font-size: 0.7rem; }

    .chat-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .chat-header { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .chat-room-title { font-weight: 700; font-size: 1rem; }
    .chat-status { font-size: 0.75rem; color: var(--text-muted); &.connected { color: var(--success); } }

    .chat-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: 0.5rem; .empty-icon { font-size: 3rem; opacity: 0.5; } }

    .messages-area { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .msg-day-divider { text-align: center; font-size: 0.7rem; color: var(--text-muted); margin: 0.5rem 0;
      &::before, &::after { content: ''; flex: 1; height: 1px; background: var(--border); }
      display: flex; align-items: center; gap: 0.5rem;
    }

    .message-wrapper { display: flex; gap: 0.5rem; align-items: flex-end;
      &.own { flex-direction: row-reverse; }
    }
    .msg-avatar { width: 28px; height: 28px; background: linear-gradient(135deg, var(--accent), var(--accent-light));
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; }
    .msg-bubble { max-width: 60%; }
    .msg-sender  { font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.15rem; }
    .msg-content { background: var(--bg-secondary); border-radius: 12px; padding: 0.6rem 0.875rem; font-size: 0.875rem; word-break: break-word; border: 1px solid var(--border); }
    .message-wrapper.own .msg-content { background: var(--accent); color: #fff; border-color: var(--accent); }
    .msg-time    { font-size: 0.6rem; color: var(--text-muted); margin-top: 0.2rem; }
    .message-wrapper.own .msg-time { text-align: right; }

    .chat-input-area { padding: 1rem; border-top: 1px solid var(--border); display: flex; gap: 0.75rem; }
    .chat-input { flex: 1; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.6rem 1rem; color: var(--text-primary); font-size: 0.875rem; outline: none;
      &:focus { border-color: var(--accent); }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('msgArea') msgArea!: ElementRef;

  rooms = signal<ChatRoom[]>([]);
  messages = signal<ChatMessage[]>([]);
  selectedRoom = signal<ChatRoom | null>(null);
  connected = signal(false);
  newMessage = '';

  readonly MessageSquare = MessageSquare;
  readonly RefreshCw = RefreshCw;
  readonly Hash = Hash;
  readonly Wifi = Wifi;
  readonly WifiOff = WifiOff;
  readonly Send = Send;

  constructor(private chatSvc: ChatService, private auth: AuthService) { }

  ngOnInit() {
    this.loadRooms();
    this.chatSvc.connect();
    this.chatSvc.connected$.subscribe(c => this.connected.set(c));
    this.chatSvc.message$.subscribe(msg => {
      const me = this.auth.getCurrentUser();
      this.messages.update(msgs => [...msgs, { ...msg, isOwn: msg.senderId === me?.id }]);
    });
  }

  ngOnDestroy() {
    if (this.selectedRoom()) this.chatSvc.leaveRoom(this.selectedRoom()!.id);
    // Keep hub alive for other pages — don't disconnect
  }

  ngAfterViewChecked() { this.scrollToBottom(); }

  loadRooms() {
    this.chatSvc.getRooms().subscribe({
      next: r => this.rooms.set(r),
      error: () => { }
    });
  }

  selectRoom(room: ChatRoom) {
    if (this.selectedRoom()) this.chatSvc.leaveRoom(this.selectedRoom()!.id);
    this.selectedRoom.set(room);
    this.messages.set([]);
    this.chatSvc.getMessages(room.id).subscribe({
      next: msgs => {
        const me = this.auth.getCurrentUser();
        this.messages.set(msgs.map((m: ChatMessage) => ({ ...m, isOwn: m.senderId === me?.id })));
      }
    });
    this.chatSvc.joinRoom(room.id);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedRoom() || !this.connected()) return;
    this.chatSvc.sendMessage(this.selectedRoom()!.id, this.newMessage.trim());
    this.newMessage = '';
  }

  private scrollToBottom() {
    try { if (this.msgArea) this.msgArea.nativeElement.scrollTop = this.msgArea.nativeElement.scrollHeight; } catch { }
  }
}
