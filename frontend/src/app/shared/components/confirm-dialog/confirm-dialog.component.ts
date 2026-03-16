import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertTriangle } from 'lucide-angular';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen">
      <div class="confirm-box animate-slideUp">
        <div class="confirm-icon text-warning"><lucide-icon [img]="AlertTriangle" style="width:48px;height:48px;"></lucide-icon></div>
        <h3 class="confirm-title">{{title}}</h3>
        <p class="confirm-msg">{{message}}</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" (click)="cancel.emit()">Cancel</button>
          <button class="btn" [ngClass]="confirmClass" (click)="confirm.emit()">
            {{confirmLabel}}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; z-index: 1100;
      background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; }
    .confirm-box { background: var(--bg-card); border: 1px solid var(--border-accent);
      border-radius: var(--radius-lg); padding: 2rem; max-width: 420px; width: 90%;
      text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.5); }
    .confirm-icon  { font-size: 2.5rem; margin-bottom: 1rem; }
    .confirm-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
    .confirm-msg   { color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6; }
    .confirm-actions { display: flex; gap: 0.75rem; justify-content: center; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-slideUp { animation: slideUp 0.25s ease; }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Are you sure?';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmLabel = 'Delete';
  @Input() confirmClass = 'btn-danger';

  readonly AlertTriangle = AlertTriangle;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
