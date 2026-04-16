import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="split-layout">
      <!-- Background Stripes -->
      <div class="split-layout-bg"></div>

      <!-- Top Navbar & Logo -->
      <nav class="top-nav">
        <div class="logo-area" (click)="onLogoClick()" style="cursor: pointer;">
          <img src="logo.png" alt="Dhwiti Digital Solution" class="company-logo">
        </div>
      </nav>

      <div class="content-wrapper">
        <!-- Left Hero Section -->
        <div class="left-content">
          <h4 class="hero-title">Reset your<br>password<br>securely</h4>
          <p class="hero-subtitle">
            Don't worry, it happens to the best of us.<br>
            Enter your registered email ID and we will<br>
            send you a link to reset your password.
          </p>
        </div>

        <!-- Right Form Section -->
        <div class="right-content">
          <div class="login-card">
            <h2>Forgot Password</h2>
            <p class="desc-text">Enter your email to receive reset instructions.</p>

            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              
              <!-- Success Message -->
              <div *ngIf="successMsg()" class="success-alert">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" class="success-icon">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span class="success-message">{{ successMsg() }}</span>
              </div>
              
              <!-- Email Input Block -->
              <div class="form-group" [hidden]="successMsg()">
                <input type="email" formControlName="email" placeholder="Email Address"
                       [class.invalid]="isInvalid('email')">
                <div class="field-error" *ngIf="isInvalid('email')">Please enter a valid email.</div>
              </div>

              <button *ngIf="!successMsg()" type="submit" [disabled]="loading()" class="submit-btn" [class.loading]="loading()">
                {{ loading() ? 'Sending Instructions...' : 'Send Reset Link' }}
              </button>

              <div class="signup-link">
                Remember your password? <a routerLink="/auth/login">Back to Login</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :host { display: block; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; overflow: hidden; pointer-events: auto; }
    html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden !important; position: fixed; }
    
    .split-layout {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(100deg, #d1e5e4 0%, #d1eef2 25%, #d9ddec 50%, #e8d3e5ff 75%, #dde3e6 100%);
      background-size: cover; background-position: center; overflow: hidden !important;
    }
    
    .split-layout-bg {
       position: absolute; top: 0; bottom: 0; left: 0; right: 0;
       background: repeating-linear-gradient(
          to right, transparent, transparent 8vw,
          rgba(255,255,255,0.2) 8vw, rgba(255,255,255,0.2) 16vw
       );
       pointer-events: none; z-index: 0;
    }

    .top-nav {
      position: absolute; top: 0; left: 0; right: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.5rem 4rem; z-index: 10;
    }
    .company-logo {
      height: 45px;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.1));
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .company-logo:hover {
      transform: scale(1.05);
    }

    .content-wrapper {
      position: relative; z-index: 1; display: flex; max-width: 1300px;
      margin: 0 auto; padding: 0 4rem; align-items: center; height: 100vh;
    }

    .left-content { flex: 1; padding-right: 4rem; margin-top: -60px; }
    .hero-title {
      font-size: 4.5rem; font-weight: 800; color: #0056D2; 
      line-height: 1.1; letter-spacing: -1px; margin-bottom: 2rem;
    }
    .hero-subtitle {
      font-size: 1.05rem; color: #374151; line-height: 1.6; font-weight: 400; max-width: 480px;
    }

    .right-content { flex: 0 0 380px; }
    .login-card {
      background: #f7eff0; padding: 4rem 3rem; border-radius: 50px; 
      box-shadow: 0 10px 40px rgba(0,0,0,0.04);
    }
    .login-card h2 {
      text-align: center; font-size: 1.8rem; color: #111; font-weight: 800;
      margin-bottom: 0.5rem; letter-spacing: -0.5px;
    }
    .desc-text { text-align: center; color: #555; font-size: 0.95rem; margin-bottom: 2rem; }

    .form-group { margin-bottom: 1.5rem; }

    .form-group input {
      width: 100%; padding: 0.85rem 1.25rem; 
      border: 1px solid transparent; border-radius: 50px;
      font-size: 0.95rem; background: #ffffff;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: #111;
    }
    .form-group input:focus {
      outline: none; border-color: #0056D2;
      box-shadow: 0 0 0 4px rgba(0, 86, 210, 0.15); transform: translateY(-1px);
    }
    .form-group input.invalid {
      border: 1px solid #E52E2D; background: #fdf0f0; box-shadow: 0 0 0 4px rgba(229, 46, 45, 0.1);
    }
    .form-group input::placeholder { color: #9ca3af; }

    .field-error {
      color: #E52E2D; font-size: 0.75rem; margin-top: 6px; margin-left: 12px; font-weight: 500;
    }

    .success-alert { 
      display: flex; align-items: center; gap: 10px;
      padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; 
      font-size: 0.85rem; font-weight: 500;
      background: #f0fdf4; color: #15803d; border-left: 4px solid #16a34a; 
    }

    .signup-link { margin-top: 2rem; text-align: center; font-size: 0.9rem; color: #555; }
    .signup-link a { color: #E52E2D; font-weight: 600; text-decoration: none; }
    .signup-link a:hover { text-decoration: underline; }

    .submit-btn {
      width: 100%; padding: 0.9rem; margin-top: 1rem;
      background: #df2626; color: white; border: none; border-radius: 50px;
      font-size: 1rem; font-weight: 700; cursor: pointer;
      box-shadow: 0 10px 20px rgba(223, 38, 38, 0.35); transition: all 0.2s;
    }
    .submit-btn:hover:not(:disabled) { background: #c91f1f; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    @media (max-width: 1024px) {
       :host, html, body { overflow: auto !important; height: auto !important; }
       .split-layout { height: auto; min-height: 100vh; overflow: auto !important; }
       .content-wrapper { flex-direction: column; padding: 6rem 2rem 4rem !important; height: auto; }
       .left-content { padding-right: 0; margin-top: 0; margin-bottom: 3rem; text-align: center; }
       .hero-title { font-size: 3.5rem; }
       .right-content { width: 100%; max-width: 400px; }
       .top-nav { padding: 1.5rem 2rem; }
    }
    @media (max-width: 768px) {
       .hero-title { font-size: 2.5rem; }
       .login-card { padding: 2.5rem 1.5rem; border-radius: 30px; }
       .top-nav { justify-content: center; }
    }
  `]
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = signal(false);
  successMsg = signal('');

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && (c?.dirty || c?.touched));
  }

  onLogoClick() {
    this.router.navigate(['/']);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    // Mock API call for password reset
    setTimeout(() => {
      this.loading.set(false);
      this.successMsg.set('If your email is registered, you will receive a password reset link shortly.');
    }, 1500);
  }
}
