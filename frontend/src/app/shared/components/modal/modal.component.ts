import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onBackdropClick($event)">
      <div class="modal animate-slideUp" [style.maxWidth]="maxWidth" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title flex items-center">
            <ng-content select="[header-icon]"></ng-content>
            {{title}}
          </h3>
          <button class="modal-close flex-center" (click)="close.emit()"><lucide-icon [img]="XIcon" class="w-4 h-4"></lucide-icon></button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
        <div class="modal-footer" *ngIf="showFooter">
          <ng-content select="[modal-footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; padding: 1rem;
      animation: fadeIn 0.2s ease;
    }
    .modal { background: var(--bg-card); border: 1px solid var(--border-accent);
      border-radius: var(--radius-lg); width: 90%; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 25px 60px rgba(0,0,0,0.5), var(--shadow-glow);
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }
    .modal-title  { font-size: 1.1rem; font-weight: 700; }
    .modal-close  { background: var(--bg-hover); border: 1px solid var(--border);
      border-radius: 6px; width: 32px; height: 32px; cursor: pointer;
      color: var(--text-secondary); font-size: 0.85rem; display: flex; align-items: center; justify-content: center;
      &:hover { background: rgba(239,68,68,0.1); color: var(--danger); border-color: var(--danger); }
    }
    .modal-body   { padding: 1.5rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border);
      display: flex; gap: 0.75rem; justify-content: flex-end; }
    @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp  { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() maxWidth = '600px';
  @Input() showFooter = true;
  @Input() closeOnBackdrop = true;
  @Output() close = new EventEmitter<void>();

  readonly XIcon = X;

  onBackdropClick(e: MouseEvent) {
    if (this.closeOnBackdrop) this.close.emit();
  }
}
