import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Lock } from 'lucide-angular';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <div class="unauth-wrapper">
      <div class="unauth-card animate-fadeIn">
        <div class="unauth-icon flex-center text-danger"><lucide-icon [img]="Lock" style="width:64px;height:64px;"></lucide-icon></div>
        <h1 class="unauth-title">Access Denied</h1>
        <p class="unauth-msg">
          Aapke paas yeh page dekhne ki permission nahi hai.<br>
          Please Admin se contact karein agar aapko access chahiye.
        </p>
        <div class="unauth-actions">
          <a routerLink="/dashboard" class="btn btn-primary">← Dashboard Par Jao</a>
        </div>
        <div class="unauth-code">403 — Forbidden</div>
      </div>
    </div>
  `,
  styles: [`
    .unauth-wrapper {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: var(--bg-primary);
      padding: 2rem;
    }
    .unauth-card {
      text-align: center;
      background: var(--bg-card);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: var(--radius-xl);
      padding: 3rem 4rem;
      max-width: 480px;
      box-shadow: 0 0 40px rgba(239,68,68,0.1);
    }
    .unauth-icon  { font-size: 4rem; margin-bottom: 1rem; }
    .unauth-title { font-size: 2rem; font-weight: 800; color: var(--danger); margin-bottom: 1rem; }
    .unauth-msg   { color: var(--text-secondary); line-height: 1.7; margin-bottom: 2rem; }
    .unauth-actions { margin-bottom: 1.5rem; }
    .unauth-code  { font-size: 0.75rem; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; }
  `]
})
export class UnauthorizedComponent {
  readonly Lock = Lock;
}
