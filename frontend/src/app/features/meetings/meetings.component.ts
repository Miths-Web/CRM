import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MeetingsService, Meeting } from '../../core/services/meetings.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { environment } from '../../../environments/environment';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { LucideAngularModule, Video, Plus, Radio, Link, Calendar } from 'lucide-angular';

@Component({
  selector: 'app-meetings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, LucideAngularModule],
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h2 class="page-title">Meetings</h2>
          <p class="page-subtitle">Video meetings powered by Jitsi — no installs needed</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()"><lucide-icon [img]="Plus" class="btn-icon-sm"></lucide-icon> Schedule Meeting</button>
      </div>

      <!-- Active Meeting Banner -->
      <div class="meeting-active-banner" *ngIf="activeMeeting()">
        <div class="banner-info">
          <span class="live-badge flex-center"><lucide-icon [img]="Radio" class="w-3 h-3 mr-1" style="margin-right:0.25rem"></lucide-icon> LIVE</span>
          <strong>{{activeMeeting()?.title}}</strong>
          <span class="text-muted text-sm">is ongoing</span>
        </div>
        <button class="btn btn-primary btn-sm flex-center" (click)="joinMeeting(activeMeeting()!)"><lucide-icon [img]="Video" class="btn-icon-sm"></lucide-icon> Join Now</button>
      </div>

      <!-- Meetings List -->
      <div class="meetings-list">
        <div *ngIf="meetings().length === 0" class="card">
          <div class="empty-state">
            <div class="empty-icon text-muted"><lucide-icon [img]="Video" style="width:48px;height:48px;"></lucide-icon></div>
            <div class="empty-title">No meetings scheduled</div>
            <p class="empty-text">Schedule your first video meeting with your team or clients.</p>
          </div>
        </div>

        <div class="meeting-card" *ngFor="let m of meetings()">
          <div class="meeting-left">
            <div class="meeting-time">
              <div class="meeting-date">{{m.startTime | date:'dd MMM'}}</div>
              <div class="meeting-hr">{{m.startTime | date:'HH:mm'}}</div>
            </div>
          </div>
          <div class="meeting-content">
            <div class="meeting-title">{{m.title}}</div>
            <div class="meeting-desc text-muted text-sm" *ngIf="m.description">{{m.description}}</div>
            <div class="meeting-meta">
              <span class="badge" [ngClass]="{'badge-green':m.status==='Ongoing','badge-blue':m.status==='Scheduled','badge-gray':m.status==='Ended'}">
                {{m.status}}
              </span>
              <span class="text-sm text-muted flex items-center"><lucide-icon [img]="Link" class="w-3 h-3 mr-1" style="margin-right:0.25rem"></lucide-icon> {{m.jitsiRoomName}}</span>
            </div>
          </div>
          <div class="meeting-actions">
            <button class="btn btn-primary btn-sm flex-center" (click)="joinMeeting(m)"><lucide-icon [img]="Video" class="btn-icon-sm"></lucide-icon> Join</button>
            <button class="btn btn-secondary btn-sm flex-center" (click)="copyLink(m)"><lucide-icon [img]="Link" class="btn-icon-sm"></lucide-icon> Copy Link</button>
          </div>
        </div>
      </div>

      <!-- Embedded Jitsi -->
      <div class="jitsi-container" *ngIf="activeRoom()">
        <div class="jitsi-header">
          <span class="flex items-center"><lucide-icon [img]="Video" class="inline-icon" style="margin-right:0.5rem"></lucide-icon> {{activeRoom()?.title}}</span>
          <button class="btn btn-danger btn-sm" (click)="leaveRoom()">Leave Meeting</button>
        </div>
        <iframe [src]="jitsiUrl()" allow="camera; microphone; fullscreen; display-capture"
                class="jitsi-frame" allowfullscreen></iframe>
      </div>

      <!-- Schedule Modal -->
      <app-modal [isOpen]="showModal()" [title]="'Schedule Meeting'" [maxWidth]="'580px'" (close)="closeModal()">
        <ng-container header-icon><lucide-icon [img]="Calendar" class="inline-icon" style="margin-right:0.5rem"></lucide-icon></ng-container>
        <form [formGroup]="form">
          <div class="form-group">
            <label class="form-label">Meeting Title *</label>
            <input formControlName="title" class="form-control" placeholder="Q1 Sales Review" />
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Description</label>
            <textarea formControlName="description" class="form-control" rows="2"></textarea>
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">Start Time *</label>
              <input type="datetime-local" formControlName="startTime" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">End Time</label>
              <input type="datetime-local" formControlName="endTime" class="form-control" />
            </div>
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Attendees (email, comma separated)</label>
            <input formControlName="attendees" class="form-control" placeholder="alice@co.com, bob@co.com" />
          </div>
        </form>
        <div modal-footer>
          <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary flex-center" (click)="save()" [disabled]="form.invalid || saving()">
            <lucide-icon *ngIf="!saving()" [img]="Calendar" class="btn-icon-sm"></lucide-icon>
            {{saving() ? 'Scheduling...' : 'Schedule'}}
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .meeting-active-banner { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: var(--radius-md);
      padding: 0.875rem 1.25rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .banner-info { display: flex; align-items: center; gap: 0.75rem; }
    .live-badge { background: var(--danger); color: #fff; font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 4px; animation: pulse 1.5s infinite; }

    .meetings-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .meeting-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem;
      display: flex; align-items: center; gap: 1.25rem; transition: var(--transition);
      &:hover { border-color: var(--border-accent); }
    }
    .meeting-left { display: flex; flex-direction: column; align-items: center; min-width: 50px; }
    .meeting-date { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
    .meeting-hr   { font-size: 1.1rem; font-weight: 800; color: var(--accent-light); }
    .meeting-content { flex: 1; }
    .meeting-title { font-weight: 700; margin-bottom: 0.25rem; }
    .meeting-meta  { display: flex; gap: 0.75rem; align-items: center; margin-top: 0.4rem; }
    .meeting-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }

    .jitsi-container { margin-top: 1rem; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); }
    .jitsi-header { padding: 0.75rem 1rem; background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center; font-weight: 700; }
    .jitsi-frame  { width: 100%; height: 600px; border: none; display: block; }
    .btn-danger { background: var(--danger); color: #fff; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
  `]
})
export class MeetingsComponent implements OnInit {
  meetings = signal<Meeting[]>([]);
  activeMeeting = signal<Meeting | null>(null);
  activeRoom = signal<Meeting | null>(null);
  showModal = signal(false);
  saving = signal(false);
  form: FormGroup;

  readonly Video = Video;
  readonly Plus = Plus;
  readonly Radio = Radio;
  readonly Link = Link;
  readonly Calendar = Calendar;

  constructor(
    private meetingsSvc: MeetingsService,
    private toast: ToastService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      startTime: ['', Validators.required],
      endTime: [''],
      attendees: ['']
    });
  }

  ngOnInit() { this.load(); }

  load() {
    this.meetingsSvc.getAll().subscribe({
      next: m => {
        this.meetings.set(m);
        this.activeMeeting.set(m.find(x => x.status === 'Ongoing') ?? null);
      },
      error: () => this.toast.error('Load Failed', 'Could not fetch meetings.')
    });
  }

  openCreateModal() { this.form.reset(); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.meetingsSvc.create(this.form.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.toast.success('Meeting Scheduled', 'Your meeting has been created.');
      },
      error: (e: any) => {
        this.saving.set(false);
        this.toast.error('Save Failed', e.message ?? 'Could not schedule meeting.');
      }
    });
  }

  joinMeeting(m: Meeting) { this.activeRoom.set(m); window.scrollTo(0, document.body.scrollHeight); }
  leaveRoom() { this.activeRoom.set(null); }

  jitsiUrl(): SafeResourceUrl {
    if (!this.activeRoom()) return '';
    const url = `${environment.jitsiServer}/${this.activeRoom()!.jitsiRoomName}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  copyLink(m: Meeting) {
    const url = `${environment.jitsiServer}/${m.jitsiRoomName}`;
    navigator.clipboard.writeText(url).then(() =>
      this.toast.success('Link Copied!', 'Meeting link has been copied to clipboard.')
    ).catch(() =>
      this.toast.error('Copy Failed', 'Could not copy to clipboard.')
    );
  }
}
