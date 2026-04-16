import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EmailFeatureService, Email, CreateEmailDto } from './services/email.service';
import { AuthService } from '../../core/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Mail, Send, RefreshCw, CheckCircle2, Clock, Inbox, Edit3, Star, Trash2, X, ChevronLeft, Reply, CornerUpLeft, MoreHorizontal, Archive, Paperclip } from 'lucide-angular';

@Component({
  selector: 'app-emails',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, DatePipe],
  template: `
    <div class="email-layout animate-fadeIn">

      <!-- ═══════════════════════════════════════ -->
      <!-- LEFT SIDEBAR (Folder nav + Compose btn) -->
      <!-- ═══════════════════════════════════════ -->
      <div class="email-sidebar">
        <div class="sidebar-compose-wrap">
          <button class="compose-btn" (click)="startCompose()">
            <lucide-icon [img]="Edit3" style="width:16px;height:16px;"></lucide-icon>
            Compose
          </button>
        </div>
        <nav class="email-nav">
          <button class="nav-item" [class.active]="activeFolder() === 'inbox'" (click)="setFolder('inbox')">
            <lucide-icon [img]="Inbox" class="nav-icon"></lucide-icon>
            <span>Inbox</span>
            <span class="nav-badge" *ngIf="inboxCount() > 0">{{inboxCount()}}</span>
          </button>
          <button class="nav-item" [class.active]="activeFolder() === 'sent'" (click)="setFolder('sent')">
            <lucide-icon [img]="Send" class="nav-icon"></lucide-icon>
            <span>Sent</span>
          </button>
          <button class="nav-item" [class.active]="activeFolder() === 'starred'" (click)="setFolder('starred')">
            <lucide-icon [img]="Star" class="nav-icon"></lucide-icon>
            <span>Starred</span>
          </button>
          <button class="nav-item" [class.active]="activeFolder() === 'drafts'" (click)="setFolder('drafts')">
            <lucide-icon [img]="Edit3" class="nav-icon"></lucide-icon>
            <span>Drafts</span>
          </button>
          <button class="nav-item" [class.active]="activeFolder() === 'trash'" (click)="setFolder('trash')">
            <lucide-icon [img]="Trash2" class="nav-icon"></lucide-icon>
            <span>Trash</span>
          </button>
        </nav>
      </div>

      <!-- ═══════════════════════════════════════ -->
      <!-- CENTER: EMAIL LIST                      -->
      <!-- ═══════════════════════════════════════ -->
      <div class="email-list-col" [class.hidden]="selectedEmail() !== null">
        <div class="list-header">
          <h2>{{folderLabel()}}</h2>
          <button class="icon-btn" (click)="load()" title="Refresh">
            <lucide-icon [img]="RefreshCw" style="width:16px;height:16px;"></lucide-icon>
          </button>
        </div>

        <div class="list-loading" *ngIf="loading()">
          <div class="spinner"></div>
        </div>

        <div class="list-empty" *ngIf="!loading() && filteredEmails().length === 0">
          <lucide-icon [img]="Inbox" style="width:48px;height:48px;opacity:0.3;"></lucide-icon>
          <p>No emails in {{folderLabel()}}</p>
          <button class="compose-btn sm" (click)="startCompose()">Compose</button>
        </div>

        <div class="email-list" *ngIf="!loading() && filteredEmails().length > 0">
          <div class="email-row"
            *ngFor="let email of filteredEmails()"
            [class.selected]="selectedEmail()?.id === email.id"
            [class.unread]="!email.openedAt"
            (click)="openEmail(email)">
            <!-- Avatar -->
            <div class="row-avatar">{{ (email.toEmail[0] || 'E').toUpperCase() }}</div>
            <!-- Content -->
            <div class="row-content">
              <div class="row-top">
                <span class="row-from">{{ email.toEmail }}</span>
                <span class="row-time">{{ email.sentAt | date:'MMM d' }}</span>
              </div>
              <div class="row-subject">
                <lucide-icon *ngIf="email.isStarred" [img]="Star" style="width:12px;height:12px; color:#facc15; margin-right:4px;"></lucide-icon>
                {{ email.subject }}
              </div>
              <div class="row-preview">{{ stripHtml(email.body).substring(0, 90) }}...</div>
            </div>
            <!-- Status dot -->
            <div class="row-status">
              <span class="status-dot" [class.sent]="email.status === 'Sent'" [class.received]="email.status === 'Received'"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════ -->
      <!-- RIGHT: EMAIL DETAIL (Thread View)       -->
      <!-- ═══════════════════════════════════════ -->
      <div class="email-detail-col" *ngIf="selectedEmail() && !showCompose()">

        <!-- DETAIL TOOLBAR (Gmail style) -->
        <div class="detail-toolbar">
          <div class="toolbar-left">
            <button class="tb-btn" (click)="selectedEmail.set(null); showInlineReply.set(false)" title="Back">
              <lucide-icon [img]="ChevronLeft" style="width:18px;height:18px;"></lucide-icon>
            </button>
          </div>
          <h3 class="detail-subject">{{ selectedEmail()!.subject }}</h3>
          <div class="toolbar-right">
            <button class="tb-btn" title="Archive" (click)="archiveEmail(selectedEmail()!.id)" [class.active-icon]="selectedEmail()?.isArchived">
              <lucide-icon [img]="Archive" style="width:16px;height:16px;"></lucide-icon>
            </button>
            <button class="tb-btn" title="Delete" (click)="deleteEmail(selectedEmail()!.id)">
              <lucide-icon [img]="Trash2" style="width:16px;height:16px;"></lucide-icon>
            </button>
            <button class="tb-btn" title="Star" (click)="toggleStar(selectedEmail()!.id)" [class.active-star]="selectedEmail()?.isStarred">
              <lucide-icon [img]="Star" style="width:16px;height:16px;"></lucide-icon>
            </button>
            <button class="tb-btn" title="More">
              <lucide-icon [img]="MoreHorizontal" style="width:16px;height:16px;"></lucide-icon>
            </button>
          </div>
        </div>

        <!-- THREAD / EMAIL BODY -->
        <div class="detail-scroll">

          <!-- Email "Bubble" Card (like Gmail thread) -->
          <div class="email-card">
            <!-- Card header: sender info row -->
            <div class="card-header">
              <div class="card-avatar">{{ (selectedEmail()!.toEmail[0] || 'M').toUpperCase() }}</div>
              <div class="card-meta">
                <div class="card-sender-row">
                  <span class="card-sender-name">{{ selectedEmail()!.toEmail }}</span>
                  <span class="card-via">via Dhwiti CRM</span>
                  <span class="badge-status" [ngClass]="getStatusBadge(selectedEmail()!.status)">
                    {{ selectedEmail()!.status }}
                  </span>
                </div>
                <div class="card-date" *ngIf="selectedEmail()!.sentAt">
                  {{ selectedEmail()!.sentAt | date:'EEE, MMM d, y, h:mm a' }}
                </div>
              </div>
              <!-- Quick actions on hover -->
              <div class="card-actions">
                <button class="tb-btn sm" (click)="startInlineReply()" title="Reply">
                  <lucide-icon [img]="CornerUpLeft" style="width:15px;height:15px;"></lucide-icon>
                </button>
              </div>
            </div>

            <!-- Email HTML Body -->
            <div class="card-body" [innerHTML]="getSafeHtml(selectedEmail()!.body)"></div>

            <!-- Action buttons below email -->
            <div class="card-footer-actions" *ngIf="!showInlineReply()">
              <button class="reply-chip" (click)="startInlineReply()">
                <lucide-icon [img]="CornerUpLeft" style="width:14px;height:14px;"></lucide-icon>
                Reply
              </button>
              <button class="reply-chip" (click)="startInlineReply()">
                Forward
              </button>
            </div>
          </div>

          <!-- ═══════════════════════════════════════════════════════ -->
          <!-- INLINE REPLY BOX — Gmail-style (at bottom of thread)   -->
          <!-- ═══════════════════════════════════════════════════════ -->
          <div class="inline-reply-box" *ngIf="showInlineReply()">
            <div class="reply-box-header">
              <lucide-icon [img]="CornerUpLeft" style="width:14px;height:14px;color:var(--text-muted);"></lucide-icon>
              <span class="reply-to-label">Reply to <strong>{{ selectedEmail()!.toEmail }}</strong></span>
              <button class="icon-btn xs" (click)="cancelReply()" title="Close">
                <lucide-icon [img]="X" style="width:14px;height:14px;"></lucide-icon>
              </button>
            </div>

            <!-- ONLY THE MESSAGE BODY — To/Subject are pre-set, not editable (like Gmail) -->
            <form [formGroup]="replyForm">
              <textarea
                class="reply-textarea"
                formControlName="body"
                placeholder="Write your reply..."
                rows="5"
                autofocus></textarea>

              <!-- Collapsed quoted original message (like Gmail's "..." button) -->
              <div class="quoted-toggle" (click)="showQuoted.set(!showQuoted())">
                <span>···</span>
              </div>
              <div class="quoted-original" *ngIf="showQuoted()">
                <div class="quoted-label">On {{ selectedEmail()!.sentAt | date:'EEE, MMM d, y, h:mm a' }}, {{ selectedEmail()!.toEmail }} wrote:</div>
                <div class="quoted-text" [innerHTML]="getSafeQuote(selectedEmail()!.body)"></div>
              </div>
            </form>

            <!-- Reply Actions -->
            <div class="reply-actions">
              <button class="send-btn" (click)="sendReply()" [disabled]="replySending() || replyForm.invalid">
                <lucide-icon [img]="Send" style="width:15px;height:15px;"></lucide-icon>
                {{ replySending() ? 'Sending...' : 'Send Reply' }}
              </button>
              <span class="reply-success" *ngIf="replySuccess()">✓ Reply sent!</span>
              <span class="reply-error" *ngIf="replyError()">{{ replyError() }}</span>
              <button class="icon-btn" style="margin-left:auto;" (click)="cancelReply()">Discard</button>
            </div>
          </div>

          <!-- Placeholder when no reply open -->
          <div class="reply-placeholder" *ngIf="!showInlineReply()" (click)="startInlineReply()">
            <div class="rp-avatar">{{ (selectedEmail()!.toEmail[0] || 'Y').toUpperCase() }}</div>
            <span>Click here to reply...</span>
          </div>

        </div>
      </div>

      <!-- ═══════════════════════════════════════ -->
      <!-- COMPOSE VIEW — Integrated Full View     -->
      <!-- ═══════════════════════════════════════ -->
      <div class="email-detail-col" *ngIf="showCompose()">
        <div class="detail-toolbar">
          <div class="toolbar-left">
            <button class="tb-btn" (click)="closeCompose()" title="Back">
              <lucide-icon [img]="ChevronLeft" style="width:18px;height:18px;"></lucide-icon>
            </button>
          </div>
          <h3 class="detail-subject">New Message</h3>
        </div>

        <div class="detail-scroll" style="background:#fff;">
          <form [formGroup]="composeForm" class="compose-full-form">
            <div class="cw-field">
              <label>To</label>
              <input type="email" formControlName="toEmail" placeholder="recipient@example.com" class="cw-input" />
              <button class="icon-btn xs" (click)="showCc.set(!showCc())" style="margin-right:1rem;">Cc</button>
            </div>
            
            <div class="cw-field" *ngIf="showCc()">
              <label>Cc</label>
              <input formControlName="ccEmails" placeholder="comma separated emails..." class="cw-input" />
            </div>

            <div class="cw-field">
              <label>Subject</label>
              <input formControlName="subject" placeholder="Email subject..." class="cw-input" />
            </div>

            <div style="flex:1; display:flex; flex-direction:column;">
              <textarea formControlName="body" placeholder="Write your message here..." class="cw-textarea" style="flex:1; min-height:400px; border:none;"></textarea>
            </div>

            <div class="cw-footer" style="position:sticky; bottom:0; background:#f8fafc; border-top:1px solid #e2e8f0; padding:1rem 2rem;">
              <button class="send-btn" (click)="sendEmail()" [disabled]="composeSending() || composeForm.invalid">
                <lucide-icon [img]="Send" style="width:16px;height:16px;"></lucide-icon>
                {{ composeSending() ? 'Sending...' : 'Send Message' }}
              </button>

              <button class="icon-btn" (click)="fileInput.click()" style="margin-left:0.5rem; border: 1px solid var(--border); border-radius: 8px; padding: 0.4rem 0.8rem; background: var(--bg-card);">
                <lucide-icon [img]="Paperclip" style="width:16px;height:16px;"></lucide-icon>
                <span style="font-weight: 500; font-size: 0.85rem; margin-left: 0.25rem;">Attach File</span>
              </button>
              <input type="file" #fileInput style="display: none;" (change)="onFileSelected($event)">
              <span *ngIf="attachedFileName()" class="attachment-badge">📎 {{ attachedFileName() }}</span>
              
              <button class="icon-btn" (click)="closeCompose()" style="margin-left:auto;">Discard</button>
            </div>
            
            <div *ngIf="composeError()" class="cw-error">{{ composeError() }}</div>
            <div *ngIf="composeSuccess()" class="cw-success">{{ composeSuccess() }}</div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ============================
       LAYOUT
       ============================ */
    .email-layout {
      display: flex; height: calc(100vh - 80px);
      background: var(--bg-card); border-radius: var(--radius-md);
      border: 1px solid var(--border); overflow: hidden; position: relative;
    }

    /* ============================
       SIDEBAR
       ============================ */
    .email-sidebar {
      width: 220px; flex-shrink: 0; border-right: 1px solid var(--border);
      background: var(--bg-secondary); display: flex; flex-direction: column;
    }
    .sidebar-compose-wrap { padding: 1rem; }
    .compose-btn {
      width: 100%; display: flex; align-items: center; gap: 0.5rem; justify-content: center;
      padding: 0.65rem 1rem; border-radius: 24px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff;
      font-weight: 600; font-size: 0.875rem; transition: opacity 0.2s; box-shadow: 0 2px 8px rgba(124,58,237,0.3);
    }
    .compose-btn:hover { opacity: 0.9; }
    .compose-btn.sm { width: auto; margin-top: 1rem; padding: 0.5rem 1.25rem; border-radius: 20px; }

    .email-nav { padding: 0.5rem 0; }
    .nav-item {
      display: flex; align-items: center; gap: 0.75rem; width: 100%;
      padding: 0.6rem 1.25rem; border: none; background: none; cursor: pointer;
      color: var(--text-secondary); font-size: 0.875rem; border-radius: 0 24px 24px 0;
      text-align: left; transition: background 0.15s, color 0.15s; margin: 1px 0;
    }
    .nav-item:hover { background: var(--bg-hover, #f0f0f0); color: var(--text-primary); }
    .nav-item.active { background: #ede9fe; color: #7c3aed; font-weight: 700; }
    .nav-icon { width: 16px; height: 16px; flex-shrink: 0; }
    .nav-badge {
      margin-left: auto; background: #7c3aed; color: #fff;
      border-radius: 12px; padding: 1px 7px; font-size: 0.72rem; font-weight: 700;
    }

    /* ============================
       EMAIL LIST COLUMN
       ============================ */
    .email-list-col {
      width: 360px; flex-shrink: 0; border-right: 1px solid var(--border);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .email-list-col.hidden { display: none; }
    .list-header {
      padding: 1rem 1rem 0.75rem; display: flex; align-items: center;
      gap: 0.5rem; border-bottom: 1px solid var(--border); background: var(--bg-card);
    }
    .list-header h2 { font-size: 1rem; font-weight: 700; flex: 1; margin: 0; }
    .list-loading, .list-empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      flex: 1; color: var(--text-muted); gap: 0.5rem; font-size: 0.875rem;
    }
    .email-list { overflow-y: auto; flex: 1; }

    /* Email row */
    .email-row {
      display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.1s;
    }
    .email-row:hover { background: var(--bg-hover, #f9fafb); }
    .email-row.selected { background: #ede9fe; }
    .email-row.unread .row-subject { font-weight: 800; }
    .row-avatar {
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 0.95rem;
    }
    .row-content { flex: 1; min-width: 0; }
    .row-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
    .row-from { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
    .row-time { font-size: 0.72rem; color: var(--text-muted); flex-shrink: 0; }
    .row-subject { font-size: 0.825rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
    .row-preview { font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row-status { display: flex; align-items: center; padding-top: 4px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #d1d5db; }
    .status-dot.sent { background: #10b981; }
    .status-dot.received { background: #3b82f6; }

    /* ============================
       EMAIL DETAIL COLUMN
       ============================ */
    .email-detail-col {
      flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-card);
    }

    /* Toolbar */
    .detail-toolbar {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem;
      border-bottom: 1px solid var(--border); background: var(--bg-card);
      min-height: 52px;
    }
    .detail-subject { font-size: 1rem; font-weight: 700; flex: 1; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
    .tb-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 34px; height: 34px; border-radius: 50%; border: none; cursor: pointer;
      background: transparent; color: var(--text-secondary); transition: background 0.15s, color 0.15s;
    }
    .tb-btn:hover { background: var(--bg-hover, #f3f4f6); color: var(--text-primary); }
    .tb-btn.sm { width: 28px; height: 28px; }
    .tb-btn.active-star { color: #facc15; }
    .tb-btn.active-icon { color: #7c3aed; background: #ede9fe; }

    /* THREAD SCROLL */
    .detail-scroll { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

    /* EMAIL CARD (thread message) */
    .email-card {
      border: 1px solid var(--border); border-radius: 12px;
      background: var(--bg-card); overflow: hidden;
    }
    .card-header {
      display: flex; align-items: flex-start; gap: 0.875rem;
      padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); background: var(--bg-secondary);
    }
    .card-avatar {
      width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 1rem;
    }
    .card-meta { flex: 1; min-width: 0; }
    .card-sender-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 3px; }
    .card-sender-name { font-weight: 700; font-size: 0.9rem; color: var(--text-primary); }
    .card-via { font-size: 0.72rem; color: var(--text-muted); font-style: italic; }
    .card-date { font-size: 0.75rem; color: var(--text-muted); }
    .card-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .badge-status {
      font-size: 0.65rem; padding: 2px 8px; border-radius: 12px; font-weight: 600;
    }
    .badge-status.badge-green { background: #d1fae5; color: #065f46; }
    .badge-status.badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-status.badge-gray { background: #f3f4f6; color: #6b7280; }

    /* Email HTML body */
    .card-body {
      padding: 1.5rem 1.5rem 3rem; /* Increase bottom padding to 3rem for extra scrolling clearance */
      font-size: 14px; line-height: 1.7; color: var(--text-primary);
      overflow-x: auto;
      overflow-y: auto;
      max-height: 40vh; /* Reduced max-height so the scroll boundary is guaranteed to be fully on-screen */
    }
    .card-body table { max-width: 100%; }

    /* Reply / Forward chips below email */
    .card-footer-actions { padding: 0.75rem 1.5rem; display: flex; gap: 0.75rem; border-top: 1px solid var(--border); }
    .reply-chip {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.4rem 1rem; border-radius: 20px; border: 1px solid var(--border);
      background: var(--bg-card); color: var(--text-secondary); font-size: 0.85rem;
      cursor: pointer; font-weight: 500; transition: background 0.15s;
    }
    .reply-chip:hover { background: var(--bg-hover, #f3f4f6); color: var(--text-primary); }

    /* ============================
       INLINE REPLY BOX (Gmail style)
       ============================ */
    .inline-reply-box {
      border: 1px solid #7c3aed; border-radius: 12px;
      background: var(--bg-card); overflow: hidden;
      box-shadow: 0 2px 12px rgba(124,58,237,0.15);
    }
    .reply-box-header {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem;
      border-bottom: 1px solid var(--border); background: var(--bg-secondary);
      font-size: 0.8rem;
    }
    .reply-to-label { flex: 1; color: var(--text-muted); }
    .reply-textarea {
      width: 100%; min-height: 120px; border: none; outline: none; resize: none;
      padding: 1rem; font-size: 0.875rem; color: var(--text-primary);
      background: var(--bg-card); font-family: inherit; line-height: 1.6;
      box-sizing: border-box;
    }
    .quoted-toggle {
      padding: 0.25rem 1rem; font-size: 1.2rem; color: var(--text-muted);
      cursor: pointer; letter-spacing: 1px; display: inline-block; border-radius: 4px;
    }
    .quoted-toggle:hover { background: var(--bg-hover, #f3f4f6); }
    .quoted-original {
      margin: 0.5rem 1rem 0; border-left: 4px solid #d1d5db;
      padding-left: 1rem; color: var(--text-muted); font-size: 0.8rem;
    }
    .quoted-label { font-size: 0.75rem; margin-bottom: 0.4rem; }
    .quoted-text { }
    .reply-actions {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1rem; border-top: 1px solid var(--border);
      background: var(--bg-secondary);
    }
    .reply-success { color: #10b981; font-size: 0.8rem; }
    .reply-error { color: #ef4444; font-size: 0.8rem; }

    /* ============================
       PLACEHOLDER REPLY BAR
       ============================ */
    .reply-placeholder {
      display: flex; align-items: center; gap: 0.875rem;
      border: 1px solid var(--border); border-radius: 24px;
      padding: 0.75rem 1.25rem; cursor: pointer;
      background: var(--bg-card); color: var(--text-muted);
      font-size: 0.875rem; transition: box-shadow 0.2s;
    }
    .reply-placeholder:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .rp-avatar {
      width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 0.8rem;
    }

    /* ============================
       SEND BUTTON
       ============================ */
    .send-btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.55rem 1.25rem; border-radius: 20px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff;
      font-weight: 600; font-size: 0.875rem; transition: opacity 0.2s;
    }
    .send-btn:hover:not(:disabled) { opacity: 0.9; }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Full Integrated Compose View */
    .compose-full-form { display: flex; flex-direction: column; height: 100%; position: relative; background: #fff; }
    .cw-field {
      display: flex; align-items: center; border-bottom: 1px solid var(--border); padding: 0.25rem 0;
    }
    .cw-field label {
      font-size: 0.85rem; color: var(--text-muted); width: 80px; padding: 0.5rem 1.5rem; flex-shrink: 0; font-weight: 500;
    }
    .cw-input {
      flex: 1; border: none; outline: none; padding: 0.75rem 0.5rem;
      font-size: 0.95rem; color: var(--text-primary); background: transparent; transition: all 0.2s;
    }
    .cw-input:focus { background: var(--bg-hover, #f8fafc); border-radius: 4px; }
    
    .cw-textarea {
      width: 100%; min-height: 400px; border: none; outline: none; resize: none;
      padding: 1.5rem; font-size: 0.95rem; color: var(--text-primary);
      background: transparent; font-family: inherit; line-height: 1.7; box-sizing: border-box;
    }
    
    .attachment-badge {
      display: inline-flex; align-items: center; justify-content: center;
      background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.75rem; border-radius: 16px;
      font-size: 0.8rem; font-weight: 600; margin-left: 1rem; border: 1px solid #c7d2fe;
    }

    .cw-error { padding: 0.5rem 1.5rem; color: #ef4444; font-size: 0.85rem; background: #fef2f2; border-top: 1px solid #fca5a5; }
    .cw-success { padding: 0.5rem 1.5rem; color: #10b981; font-size: 0.85rem; background: #ecfdf5; border-top: 1px solid #6ee7b7; }
    
    .icon-btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.4rem 0.8rem; border-radius: 6px; border: none; cursor: pointer;
      background: transparent; color: var(--text-secondary); font-size: 0.85rem;
      transition: background 0.15s, color 0.15s;
    }
    .icon-btn:hover { background: var(--bg-hover, #f3f4f6); color: var(--text-primary); }
    .icon-btn.xs { width: auto; height: 28px; padding: 0 0.5rem; font-size: 0.75rem; }

    /* Utils */
    .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .cc-row { }
  `]
})
export class EmailsComponent implements OnInit {
  emails = signal<Email[]>([]);
  loading = signal(false);
  activeFolder = signal('inbox');
  selectedEmail = signal<Email | null>(null);

  // Inline reply state
  showInlineReply = signal(false);
  showQuoted = signal(false);
  replySending = signal(false);
  replySuccess = signal('');
  replyError = signal('');

  // Compose window state
  showCompose = signal(false);
  composeMinimized = signal(false);
  composeSending = signal(false);
  composeError = signal('');
  composeSuccess = signal('');
  showCc = signal(false);
  attachedFileName = signal<string | null>(null);
  attachedFileDataUrl = signal<string | null>(null);

  readonly Mail = Mail;
  readonly Send = Send;
  readonly RefreshCw = RefreshCw;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly Inbox = Inbox;
  readonly Edit3 = Edit3;
  readonly Star = Star;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly ChevronLeft = ChevronLeft;
  readonly Reply = Reply;
  readonly CornerUpLeft = CornerUpLeft;
  readonly MoreHorizontal = MoreHorizontal;
  readonly Archive = Archive;
  readonly Paperclip = Paperclip;

  replyForm: FormGroup;
  composeForm: FormGroup;

  constructor(
    private emailService: EmailFeatureService,
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {
    // Reply form: ONLY body — To/Subject auto-filled from selected email
    this.replyForm = this.fb.group({
      body: ['', Validators.required]
    });
    // Compose form: full form for new emails
    this.composeForm = this.fb.group({
      toEmail: ['', [Validators.required, Validators.email]],
      ccEmails: [''],
      subject: ['', Validators.required],
      body: ['', Validators.required],
      scheduledAt: ['']
    });
  }

  ngOnInit() {
    this.load();
    this.route.queryParams.subscribe(params => {
      if (params['composeTo'] || params['composeSubject']) {
        this.startCompose();
        if (params['composeTo']) this.composeForm.patchValue({ toEmail: params['composeTo'] });
        if (params['composeSubject']) this.composeForm.patchValue({ subject: params['composeSubject'] });
        if (params['prefillBody']) {
          this.composeForm.patchValue({ body: params['prefillBody'] });
        }
      }
    });
  }

  load() {
    this.loading.set(true);
    this.emailService.getPaged().subscribe({
      next: d => { this.emails.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  setFolder(folder: string) {
    this.activeFolder.set(folder);
    this.selectedEmail.set(null);
    this.showCompose.set(false);
    this.showInlineReply.set(false);
  }

  folderLabel(): string {
    const map: Record<string, string> = { inbox: 'Inbox', sent: 'Sent', drafts: 'Drafts', starred: 'Starred', trash: 'Trash' };
    return map[this.activeFolder()] ?? 'Inbox';
  }

  filteredEmails(): Email[] {
    const all = this.emails();
    const f = this.activeFolder();
    
    // Trash ignores archive flag
    if (f === 'trash') return all.filter(e => e.status === 'Trash');
    // Starred ignores archive flag but exludes trash
    if (f === 'starred') return all.filter(e => e.isStarred && e.status !== 'Trash');
    
    // Others only show non-archived (unless we implement a generic 'all' folder)
    if (f === 'inbox') return all.filter(e => (e.status === 'Sent' || e.status === 'Received') && !e.isArchived);
    if (f === 'sent') return all.filter(e => e.status === 'Sent' && !e.isArchived);
    if (f === 'drafts') return all.filter(e => e.status === 'Draft' && !e.isArchived);
    
    return all;
  }

  inboxCount(): number { return this.emails().filter(e => !e.openedAt && e.status === 'Sent' && !e.isArchived).length; }

  openEmail(email: Email) {
    this.selectedEmail.set(email);
    this.showInlineReply.set(false);
    this.showQuoted.set(false);
  }

  // ─── TOOLBAR ACTIONS ────────────────────────────────────────────────
  deleteEmail(id: string) {
    if(!confirm('Are you sure you want to delete this email?')) return;
    this.emailService.delete(id).subscribe(() => {
      this.selectedEmail.set(null);
      this.load();
    });
  }

  toggleStar(id: string) {
    this.emailService.toggleStar(id).subscribe(updatedEmail => {
      // Update local array for instantaneous feedback
      const current = this.emails();
      const updated = current.map(e => e.id === id ? { ...e, isStarred: !e.isStarred } : e);
      this.emails.set(updated);
      if (this.selectedEmail()?.id === id) {
        this.selectedEmail.set({ ...this.selectedEmail()!, isStarred: !this.selectedEmail()!.isStarred });
      }
    });
  }

  archiveEmail(id: string) {
    this.emailService.archive(id).subscribe(updatedEmail => {
      this.selectedEmail.set(null);
      this.load();
    });
  }

  // ─── INLINE REPLY (Gmail-style) ─────────────────────────────────────
  startInlineReply() {
    const user = this.auth.getCurrentUser();
    const sig = user ? `\n\n-- \n${user.firstName} ${user.lastName}\nSales Representative · Dhwiti CRM` : '';
    this.replyForm.reset({ body: sig });
    this.showInlineReply.set(true);
    this.showQuoted.set(false);
    this.replySuccess.set('');
    this.replyError.set('');
  }

  cancelReply() {
    this.showInlineReply.set(false);
    this.replyForm.reset();
  }

  sendReply() {
    const email = this.selectedEmail();
    if (!email || this.replyForm.invalid) return;
    this.replySending.set(true);
    this.replySuccess.set('');
    this.replyError.set('');

    const plainBody = this.replyForm.value.body;
    const subject = 'Re: ' + email.subject;
    const htmlBody = this.buildHtmlEmail(plainBody, subject);

    const dto: CreateEmailDto = {
      toEmail: email.toEmail,
      subject,
      body: htmlBody
    };
    this.emailService.send(dto).subscribe({
      next: () => {
        this.replySending.set(false);
        this.replySuccess.set('Reply sent!');
        setTimeout(() => {
          this.showInlineReply.set(false);
          this.replyForm.reset();
          this.load();
        }, 1200);
      },
      error: (e) => {
        this.replySending.set(false);
        this.replyError.set(e.message || 'Failed to send reply.');
      }
    });
  }

  // ─── COMPOSE (New Email) ─────────────────────────────────────────────
  startCompose() {
    const user = this.auth.getCurrentUser();
    const sig = user ? `\n\n-- \nRegards,\n${user.firstName} ${user.lastName}\nDhwiti CRM` : '';
    this.composeForm.reset({ body: sig });
    this.composeError.set('');
    this.composeSuccess.set('');
    this.showCompose.set(true);
    this.composeMinimized.set(false);
  }

  closeCompose() {
    this.showCompose.set(false);
    this.composeForm.reset();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.attachedFileName.set(file.name);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.attachedFileDataUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      this.attachedFileName.set(null);
      this.attachedFileDataUrl.set(null);
    }
  }

  sendEmail() {
    if (this.composeForm.invalid) return;
    this.composeSending.set(true);
    this.composeError.set('');
    this.composeSuccess.set('');
    
    // Get raw form values
    const raw = this.composeForm.value;
    const plainBody = raw.body;
    const subject = raw.subject;
    
    // Build HTML email with potential attachment
    const htmlBody = this.buildHtmlEmail(plainBody, subject, this.attachedFileName(), this.attachedFileDataUrl());
    
    // Create DTO and send
    const dto: CreateEmailDto = {
      toEmail: raw.toEmail,
      subject: subject,
      body: htmlBody
    };
    
    this.emailService.send(dto).subscribe({
      next: () => {
        this.composeSending.set(false);
        this.composeSuccess.set('Message sent successfully!');
        setTimeout(() => {
          this.closeCompose();
          this.load();
        }, 1500);
      },
      error: (e) => {
        this.composeSending.set(false);
        this.composeError.set(e.message || 'Failed to send message.');
      }
    });
  }

  // ─── HTML EMAIL BUILDER ───────────────────────────────────────────────
  buildHtmlEmail(plainBody: string, subject: string, attachName: string | null = null, attachDataUrl: string | null = null): string {
    const bodyHtml = plainBody.replace(/\n/g, '<br/>');
    
    let attachHtml = '';
    if (attachName && attachDataUrl) {
      attachHtml = `
      <div style="margin-top: 2rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
        <a href="${attachDataUrl}" download="${attachName}" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; color: #334155; font-size: 13px; font-family: sans-serif; cursor: pointer;">
          <span style="font-size: 16px;">📎</span>
          <span style="font-weight: 600;">${attachName}</span>
          <span style="color: #4f46e5; border-left: 1px solid #cbd5e1; padding-left: 8px; margin-left: 4px; font-weight: 600;">Download PDF</span>
        </a>
      </div>`;
    } else if (attachName) {
      attachHtml = `
      <div style="margin-top: 2rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; color: #334155; font-size: 13px; font-family: sans-serif;">
          <span style="font-size: 16px;">📎</span>
          <span style="font-weight: 600;">${attachName}</span>
          <span style="color: #64748b; font-size: 11px;">(Attached PDF)</span>
        </div>
      </div>`;
    }

    return `<div style="font-family:Arial,Helvetica,sans-serif;color:#111827;font-size:14px;line-height:1.6;">
  ${bodyHtml}
  ${attachHtml}
</div>`;
  }

  // ─── HTML HELPERS ─────────────────────────────────────────────────────
  getSafeHtml(body: string): SafeHtml {
    const isHtml = /<[a-z][\s\S]*>/i.test(body);
    if (isHtml) return this.sanitizer.bypassSecurityTrustHtml(body);
    const escaped = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
    return this.sanitizer.bypassSecurityTrustHtml(`<div style="padding:1rem 0;font-size:14px;line-height:1.7;color:#374151;">${escaped}</div>`);
  }

  getSafeQuote(body: string): SafeHtml {
    const stripped = this.stripHtml(body).substring(0, 300);
    return this.sanitizer.bypassSecurityTrustHtml(`<div style="color:#6b7280;font-size:0.8rem;">${stripped}...</div>`);
  }

  stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = { Sent: 'badge-green', Draft: 'badge-gray', Scheduled: 'badge-blue', Failed: 'badge-gray', Received: 'badge-blue' };
    return map[status] ?? 'badge-gray';
  }
}
