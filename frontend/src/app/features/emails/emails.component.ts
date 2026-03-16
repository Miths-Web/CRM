import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmailFeatureService, Email, CreateEmailDto } from './services/email.service';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { LucideAngularModule, Mail, Send, RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-angular';

@Component({
  selector: 'app-emails',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent, ModalComponent, LucideAngularModule],
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h2 class="page-title"><lucide-icon [img]="Mail" class="inline-icon"></lucide-icon> Emails</h2>
          <p class="page-subtitle">Send and track your CRM emails via SendGrid</p>
        </div>
        <button class="btn btn-primary" (click)="showCompose.set(true)"><lucide-icon [img]="Send" class="btn-icon-sm"></lucide-icon> Compose Email</button>
      </div>

      <div class="card" style="padding:0">
        <app-data-table [data]="emails()" [columns]="columns" [pageSize]="15"
                        searchPlaceholder="Search emails..."
                        emptyTitle="No emails sent yet"
                        emptyText="Compose your first email to get started.">
          <div toolbar-actions>
            <button class="btn btn-secondary btn-sm" (click)="load()"><lucide-icon [img]="RefreshCw" class="btn-icon-sm"></lucide-icon> Refresh</button>
          </div>
        </app-data-table>
      </div>

      <app-modal [isOpen]="showCompose()" [title]="'Compose Email'" [maxWidth]="'640px'" (close)="showCompose.set(false)">
        <ng-container header-icon><lucide-icon [img]="Send" class="inline-icon" style="margin-right:0.5rem"></lucide-icon></ng-container>
        <form [formGroup]="form">
          <div class="form-group">
            <label class="form-label">To *</label>
            <input type="email" formControlName="toEmail" class="form-control" placeholder="recipient@company.com" />
          </div>
          <div class="grid-2" style="margin-top:1rem">
            <div class="form-group">
              <label class="form-label">CC</label>
              <input formControlName="ccEmails" class="form-control" placeholder="cc@company.com" />
            </div>
            <div class="form-group">
              <label class="form-label">BCC</label>
              <input formControlName="bccEmails" class="form-control" placeholder="bcc@company.com" />
            </div>
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Subject *</label>
            <input formControlName="subject" class="form-control" placeholder="Email subject" />
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Message *</label>
            <textarea formControlName="body" class="form-control" rows="6" placeholder="Write your email here..."></textarea>
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Schedule Send (Optional)</label>
            <input type="datetime-local" formControlName="scheduledAt" class="form-control" />
          </div>
          <div *ngIf="error()" class="form-error mt-4"><lucide-icon [img]="AlertTriangle" class="inline-icon"></lucide-icon> {{error()}}</div>
          <div *ngIf="success()" class="form-success mt-4"><lucide-icon [img]="CheckCircle2" class="inline-icon"></lucide-icon> {{success()}}</div>
        </form>
        <div modal-footer>
          <button class="btn btn-secondary" (click)="showCompose.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="sendEmail()" [disabled]="sending() || form.invalid">
            <lucide-icon [img]="form.value.scheduledAt ? Clock : Send" class="btn-icon-sm"></lucide-icon>
            {{sending() ? 'Sending...' : (form.value.scheduledAt ? 'Schedule' : 'Send Now')}}
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .form-error   { padding: 0.75rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-sm); color: #fca5a5; }
    .form-success { padding: 0.75rem; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: var(--radius-sm); color: #6ee7b7; }
  `]
})
export class EmailsComponent implements OnInit {
  emails = signal<Email[]>([]);
  showCompose = signal(false);
  sending = signal(false);
  error = signal('');
  success = signal('');

  readonly Mail = Mail;
  readonly Send = Send;
  readonly RefreshCw = RefreshCw;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;

  columns: TableColumn[] = [
    { key: 'toEmail', label: 'To', sortable: true },
    { key: 'subject', label: 'Subject', sortable: true },
    {
      key: 'status', label: 'Status', type: 'badge',
      badgeMap: { Sent: 'badge-green', Draft: 'badge-gray', Scheduled: 'badge-blue', Failed: 'badge-red' }
    },
    { key: 'sentAt', label: 'Sent At', type: 'date' },
    { key: 'openedAt', label: 'Opened', type: 'date' },
    { key: 'createdAt', label: 'Created', type: 'date' }
  ];

  form: FormGroup;
  constructor(private emailService: EmailFeatureService, private fb: FormBuilder) {
    this.form = this.fb.group({
      toEmail: ['', [Validators.required, Validators.email]],
      ccEmails: [''], bccEmails: [''],
      subject: ['', Validators.required],
      body: ['', Validators.required],
      scheduledAt: ['']
    });
  }

  ngOnInit() { this.load(); }
  load() { this.emailService.getPaged().subscribe({ next: d => this.emails.set(d) }); }

  sendEmail() {
    if (this.form.invalid) return;
    this.sending.set(true); this.error.set(''); this.success.set('');
    const dto = this.form.value as CreateEmailDto;
    this.emailService.send(dto).subscribe({
      next: () => {
        this.sending.set(false);
        this.success.set(dto.scheduledAt ? 'Email scheduled successfully!' : 'Email sent successfully!');
        setTimeout(() => { this.showCompose.set(false); this.load(); }, 1500);
      },
      error: (e) => { this.sending.set(false); this.error.set(e.message); }
    });
  }
}
