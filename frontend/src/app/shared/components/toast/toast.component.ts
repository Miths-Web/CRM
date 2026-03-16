import {
    Component, OnInit, OnDestroy, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast, ToastType } from './toast.service';
import {
    LucideAngularModule,
    CheckCircle2, XCircle, AlertTriangle, Info, X
} from 'lucide-angular';

@Component({
    selector: 'app-toast',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="toast-portal" aria-live="polite" aria-atomic="false">
      <div
        *ngFor="let t of toastSvc.toasts(); trackBy: trackById"
        class="toast"
        [class]="'toast--' + t.type"
        role="alert"
      >
        <!-- Icon -->
        <div class="toast-icon">
          <lucide-icon *ngIf="t.type==='success'" [img]="CheckCircle2" class="w-5 h-5"></lucide-icon>
          <lucide-icon *ngIf="t.type==='error'"   [img]="XCircle"      class="w-5 h-5"></lucide-icon>
          <lucide-icon *ngIf="t.type==='warning'" [img]="AlertTriangle" class="w-5 h-5"></lucide-icon>
          <lucide-icon *ngIf="t.type==='info'"    [img]="Info"          class="w-5 h-5"></lucide-icon>
        </div>

        <!-- Content -->
        <div class="toast-body">
          <div class="toast-title">{{ t.title }}</div>
          <div class="toast-msg" *ngIf="t.message">{{ t.message }}</div>
        </div>

        <!-- Progress bar — animated using CSS animation duration = toast.duration -->
        <div
          class="toast-progress"
          *ngIf="t.duration && t.duration > 0"
          [style.animation-duration.ms]="t.duration"
        ></div>

        <!-- Dismiss button -->
        <button
          *ngIf="t.dismissible"
          class="toast-close"
          (click)="dismiss(t.id)"
          aria-label="Dismiss"
        >
          <lucide-icon [img]="X" class="w-4 h-4"></lucide-icon>
        </button>
      </div>
    </div>
  `,
    styles: [`
    /* ── Portal ──────────────────────────────────────────────────── */
    .toast-portal {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      max-width: 380px;
      width: calc(100vw - 3rem);
      pointer-events: none;
    }

    /* ── Toast card ──────────────────────────────────────────────── */
    .toast {
      pointer-events: all;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: var(--radius-md, 10px);
      border: 1px solid transparent;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.35);
      animation: toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
      transition: opacity 0.25s, transform 0.25s;

      /* Success */
      &.toast--success {
        background: rgba(16,185,129,0.12);
        border-color: rgba(16,185,129,0.35);
        .toast-icon { color: #10b981; }
        .toast-progress { background: #10b981; }
      }
      /* Error */
      &.toast--error {
        background: rgba(239,68,68,0.12);
        border-color: rgba(239,68,68,0.35);
        .toast-icon { color: #ef4444; }
        .toast-progress { background: #ef4444; }
      }
      /* Warning */
      &.toast--warning {
        background: rgba(245,158,11,0.12);
        border-color: rgba(245,158,11,0.35);
        .toast-icon { color: #f59e0b; }
        .toast-progress { background: #f59e0b; }
      }
      /* Info */
      &.toast--info {
        background: rgba(59,130,246,0.12);
        border-color: rgba(59,130,246,0.35);
        .toast-icon { color: #3b82f6; }
        .toast-progress { background: #3b82f6; }
      }
    }

    /* ── Parts ───────────────────────────────────────────────────── */
    .toast-icon { flex-shrink: 0; margin-top: 0.05rem; }

    .toast-body { flex: 1; min-width: 0; }
    .toast-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary, #f1f5f9);
      line-height: 1.3;
    }
    .toast-msg {
      font-size: 0.8rem;
      color: var(--text-secondary, #94a3b8);
      margin-top: 0.2rem;
      line-height: 1.5;
      word-break: break-word;
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted, #64748b);
      padding: 0.1rem;
      border-radius: 4px;
      flex-shrink: 0;
      opacity: 0.7;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.15s, background 0.15s;
      &:hover { opacity: 1; background: rgba(255,255,255,0.08); }
    }

    /* ── Progress bar ─────────────────────────────────────────────── */
    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      width: 100%;
      border-radius: 0 0 var(--radius-md, 10px) var(--radius-md, 10px);
      transform-origin: left center;
      animation: progressShrink linear both;
    }

    /* ── Keyframes ───────────────────────────────────────────────── */
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(110%) scale(0.85); }
      to   { opacity: 1; transform: translateX(0)  scale(1); }
    }

    @keyframes progressShrink {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }
  `]
})
export class ToastComponent {
    readonly CheckCircle2 = CheckCircle2;
    readonly XCircle = XCircle;
    readonly AlertTriangle = AlertTriangle;
    readonly Info = Info;
    readonly X = X;

    constructor(public toastSvc: ToastService) { }

    dismiss(id: string): void {
        this.toastSvc.dismiss(id);
    }

    trackById(_: number, t: Toast): string {
        return t.id;
    }
}
