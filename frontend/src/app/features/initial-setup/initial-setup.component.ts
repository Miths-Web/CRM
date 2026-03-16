import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-initial-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="split-layout">

      <!-- Top Nav Logo -->
      <nav class="top-nav">
        <div class="logo-area">
          <img src="logo.png" alt="Dhwiti Digital Solution" class="company-logo">
        </div>
      </nav>

      <!-- Main Content -->
      <div class="content-wrapper">

        <!-- Left Hero -->
        <div class="left-content">
          <h4 class="hero-title">Welcome to<br>Dhwiti CRM.</h4>
          <p class="hero-subtitle">
            Let's get you started. Create your<br>
            first Admin account to unlock full<br>
            system access and begin managing<br>
            your team, deals, and customers.
          </p>
          <div class="badge-wrap">
            <span class="info-badge">🔐 First Time Setup</span>
          </div>
        </div>

        <!-- Right Form Card -->
        <div class="right-content">
          <div class="login-card">
            <h2>Create Admin</h2>
            <p class="desc-text">Set up your administrator account.</p>

            <form [formGroup]="setupForm" (ngSubmit)="onSubmit()">

              <!-- Name Row -->
              <div class="name-row">
                <div class="form-group">
                  <input type="text" formControlName="firstName" placeholder="First Name"
                         [class.invalid]="isInvalid('firstName')">
                  <div class="field-error" *ngIf="isInvalid('firstName')">First name required.</div>
                </div>
                <div class="form-group">
                  <input type="text" formControlName="lastName" placeholder="Last Name"
                         [class.invalid]="isInvalid('lastName')">
                  <div class="field-error" *ngIf="isInvalid('lastName')">Last name required.</div>
                </div>
              </div>

              <!-- Email -->
              <div class="form-group">
                <input type="email" formControlName="email" placeholder="Admin Email"
                       [class.invalid]="isInvalid('email')">
                <div class="field-error" *ngIf="isInvalid('email')">Enter a valid email address.</div>
              </div>

              <!-- Phone -->
              <div class="form-group">
                <input type="tel" formControlName="phone" placeholder="Phone (Optional)">
              </div>

              <!-- Password -->
              <div class="form-group">
                <input type="password" formControlName="password" placeholder="Password (min 8 chars)"
                       [class.invalid]="isInvalid('password')">
                <div class="field-error" *ngIf="isInvalid('password')">
                  <span *ngIf="f['password'].errors?.['required']">Password is required.</span>
                  <span *ngIf="f['password'].errors?.['minlength']">Min 8 characters.</span>
                  <span *ngIf="f['password'].errors?.['pattern']">Must include uppercase, number & special char.</span>
                </div>
                <!-- Password Strength Bar -->
                <div class="strength-wrap" *ngIf="f['password'].value">
                  <div class="strength-bar">
                    <div class="bar" [class]="strengthClass"></div>
                  </div>
                  <small class="strength-label" [class]="'label-' + strengthClass">{{ strengthLabel }}</small>
                </div>
              </div>

              <!-- Confirm Password -->
              <div class="form-group">
                <input type="password" formControlName="confirmPassword" placeholder="Confirm Password"
                       [class.invalid]="setupForm.errors?.['mismatch'] && f['confirmPassword'].touched">
                <div class="field-error" *ngIf="setupForm.errors?.['mismatch'] && f['confirmPassword'].touched">
                  Passwords do not match.
                </div>
              </div>

              <!-- Error Alert -->
              <div *ngIf="errorMsg" class="error-alert">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="error-icon">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span class="error-message">{{ errorMsg }}</span>
              </div>

              <!-- Success Alert -->
              <div *ngIf="successMsg" class="success-alert">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>{{ successMsg }}</span>
              </div>

              <!-- Admin Note -->
              <div class="info-box">
                <strong>Full Admin Access Granted</strong>
                <p>This account controls the entire system. You can add Managers & Employees from Settings after login.</p>
              </div>

              <!-- Submit -->
              <button type="submit" class="submit-btn" [disabled]="loading || setupForm.invalid">
                {{ loading ? 'Creating Admin...' : 'Create Admin Account' }}
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :host { display: block; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; overflow: hidden; pointer-events: auto; }

    .split-layout {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(100deg, #d1e5e4 0%, #d1eef2 25%, #d9ddec 50%, #e8d3e5ff 75%, #dde3e6 100%);
    }
    .split-layout::before {
      content: ""; position: absolute; top: 0; bottom: 0; left: 0; right: 0;
      background: repeating-linear-gradient(to right, transparent, transparent 8vw, rgba(255,255,255,0.2) 8vw, rgba(255,255,255,0.2) 16vw);
      pointer-events: none; z-index: 0;
    }

    .top-nav {
      position: absolute; top: 0; left: 0; right: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 2rem; background: transparent; z-index: 10;
    }
    .logo-area { display: flex; align-items: center; gap: 0.5rem; padding: 1rem 1.5rem; }
    .company-logo { height: 45px; width: auto; object-fit: contain; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.1)); transition: all 0.3s ease; cursor: pointer; }
    .company-logo:hover { transform: scale(1.05); }

    .content-wrapper {
      position: relative; z-index: 1; display: flex; max-width: 1300px;
      margin: 0 auto; padding: 0 4rem; align-items: center; height: 100vh; overflow: hidden;
    }

    .left-content { flex: 1; padding-right: 4rem; }
    .hero-title { font-size: 4.5rem; font-weight: 800; color: #0056D2; line-height: 1.1; letter-spacing: -1px; margin-bottom: 2rem; }
    .hero-subtitle { font-size: 1.05rem; color: #374151; line-height: 1.7; font-weight: 400; max-width: 480px; margin-bottom: 1.5rem; }
    .badge-wrap { margin-top: 1rem; }
    .info-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(0,86,210,0.1); border: 1px solid rgba(0,86,210,0.2); color: #0056D2; font-size: 0.85rem; font-weight: 600; padding: 6px 14px; border-radius: 20px; }

    .right-content { flex: 0 0 420px; }
    .login-card {
      background: rgba(255,255,255,0.25); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
      padding: 2.5rem 2.5rem; border-radius: 50px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid rgba(255,255,255,0.3);
      max-height: 90vh; overflow-y: auto;
    }
    .login-card::-webkit-scrollbar { width: 4px; }
    .login-card::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
    .login-card h2 { text-align: center; font-size: 1.8rem; color: #111; font-weight: 700; margin-bottom: 0.4rem; letter-spacing: -0.5px; }
    .desc-text { text-align: center; color: #555; font-size: 0.9rem; margin-bottom: 1.5rem; }

    .name-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group input {
      width: 100%; padding: 0.8rem 1.25rem;
      border: 1px solid rgba(0,0,0,0.12); border-radius: 50px;
      font-size: 0.95rem; background: rgba(255,255,255,0.9);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); color: #111; outline: none;
    }
    .form-group input:focus { border-color: #0056D2; box-shadow: 0 0 0 3px rgba(0,86,210,0.15); }
    .form-group input.invalid { border-color: #E52E2D; background: #fdf0f0; box-shadow: 0 0 0 3px rgba(229,46,45,0.1); }
    .form-group input::placeholder { color: #888; }
    .field-error { color: #E52E2D; font-size: 0.75rem; margin-top: 4px; margin-left: 12px; font-weight: 500; }

    .strength-wrap { margin-top: 6px; }
    .strength-bar { height: 4px; background: rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden; margin-bottom: 3px; }
    .bar { height: 100%; border-radius: 4px; transition: width 0.4s, background 0.4s; }
    .bar.weak   { width: 33%; background: #ef4444; }
    .bar.medium { width: 66%; background: #f59e0b; }
    .bar.strong { width: 100%; background: #10b981; }
    .strength-label { font-size: 0.7rem; }
    .label-weak   { color: #ef4444; }
    .label-medium { color: #f59e0b; }
    .label-strong { color: #10b981; }

    .error-alert { display: flex; align-items: center; gap: 10px; background: #fdf0f0; color: #d92d20; padding: 0.75rem 1rem; border-radius: 8px; border-left: 4px solid #d92d20; margin-bottom: 1rem; animation: shake 0.4s ease-in-out; }
    .error-icon { flex-shrink: 0; }
    .error-message { font-size: 0.83rem; color: #b42318; font-weight: 500; }
    .success-alert { display: flex; align-items: center; gap: 8px; background: #f0fdf4; color: #15803d; padding: 0.75rem 1rem; border-radius: 8px; border-left: 4px solid #16a34a; margin-bottom: 1rem; font-size: 0.85rem; }
    @keyframes shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-4px); } 40%,80% { transform: translateX(4px); } }

    .info-box { background: rgba(0,86,210,0.07); border: 1px solid rgba(0,86,210,0.15); border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1.25rem; }
    .info-box strong { color: #0056D2; font-size: 0.82rem; display: block; margin-bottom: 3px; }
    .info-box p { color: #374151; font-size: 0.78rem; line-height: 1.4; }

    .submit-btn {
      width: 100%; padding: 0.9rem;
      background: linear-gradient(135deg, #E52E2D 0%, #D12524 100%);
      color: white; border: none; border-radius: 50px;
      font-size: 1rem; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 15px rgba(229,46,45,0.35); transition: all 0.3s;
    }
    .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(229,46,45,0.45); filter: brightness(1.05); }
    .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

    @media (max-width: 1024px) {
      :host, .split-layout { position: relative !important; height: auto !important; overflow: auto !important; }
      .content-wrapper { flex-direction: column; padding: 6rem 2rem 3rem !important; height: auto !important; }
      .left-content { padding-right: 0; margin-bottom: 2rem; text-align: center; }
      .hero-title { font-size: 3rem; }
      .right-content { flex: 0 0 auto; width: 100%; max-width: 480px; }
    }
    @media (max-width: 768px) {
      .hero-title { font-size: 2.2rem; }
      .name-row { grid-template-columns: 1fr; gap: 0; }
      .login-card { padding: 2rem 1.5rem; border-radius: 30px; }
      .company-logo { height: 35px; }
    }
  `]
})
export class InitialSetupComponent implements OnInit {
  setupForm!: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) { }

  ngOnInit() {
    this.setupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  get f() { return this.setupForm.controls; }

  get strengthClass(): string {
    const p = this.f['password'].value || '';
    if (p.length < 8) return 'weak';
    const isStrong = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(p);
    return isStrong ? 'strong' : 'medium';
  }

  get strengthLabel(): string {
    return { weak: 'Weak', medium: 'Medium', strong: 'Strong' }[this.strengthClass] ?? '';
  }

  passwordMatchValidator(group: AbstractControl) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  isInvalid(field: string): boolean {
    const ctrl = this.setupForm.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onSubmit() {
    if (this.setupForm.invalid) {
      this.setupForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const { firstName, lastName, email, phone, password } = this.setupForm.value;

    this.http.post(`${environment.apiUrl}/auth/setup`, { firstName, lastName, email, phone, password })
      .subscribe({
        next: () => {
          this.successMsg = 'Admin account created! Redirecting to login...';
          this.loading = false;
          setTimeout(() => this.router.navigate(['/auth/login']), 2000);
        },
        error: (err) => {
          if (err.status === 0) {
            this.errorMsg = 'Server is unreachable. Please check if the backend is running.';
          } else {
            this.errorMsg = err.error?.message || 'Setup failed. Please try again.';
          }
          this.loading = false;
        }
      });
  }
}
