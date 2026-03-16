import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiveChatService, LiveSession, LiveMessage } from '../../core/services/live-chat.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { LucideAngularModule, Headset, UserPlus, Send } from 'lucide-angular';

@Component({
  selector: 'app-live-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fadeIn livechat-layout">
      <div class="sessions-panel">
        <div class="sessions-header">
          <h3><lucide-icon [img]="Headset" class="inline-icon" style="width:1.1rem;height:1.1rem"></lucide-icon> Live Chat</h3>
          <div class="session-stats">
            <span class="badge badge-red">{{waitingCount()}} waiting</span>
            <span class="badge badge-green">{{activeCount()}} active</span>
          </div>
        </div>
        <div class="session-tabs">
          <button *ngFor="let s of statuses" class="s-tab" [class.active]="filter()===s" (click)="filter.set(s)">{{s}}</button>
        </div>
        <div class="session-list">
          <div class="session-item" *ngFor="let s of filteredSessions()"
               [class.active]="selectedSession()?.id===s.id"
               [class.waiting]="s.status==='Waiting'"
               (click)="selectSession(s)">
            <div class="visitor-avatar">{{s.visitorName[0].toUpperCase()}}</div>
            <div class="session-info">
              <div class="visitor-name">{{s.visitorName}}</div>
              <div class="text-sm text-muted">{{s.visitorEmail}}</div>
              <span class="badge" [ngClass]="{'badge-yellow':s.status==='Waiting','badge-green':s.status==='Active','badge-gray':s.status==='Closed'}">{{s.status}}</span>
            </div>
          </div>
          <div *ngIf="filteredSessions().length===0" class="empty-sessions">
            <p class="text-sm text-muted">No {{filter()}} sessions</p>
          </div>
        </div>
      </div>

      <div class="livechat-main">
        <div class="livechat-empty" *ngIf="!selectedSession()">
          <div class="empty-icon text-muted"><lucide-icon [img]="Headset" style="width:48px;height:48px;"></lucide-icon></div>
          <div class="empty-title">Select a session</div>
        </div>
        <ng-container *ngIf="selectedSession()">
          <div class="livechat-header">
            <div class="visitor-info">
              <div class="visitor-avatar">{{selectedSession()!.visitorName[0].toUpperCase()}}</div>
              <div>
                <div style="font-weight:700">{{selectedSession()!.visitorName}}</div>
                <div class="text-sm text-muted">{{selectedSession()!.visitorEmail}}</div>
              </div>
            </div>
            <div style="display:flex;gap:0.5rem;align-items:center">
              <button class="btn btn-secondary btn-sm flex-center" (click)="convertToCustomer()">
                <lucide-icon [img]="UserPlus" class="w-4 h-4 mr-1" style="margin-right:0.25rem"></lucide-icon> Convert to Customer
              </button>
              <span class="badge" [ngClass]="{'badge-yellow':selectedSession()!.status==='Waiting','badge-green':selectedSession()!.status==='Active','badge-gray':selectedSession()!.status==='Closed'}">
                {{selectedSession()!.status}}
              </span>
            </div>
          </div>
          <div class="livechat-messages" #chatArea>
            <div class="chat-msg" *ngFor="let msg of liveMessages()"
                 [class.agent-msg]="msg.senderType==='Agent'"
                 [class.visitor-msg]="msg.senderType==='Visitor'"
                 [class.system-msg]="msg.senderType==='System'">
              <div class="msg-label">{{msg.senderName}} · {{msg.sentAt | date:'HH:mm'}}</div>
              <div class="msg-text">{{msg.content}}</div>
            </div>
          </div>
          <div class="livechat-input" *ngIf="selectedSession()!.status !== 'Closed'">
            <input class="chat-input" [(ngModel)]="reply" placeholder="Type reply..." (keydown.enter)="sendReply()" />
            <button class="btn btn-primary btn-sm flex-center" (click)="sendReply()" [disabled]="!reply.trim()">
              Send <lucide-icon [img]="Send" class="w-4 h-4 ml-1" style="margin-left:0.4rem"></lucide-icon>
            </button>
          </div>
          <div *ngIf="selectedSession()!.status==='Closed'" style="text-align:center;padding:1rem;color:var(--text-muted);border-top:1px solid var(--border)">This session is closed.</div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .livechat-layout { display:flex; height:calc(100vh - 130px); background:var(--bg-card); border-radius:var(--radius-md); border:1px solid var(--border); overflow:hidden; }
    .sessions-panel  { width:280px; min-width:280px; border-right:1px solid var(--border); display:flex; flex-direction:column; background:var(--bg-secondary); }
    .sessions-header { padding:1rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; h3{font-size:1rem;font-weight:700} }
    .session-stats   { display:flex; gap:0.4rem; }
    .session-tabs    { display:flex; border-bottom:1px solid var(--border); }
    .s-tab { flex:1; padding:0.5rem; border:none; background:none; color:var(--text-muted); cursor:pointer; font-size:0.75rem; &.active{color:var(--accent-light);border-bottom:2px solid var(--accent);background:rgba(124,58,237,0.1)} }
    .session-list { flex:1; overflow-y:auto; }
    .session-item { display:flex; gap:0.75rem; padding:0.875rem 1rem; cursor:pointer; border-bottom:1px solid var(--border); transition:var(--transition); &:hover{background:var(--bg-hover)} &.active{background:rgba(124,58,237,0.1);border-left:3px solid var(--accent)} &.waiting{border-left:3px solid var(--warning)} }
    .visitor-avatar { width:36px; height:36px; background:linear-gradient(135deg,var(--accent),var(--info)); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:0.85rem; flex-shrink:0; }
    .visitor-name { font-weight:600; font-size:0.875rem; }
    .empty-sessions { padding:1.5rem; text-align:center; }
    .livechat-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
    .livechat-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.5rem; color:var(--text-muted); .empty-icon{font-size:3rem;opacity:0.5} }
    .livechat-header { padding:0.875rem 1.25rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
    .visitor-info { display:flex; align-items:center; gap:0.75rem; }
    .livechat-messages { flex:1; overflow-y:auto; padding:1rem; display:flex; flex-direction:column; gap:0.75rem; }
    .chat-msg { max-width:75%; padding:0.6rem 0.875rem; border-radius:12px; }
    .msg-label { font-size:0.65rem; color:var(--text-muted); margin-bottom:0.25rem; }
    .msg-text { font-size:0.875rem; line-height:1.5; }
    .visitor-msg { background:var(--bg-secondary); border:1px solid var(--border); align-self:flex-start; }
    .agent-msg   { background:var(--accent); color:#fff; align-self:flex-end; .msg-label{color:rgba(255,255,255,0.7)} }
    .system-msg  { align-self:center; background:rgba(100,116,139,0.1); color:var(--text-muted); font-size:0.75rem; max-width:none; text-align:center; }
    .livechat-input { padding:1rem; border-top:1px solid var(--border); display:flex; gap:0.75rem; }
    .chat-input { flex:1; background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius-sm); padding:0.6rem 1rem; color:var(--text-primary); font-size:0.875rem; outline:none; &:focus{border-color:var(--accent)} }
  `]
})
export class LiveChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatArea') chatArea!: ElementRef;

  sessions = signal<LiveSession[]>([]);
  liveMessages = signal<LiveMessage[]>([]);
  selectedSession = signal<LiveSession | null>(null);
  filter = signal('All');
  reply = '';
  statuses = ['All', 'Waiting', 'Active', 'Closed'];

  readonly Headset = Headset;
  readonly UserPlus = UserPlus;
  readonly Send = Send;

  constructor(private liveChat: LiveChatService, private toast: ToastService) { }

  ngOnInit() {
    this.load();
    this.liveChat.connect();
    this.liveChat.message$.subscribe(msg => this.liveMessages.update(m => [...m, msg]));
    this.liveChat.newSession$.subscribe(() => this.load());
    this.liveChat.sessionUpdated$.subscribe(updated => {
      this.sessions.update(list => list.map(s => s.id === updated.id ? updated : s));
      if (this.selectedSession()?.id === updated.id) this.selectedSession.set(updated);
    });
  }

  ngOnDestroy() { /* LiveChatService manages hub lifecycle */ }

  ngAfterViewChecked() {
    try { if (this.chatArea) this.chatArea.nativeElement.scrollTop = this.chatArea.nativeElement.scrollHeight; } catch { }
  }

  load() {
    this.liveChat.getSessions().subscribe({ next: s => this.sessions.set(s), error: () => { } });
  }

  filteredSessions(): LiveSession[] {
    return this.filter() === 'All' ? this.sessions() : this.sessions().filter(s => s.status === this.filter());
  }

  waitingCount(): number { return this.sessions().filter(s => s.status === 'Waiting').length; }
  activeCount(): number { return this.sessions().filter(s => s.status === 'Active').length; }



  selectSession(s: LiveSession) {
    this.selectedSession.set(s);
    this.liveMessages.set([]);
    this.liveChat.getMessages(s.id).subscribe({
      next: d => this.liveMessages.set(d.messages ?? (d as any)),
      error: () => { }
    });
  }

  sendReply() {
    if (!this.reply.trim() || !this.selectedSession()) return;
    this.liveChat.sendAgentMessage(this.selectedSession()!.id, this.reply.trim());
    this.reply = '';
  }

  convertToCustomer() {
    if (!this.selectedSession()) return;
    this.liveChat.convertToCustomer(this.selectedSession()!.id).subscribe({
      next: () => this.toast.success('Converted!', 'Visitor successfully added as CRM Customer.'),
      error: () => this.toast.error('Failed', 'Could not convert to customer.')
    });
  }
}
