import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CalendarService, CalendarEvent, CalendarEventCreateDto } from '../../core/services/calendar.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LucideAngularModule, Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-angular';

interface CalendarDay { date: Date; isCurrentMonth: boolean; isToday: boolean; events: CalendarEvent[]; }

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ConfirmDialogComponent, LucideAngularModule],
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h2 class="page-title">Calendar</h2>
          <p class="page-subtitle">Schedule and manage your events</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()"><lucide-icon [img]="Plus" class="btn-icon-sm"></lucide-icon> New Event</button>
      </div>

      <!-- Calendar Navigation -->
      <div class="cal-nav">
        <button class="btn btn-secondary btn-sm" (click)="prevMonth()">‹</button>
        <h3 class="cal-title">{{currentDate | date:'MMMM yyyy'}}</h3>
        <button class="btn btn-secondary btn-sm" (click)="nextMonth()">›</button>
        <button class="btn btn-secondary btn-sm" (click)="goToday()">Today</button>
      </div>

      <!-- Calendar Grid -->
      <div class="card" style="padding:0;overflow:hidden">
        <div class="cal-grid">
          <div class="cal-day-header" *ngFor="let d of dayHeaders">{{d}}</div>
          <div class="cal-day" *ngFor="let day of calendarDays()"
               [class.other-month]="!day.isCurrentMonth"
               [class.today]="day.isToday"
               [class.has-events]="day.events.length > 0"
               (click)="selectDay(day)">
            <div class="day-num">{{day.date | date:'d'}}</div>
            <div class="day-events">
              <div class="event-pill" *ngFor="let e of day.events.slice(0,3)"
                   [style.background]="e.color || 'var(--accent)'"
                   (click)="$event.stopPropagation(); openEditModal(e)"
                   [title]="e.title">
                {{e.title | slice:0:18}}{{e.title.length > 18 ? '...' : ''}}
              </div>
              <div class="more-events" *ngIf="day.events.length > 3">+{{day.events.length - 3}} more</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Event Modal -->
      <app-modal [isOpen]="showModal()" [title]="editingId() ? 'Edit Event' : 'New Event'" [maxWidth]="'600px'" (close)="closeModal()">
        <form [formGroup]="form">
          <div class="form-group">
            <label class="form-label">Event Title *</label>
            <input formControlName="title" class="form-control" placeholder="Meeting with client" />
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select formControlName="type" class="form-control">
                <option value="Meeting">Meeting</option>
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Task">Task</option>
                <option value="Reminder">Reminder</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Color</label>
              <input type="color" formControlName="color" class="form-control" style="height:42px;padding:4px" />
            </div>
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">Start *</label>
              <input type="datetime-local" formControlName="startDateTime" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">End</label>
              <input type="datetime-local" formControlName="endDateTime" class="form-control" />
            </div>
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Location</label>
            <input formControlName="location" class="form-control" placeholder="Office / Zoom / Address" />
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Description</label>
            <textarea formControlName="description" class="form-control" rows="2"></textarea>
          </div>
        </form>
        <div modal-footer>
          <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button *ngIf="editingId()" class="btn btn-danger btn-sm" (click)="confirmDelete(editingEvent()!)">
            <lucide-icon [img]="Trash2" class="btn-icon-sm"></lucide-icon> Delete
          </button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving() || form.invalid">
            {{saving() ? 'Saving...' : (editingId() ? 'Update' : 'Create Event')}}
          </button>
        </div>
      </app-modal>

      <app-confirm-dialog [isOpen]="showDeleteDialog()" title="Delete Event?"
        [message]="'Delete: ' + (deletingEvent()?.title ?? '') + '?'"
        (confirm)="doDelete()" (cancel)="showDeleteDialog.set(false)">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    .cal-nav { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .cal-title { flex: 0; font-size: 1.1rem; font-weight: 700; min-width: 180px; text-align: center; }

    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    .cal-day-header { padding: 0.6rem; text-align: center; font-size: 0.7rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted);
      background: var(--bg-secondary); border-bottom: 1px solid var(--border); }
    .cal-day { min-height: 100px; padding: 0.5rem; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border);
      cursor: pointer; transition: var(--transition);
      &:nth-child(7n) { border-right: none; }
      &:hover { background: var(--bg-hover); }
      &.other-month { opacity: 0.35; }
      &.today { background: rgba(124,58,237,0.08); border-color: var(--accent); }
      &.today .day-num { background: var(--accent); color: #fff; border-radius: 50%; width: 24px; height: 24px;
        display: flex; align-items: center; justify-content: center; font-weight: 700; }
    }
    .day-num { font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem; }
    .day-events { display: flex; flex-direction: column; gap: 2px; }
    .event-pill { font-size: 0.65rem; padding: 2px 5px; border-radius: 3px; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer;
      opacity: 0.9; &:hover { opacity: 1; } }
    .more-events { font-size: 0.6rem; color: var(--text-muted); padding: 1px 4px; }
    .btn-danger { background: var(--danger); color: #fff; }
  `]
})
export class CalendarComponent implements OnInit {
  events = signal<CalendarEvent[]>([]);
  calendarDays = signal<CalendarDay[]>([]);
  showModal = signal(false);
  showDeleteDialog = signal(false);
  editingId = signal<string | null>(null);
  editingEvent = signal<CalendarEvent | null>(null);
  deletingEvent = signal<CalendarEvent | null>(null);
  saving = signal(false);
  currentDate = new Date();
  dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  form: FormGroup;

  readonly CalendarIcon = CalendarIcon;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;

  constructor(private calSvc: CalendarService, private toast: ToastService, private fb: FormBuilder) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      type: ['Meeting'],
      startDateTime: ['', Validators.required],
      endDateTime: [''],
      isAllDay: [false],
      location: [''],
      color: ['#7c3aed'],
      description: ['']
    });
  }

  ngOnInit() { this.loadMonth(); }

  loadMonth() {
    const start = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1).toISOString();
    const end = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).toISOString();
    this.calSvc.getAll({ start, end }).subscribe({ next: (e: CalendarEvent[]) => { this.events.set(e); this.buildCalendar(); } });
    this.buildCalendar();
  }

  buildCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    const days: CalendarDay[] = [];

    // Previous month padding
    for (let i = firstDay.getDay(); i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({ date: d, isCurrentMonth: false, isToday: false, events: [] });
    }
    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const isToday = date.toDateString() === today.toDateString();
      const evts = this.events().filter(e => new Date(e.startDate).toDateString() === date.toDateString());
      days.push({ date, isCurrentMonth: true, isToday, events: evts });
    }
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false, isToday: false, events: [] });
    }
    this.calendarDays.set(days);
  }

  prevMonth() { this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1); this.loadMonth(); }
  nextMonth() { this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1); this.loadMonth(); }
  goToday() { this.currentDate = new Date(); this.loadMonth(); }
  selectDay(day: CalendarDay) {
    if (!day.isCurrentMonth) return;
    const dt = day.date.toISOString().slice(0, 16);
    this.openCreateModal(dt);
  }

  openCreateModal(dt?: string) {
    this.editingId.set(null); this.editingEvent.set(null);
    this.form.reset({ type: 'Meeting', color: '#7c3aed', startDateTime: dt ?? '' });
    this.showModal.set(true);
  }
  openEditModal(e: CalendarEvent) {
    this.editingId.set(e.id); this.editingEvent.set(e);
    this.form.patchValue({ ...e, startDate: e.startDate?.slice(0, 16), endDate: e.endDate?.slice(0, 16) });
    this.showModal.set(true);
  }
  closeModal() { this.showModal.set(false); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const obs: any = this.editingId()
      ? this.calSvc.update(this.editingId()!, this.form.value)
      : this.calSvc.create(this.form.value);
    obs.subscribe({ next: () => { this.saving.set(false); this.closeModal(); this.loadMonth(); }, error: (e: any) => { this.saving.set(false); this.toast.error('Save Failed', e.message ?? 'Could not save event.'); } });
  }

  confirmDelete(e: CalendarEvent) { this.deletingEvent.set(e); this.showDeleteDialog.set(true); }
  doDelete() { this.calSvc.delete(this.deletingEvent()!.id).subscribe({ next: () => { this.closeModal(); this.showDeleteDialog.set(false); this.loadMonth(); } }); }
}
