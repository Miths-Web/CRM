import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="setup-layout">
      <!-- Navbar Jahaan logo laga hai -->
      <nav class="top-nav">
        <div class="logo-area" (click)="onLogoClick()" style="cursor: pointer;">
          <img src="logo.png" alt="Dhwiti Digital Solution" class="company-logo">
        </div>
      </nav>

      <!-- Main Container jisme Text (Left) aur Form (Right) hoga -->
      <div class="main-container">
        
        <!-- Info Section (Bada sa 'Hey User' wala text) -->
        <div class="setup-info">
          <h1 class="welcome-text">Hey</h1>
          <h2 class="admin-label">User!</h2>
          <p class="welcome-msg">
            Create an account to join the world's favorite CRM. <br>
            Start growing your business today.
          </p>
        </div>

        <!-- Wizard Card (Form wala safed dabba) -->
        <div class="setup-wizard-card">
          
          <div class="wizard-header">
             <h1>Registration</h1>
          </div>

          <div class="wizard-body">
            <!-- Form block mimicking original step-content -->
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="step-content">

              <!-- Global Alert Messages -->
              <div *ngIf="errorMsg()" class="error-alert">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" class="error-icon">
                  <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span class="error-message">{{ errorMsg() }}</span>
              </div>
              
              <div *ngIf="successMsg()" class="success-alert">
                <div class="step-icon success" style="margin-bottom: 0.5rem; width: 40px; height: 40px;">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span class="success-text" style="color: #4caf50; font-weight: 500;">{{ successMsg() }}</span>
              </div>

              <!-- 1 Column Form Layout -->
              <div class="form-group">
                <div class="input-wrapper">
                  <input type="text" formControlName="firstName" placeholder="First Name" [class.invalid]="isInvalid('firstName')">
                  <div class="field-error" *ngIf="isInvalid('firstName')">First Name required</div>
                </div>
              </div>
              
              <div class="form-group">
                <div class="input-wrapper">
                  <input type="text" formControlName="lastName" placeholder="Last Name" [class.invalid]="isInvalid('lastName')">
                  <div class="field-error" *ngIf="isInvalid('lastName')">Last Name required</div>
                </div>
              </div>

              <div class="form-group">
                <div class="input-wrapper">
                  <input type="email" formControlName="email" placeholder="Email Address" [class.invalid]="isInvalid('email')">
                  <div class="field-error" *ngIf="isInvalid('email')">Valid email required</div>
                </div>
              </div>

              <div class="form-group">
                <div class="input-wrapper">
                  <input type="tel" formControlName="phone" placeholder="Phone Number" maxlength="10" [class.invalid]="isInvalid('phone')">
                  <div class="field-error" *ngIf="isInvalid('phone')">Needs 10 digits</div>
                </div>
              </div>

              <div class="form-group">
                <div class="input-wrapper">
                  <input type="password" formControlName="password" placeholder="Password (Min 8 chars)" [class.invalid]="isInvalid('password')">
                  <div class="field-error" *ngIf="isInvalid('password')">Invalid format</div>
                </div>
              </div>

              <!-- Register Button -->
              <button type="submit" [disabled]="loading()" class="btn-primary">
                {{ loading() ? 'CREATING...' : 'Register' }}
              </button>

              <!-- Footer redirect below button -->
              <div class="login-redirect">
                Already have an account? <a routerLink="/auth/login">Login</a>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ========================================== */
    /* EXACT CSS STYLES FROM CRM PROJECT         */
    /* ========================================== */
    :host { display: block; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; overflow: hidden; pointer-events: auto; }
    html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden !important; position: fixed; }

    .setup-layout {
      position: fixed;
      top: 0; left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(100deg, #d1e5e4 0%, #d1eef2 25%, #d9ddec 50%, #e8d3e5ff 75%, #dde3e6 100%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .setup-layout::before {
       content: "";
       position: absolute;
       top: 0; bottom: 0; left: 0; right: 0;
       background: repeating-linear-gradient(
          to right,
          transparent,
          transparent 8vw,
          rgba(255,255,255,0.2) 8vw,
          rgba(255,255,255,0.2) 16vw
       );
       pointer-events: none;
       z-index: 0;
    }

    .top-nav {
      position: absolute;
      top: 0; left: 0; right: 0;
      padding: 1rem 1.5rem;
      z-index: 10;
    }

    .company-logo {
      height: 45px;
      width: auto;
      filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.1));
      transition: transform 0.3s ease;
    }

    .main-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      width: 90%;
      z-index: 5;
      padding: 0 2rem;
    }

    .setup-info {
      flex: 1;
      max-width: 400px;
      color: #111;
      animation: fadeIn 0.8s ease-out;
    }

    .welcome-text {
      font-size: 5rem;
      font-weight: 850;
      line-height: 1;
      margin-bottom: 0;
      color: #0056D2;
      letter-spacing: -3px;
    }

    .admin-label {
      font-size: 3.5rem;
      font-weight: 800;
      color: #1a1a1a;
      margin-bottom: 1.5rem;
      letter-spacing: -2px;
      line-height: 1;
      margin-left: 110px; /* Align specifically under the 'y' of 'Hey' */
    }

    .welcome-msg {
      font-size: 1.25rem;
      line-height: 1.5;
      color: #444;
      font-weight: 500;
      opacity: 0.8;
    }

    .setup-wizard-card {
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(30px);
      -webkit-backdrop-filter: blur(30px);
      padding: 5rem 3rem; /* Matched exactly to login layout padding */
      border-radius: 60px;
      max-width: 380px; /* Same exact width as the login form */
      width: 100%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.03);
      border: 1px solid rgba(255,255,255,0.3);
    }

    .wizard-header {
      text-align: center;
      margin-bottom: 2.5rem; /* Giving breathing room similar to login */
    }

    .wizard-header h1 {
      font-size: 1.8rem;
      font-weight: 700;
      color: #111;
      margin-bottom: 0;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }

    .wizard-body {
      min-height: 220px;
    }

    .step-content {
      animation: fadeIn 0.4s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .login-redirect {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.9rem;
      color: #555;
    }
    
    .login-redirect a {
      color: #E52E2D; /* Matched the login red link */
      text-decoration: none;
      font-weight: 600;
    }
    
    .login-redirect a:hover {
      text-decoration: underline;
    }

    .step-icon.success {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }

    .form-group { margin-bottom: 1.5rem; position: relative; }
    
    .input-wrapper {
      position: relative;
    }

    input { 
      width: 100%; 
      padding: 0.85rem 1.25rem; 
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 50px; 
      font-size: 1rem; 
      background: rgba(255, 255, 255, 0.9);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: #111;
      font-family: inherit;
    }

    input.invalid {
      border-color: #E52E2D;
      background: #fdf0f0;
      box-shadow: 0 0 0 4px rgba(229, 46, 45, 0.1);
    }

    input:hover {
      border-color: #999;
      background: #fff;
    }

    input::placeholder { color: #888; }

    input:focus { 
      outline: none; 
      border-color: #0056D2; 
      background: #fff;
      box-shadow: 0 0 0 3px rgba(0, 86, 210, 0.1);
    }



    /* Red submit button exactly from the login design */
    .btn-primary {
      width: 100%;
      padding: 0.9rem;
      background: #E52E2D; /* Solid red to avoid purple gradient shifting */
      color: white;
      border: none;
      border-radius: 50px;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(229, 46, 45, 0.2);
      transition: all 0.3s ease;
    }

    .btn-primary:hover:not(:disabled) {
      background: #D12524; /* Simple hover darker red */
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(229, 46, 45, 0.4);
    }

    .btn-primary:active { transform: translateY(0); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

    .field-error {
      color: #E52E2D;
      font-size: 0.75rem;
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      font-weight: 600;
      white-space: nowrap;
      pointer-events: none;
      background: #fdf0f0;
      padding-left: 5px;
    }

    .error-alert { 
      display: flex; 
      align-items: center;
      gap: 10px;
      background: #fdf0f0; 
      color: #d92d20; 
      padding: 0.8rem 1rem; 
      border-radius: 8px; 
      border-left: 4px solid #d92d20;
      margin-bottom: 1.5rem; 
      animation: shake 0.4s ease-in-out;
    }
    
    .error-icon { flex-shrink: 0; }
    .error-message { font-size: 0.85rem; color: #b42318; line-height: 1.4; font-weight: 500; }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }

    .success-alert {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    @media (max-width: 1024px) {
      .setup-layout { overflow: auto; align-items: flex-start; padding: 2rem 0; }
      .main-container { flex-direction: column; gap: 2rem; }
      .setup-info { text-align: center; margin-top: 3rem; }
      .welcome-text { font-size: 3.5rem; }
      .admin-label { font-size: 2.5rem; }
      .setup-wizard-card { max-width: 600px; width: 100%; }
    }

    @media (max-width: 768px) {
      .welcome-text { font-size: 2.5rem; }
      .admin-label { font-size: 2rem; margin-bottom: 0.5rem; }
      .welcome-msg { font-size: 1rem; }
      .setup-wizard-card { padding: 1.5rem 1rem; border-radius: 20px; }
      .top-nav { padding: 0.5rem 1rem; justify-content: center; position: relative; }
      .company-logo { height: 35px; }
    }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)
      ]]
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && (c?.dirty || c?.touched));
  }



  onLogoClick() {
    this.router.navigate(['/']);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    this.auth.register(this.form.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.successMsg.set('Account created! Redirecting to login...');
          setTimeout(() => this.router.navigate(['/auth/login']), 1500);
        } else {
          this.errorMsg.set(res.message || 'Setup failed. Please check your inputs.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 0) {
          this.errorMsg.set('Server is unreachable. Please check if the backend is running.');
        } else {
          this.errorMsg.set(err.error?.message || 'Critical error during setup. Please try again.');
        }
      }
    });
  }
}
