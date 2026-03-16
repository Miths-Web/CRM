import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="spinner-wrapper" [class.overlay]="overlay" *ngIf="loading">
      <div class="spinner-content">
        <div class="spinner" [style.width.px]="size" [style.height.px]="size"
             [style.borderWidth.px]="size/8"></div>
        <p *ngIf="message" class="spinner-msg">{{message}}</p>
      </div>
    </div>
  `,
    styles: [`
    .spinner-wrapper { display: flex; align-items: center; justify-content: center; padding: 2rem;
      &.overlay { position: absolute; inset: 0; background: rgba(15,15,26,0.7); backdrop-filter: blur(2px); z-index: 10; }
    }
    .spinner-content { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
    .spinner { border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%;
      animation: spin 0.7s linear infinite; }
    .spinner-msg { font-size: 0.8rem; color: var(--text-secondary); }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoadingSpinnerComponent {
    @Input() loading = true;
    @Input() size = 32;
    @Input() message = '';
    @Input() overlay = false;
}
