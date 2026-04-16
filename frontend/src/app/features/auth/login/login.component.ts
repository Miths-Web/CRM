import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <!-- ========================================== -->
    <!-- HTML DESIGN PART (Login Page ka layout yahan se start hota hai) -->
    <!-- ========================================== -->
    <div class="split-layout">
      <!-- Left side header / nav: (Upar wala bar jahan company ka logo lagega) -->
      <nav class="top-nav">
        <div class="logo-area" (click)="onLogoClick()" style="cursor: pointer;">
          <!-- Logo image lagayi gayi hai jo assets/ folder se aayegi -->
          <img src="logo.png" alt="Dhwiti Digital Solution" class="company-logo">
        </div>
      </nav>

      <!-- Main Content Area: (Page ka baaki hissa jaha left pe Text aur right pe Form hoga) -->
      <div class="content-wrapper">
        <!-- Left Side Text: (Moti heading aur description) -->
        <div class="left-content">
          <h1 class="welcome-text">Welcome</h1>
          <h2 class="admin-label">User!</h2>
        </div>

        <!-- Right Side Form: (Login Box / Card jahan data dala jayega) -->
        <div class="right-content">
          <div class="login-card">
            <h2>Get started</h2>
            
            <!-- (ngSubmit) calls onSubmit() function when the form is submitted -->
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              
              <!-- Email Input Box -->
              <div class="form-group">
                <input type="email" formControlName="email" placeholder="Email"
                       [class.invalid]="isInvalid('email')">
                <!-- Field Level Error -->
                <div class="field-error" *ngIf="isInvalid('email')">
                  Please enter a valid email address.
                </div>
              </div>
              
              <!-- Password Input Box -->
              <div class="form-group password-group">
                <div class="input-wrapper">
                  <input type="password" formControlName="password" placeholder="Password"
                         [class.invalid]="isInvalid('password')">
                </div>
                <!-- Field Level Error -->
                <div class="field-error" *ngIf="isInvalid('password')">
                  Password is required (min 6 characters).
                </div>
              </div>
              
              <!-- Error Alert: (Ye dabbi tabhi aayegi jab piche se error() set kiya jaye, jaise Galat Password) -->
              <div *ngIf="error()" class="error-alert">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="error-icon">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span class="error-message">{{ error() }}</span>
              </div>
              
              <!-- Checkbox aur Forgot Password -->
              <div class="options-group">
                <label class="remember-me">
                  <input type="checkbox"> Remember me
                </label>
                <a routerLink="/auth/forgot-password" class="forgot-link">Forgot Password?</a>
              </div>

              <!-- Main Login Button -->
              <button type="submit" [disabled]="loading()" class="submit-btn" [class.loading]="loading()">
                {{ loading() ? 'Logging In...' : 'Login' }}
              </button>

              <!-- Sign up text at the bottom -->
              <div class="signup-link">
                Don't have an account? <a routerLink="/auth/register">Sign up</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ========================================== */
    /* CSS STYLES PART (Pages ka design kaisa dikhna chahiye) */
    /* ========================================== */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :host { display: block; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; overflow: hidden; pointer-events: auto; }
    html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden !important; position: fixed; }
    
    /* Split Layout: (Poore Background ka rang Parda banane ke liye) */
    .split-layout {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      /* Background dhalta hua parda (gradient) style mein banaya hai */
      background: linear-gradient(100deg, #d1e5e4 0%, #d1eef2 25%, #d9ddec 50%, #e8d3e5ff 75%, #dde3e6 100%);
      background-size: cover;
      background-position: center;
      overflow: hidden !important;
    }

    /* Abstract vertical bands (Khambhe jaisi background design) */
    .split-layout::before {
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

    /* Upar ka Navigation block (Jahan Logo hai) */
    .top-nav {
      position: absolute;
      top: 0; left: 0; right: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      background: transparent;
      z-index: 10;
      font-size: 0.9rem;
    }

    .logo-area { 
      display: flex; 
      align-items: center; 
      gap: 0.5rem; 
      padding: 1rem 1.5rem; 
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
    
    /* Content Wrapper (Bada dabbe jisme Text Aur Form 1 line me hain) */
    .content-wrapper {
      position: relative;
      z-index: 1;
      display: flex;
      max-width: 1300px;
      margin: 0 auto;
      padding: 0 4rem;
      align-items: center;
      height: 100vh;
      overflow: hidden;
    }

    .left-content {
      flex: 1;
      padding-right: 4rem;
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
      margin-left: 280px; /* Aligned under 'm' of 'Welcome' */
    }

    .welcome-msg {
      font-size: 1.25rem;
      line-height: 1.5;
      color: #444;
      font-weight: 500;
      opacity: 0.8;
    }

    .right-content {
      flex: 0 0 380px;
    }

    /* Form Wali Safed Dibbi (Card design) */
    .login-card {
      background: rgba(255, 255, 255, 0.25); /* Seesha/Glass jaisa effect (transparent) */
      backdrop-filter: blur(30px); /* Piche ka blur dundhlaa karne ke liye setup */
      -webkit-backdrop-filter: blur(30px);
      padding: 5rem 3rem; 
      border-radius: 60px; /* Card ki golai badha di hai */
      box-shadow: 0 10px 40px rgba(0,0,0,0.03);
      border: 1px solid rgba(255,255,255,0.3);
    }

    .login-card h2 {
      text-align: center;
      font-size: 1.8rem; /* Slightly larger */
      color: #111;
      font-weight: 700; /* More bold */
      margin-bottom: 2.5rem;
      line-height: 1.2;
      letter-spacing: -0.5px;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .input-wrapper {
      position: relative;
    }

    /* Input box ke designs (Password aur Email waale dibbe) */
    .form-group input {
      width: 100%;
      padding: 0.85rem 1.25rem; 
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 50px;
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.9);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: #111;
    }

    /* Jab hum type box ke andar click kareinge tab uske bahar nila shadow ayega */
    .form-group input.invalid {
      border-color: #E52E2D;
      background: #fdf0f0;
      box-shadow: 0 0 0 4px rgba(229, 46, 45, 0.1);
    }

    /* Jab box par sirf mouse le ke jaen */
    .form-group input:hover {
      border-color: #999;
      background: #fff;
    }

    /* Placeholder yani pehle se dundhla likha 'Password' ka color */
    .form-group input::placeholder { color: #888; }
    
    .password-group input { padding-right: 1.25rem; }
    .field-error {
      color: #E52E2D;
      font-size: 0.8rem;
      margin-top: 6px;
      margin-left: 12px;
      font-weight: 500;
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

    .options-group {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 1.5rem 0 2rem 0; /* This adds the extra space below */
      font-size: 0.9rem;
      color: #555;
    }
    
    .options-group .remember-me {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .options-group .forgot-link {
      color: #0056D2;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
    }

    .options-group .forgot-link:hover {
      color: #003a8f;
      text-decoration: none;
    }

    .signup-link {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.9rem;
      color: #555;
    }

    .signup-link a {
      color: #E52E2D;
      font-weight: 600;
      text-decoration: none;
    }

    .signup-link a:hover {
      text-decoration: underline;
    }

    .submit-btn {
      width: 100%;
      padding: 0.9rem; /* Reduced to medium size */
      background: linear-gradient(135deg, #E52E2D 0%, #D12524 100%);
      color: white;
      border: none;
      border-radius: 50px;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(229, 46, 45, 0.35);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .submit-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(229, 46, 45, 0.45);
      filter: brightness(1.05);
    }

    .submit-btn:active {
      transform: translateY(0);
    }
    
    .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

    
    /* === Responsive Adjustments for Tablets === */
    @media (max-width: 1024px) {
       :host, html, body { 
         position: relative !important; 
         height: auto !important; 
         overflow: auto !important; 
       }
       .split-layout { 
         position: relative !important; 
         height: auto !important; 
         min-height: 100vh;
         overflow: auto !important; 
       }
       .content-wrapper { 
         flex-direction: column; 
         padding: 4rem 2rem !important; 
         height: auto !important;
         overflow: visible !important;
       }
       .left-content { padding-right: 0; margin-bottom: 3rem; text-align: center; }
       .hero-title { font-size: 3rem; }
       .right-content { flex: 0 0 auto; width: 100%; max-width: 400px; }
       .login-card { padding: 2.5rem 1.5rem; border-radius: 40px; }
       .top-nav { position: relative; padding: 1.5rem; }
    }

    /* === Responsive Adjustments for Mobile Phones (Naya add kiya hai) === */
    @media (max-width: 768px) {
       .hero-title { font-size: 2.2rem; }
       .hero-subtitle { font-size: 1.2rem; }
       .content-wrapper { padding: 2rem 1rem !important; }
       .login-card { padding: 2rem 1rem; border-radius: 25px; }
       .login-card h2 { font-size: 1.5rem; }
       .form-group input { padding: 0.75rem 1rem; font-size: 0.95rem; }
       .top-nav { padding: 1rem; justify-content: center; }
       .company-logo { height: 35px; } /* Mobile me logo thoda chota dikhega */
    }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = signal(false);
  error = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
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
    this.error.set('');

    const { email, password } = this.form.value;

    this.auth.login({ email, password }).subscribe({
      next: (res) => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        if (err.status === 0) {
          this.error.set('⚠️ Server is unreachable. Please check if the backend is running.');
        } else if (err.status === 429) {
          this.error.set('🚫 Too many login attempts. Please wait and try again later.');
        } else if (err.status === 401 || err.status === 400) {
          const msg = err.error?.message || 'Invalid email or password.';
          this.error.set(msg);
          // Disable login button if account is locked
          if (msg.toLowerCase().includes('locked')) {
            this.form.get('password')?.disable();
            setTimeout(() => this.form.get('password')?.enable(), 15 * 60 * 1000);
          }
        } else {
          this.error.set('An unexpected error occurred. Please try again.');
        }
        this.loading.set(false);
      }
    });
  }
}
