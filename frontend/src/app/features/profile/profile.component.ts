import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, Camera, Trash2, Calendar, Lock, CheckCircle2, User, Mail, Phone, Save, Key, AlertCircle, ShieldCheck } from 'lucide-angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="profile-page">

      <!-- Page Header -->
      <div class="profile-header">
        <div>
          <h1 class="page-title">My Profile</h1>
          <p class="page-sub">Manage your personal information and account settings</p>
        </div>
        <div class="role-badge" [class]="'role-' + userRole()">
          {{ userRole() }}
        </div>
      </div>

      <div class="profile-grid" *ngIf="!pageLoading()">

        <!-- Left: Avatar Card -->
        <div class="card avatar-card">
          <div class="avatar-section">
            <div class="avatar-wrap">
              <img *ngIf="profile()?.avatarUrl" [src]="profile()?.avatarUrl" class="avatar-img" alt="Avatar">
              <div *ngIf="!profile()?.avatarUrl" class="avatar-placeholder">
                {{ initials() }}
              </div>
              <label class="avatar-edit-btn" title="Change Photo">
                <input type="file" accept="image/*" (change)="onAvatarChange($event)" class="hidden-input">
                <lucide-icon [img]="Camera" class="icon-sm"></lucide-icon>
              </label>
            </div>
            <h2 class="avatar-name">{{ profile()?.firstName }} {{ profile()?.lastName }}</h2>
            <p class="avatar-email">{{ profile()?.email }}</p>
            <span class="avatar-role-badge role-{{ userRole() }}">{{ userRole() }}</span>
            <button *ngIf="profile()?.avatarUrl" class="btn-remove-avatar" (click)="removeAvatar()">
              <lucide-icon [img]="Trash2" class="icon-sm mr-1"></lucide-icon> Remove Photo
            </button>
          </div>

          <div class="profile-info-block">
            <div class="info-row">
              <span class="info-label"><lucide-icon [img]="Calendar" class="icon-xs inline-icon mr-1"></lucide-icon> Member Since</span>
              <span class="info-val">{{ profile()?.createdAt | date:'dd MMM yyyy' }}</span>
            </div>
            <div class="info-row" *ngIf="profile()?.lastLogin">
              <span class="info-label"><lucide-icon [img]="Lock" class="icon-xs inline-icon mr-1"></lucide-icon> Last Login</span>
              <span class="info-val">{{ profile()?.lastLogin | date:'dd MMM yyyy, h:mm a' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label"><lucide-icon [img]="CheckCircle2" class="icon-xs inline-icon mr-1"></lucide-icon> Account Status</span>
              <span class="info-val status-active">Active</span>
            </div>
          </div>
        </div>

        <!-- Right: Form Cards -->
        <div class="form-stack">

          <!-- Personal Info -->
          <div class="card form-card">
            <div class="card-heading">
              <h3 class="flex-align-center"><lucide-icon [img]="User" class="icon-md mr-2"></lucide-icon> Personal Information</h3>
              <p>Update your name and contact details</p>
            </div>

            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
              <div class="form-row">
                <div class="form-field">
                  <label>First Name</label>
                  <input type="text" formControlName="firstName" placeholder="Enter first name">
                  <span class="field-error" *ngIf="profileForm.get('firstName')?.touched && profileForm.get('firstName')?.invalid">Required</span>
                </div>
                <div class="form-field">
                  <label>Last Name</label>
                  <input type="text" formControlName="lastName" placeholder="Enter last name">
                </div>
              </div>
              <div class="form-field">
                <label class="flex-align-center"><lucide-icon [img]="Mail" class="icon-sm mr-1"></lucide-icon> Email Address</label>
                <input type="email" [value]="profile()?.email || ''" disabled class="field-disabled">
                <small>Email cannot be changed. Contact admin.</small>
              </div>
              <div class="form-field">
                <label class="flex-align-center"><lucide-icon [img]="Phone" class="icon-sm mr-1"></lucide-icon> Phone Number</label>
                <input type="tel" formControlName="phone" placeholder="+91 98765 43210">
              </div>

              <div class="form-actions">
                <div class="save-success flex-align-center" *ngIf="profileSaved()"><lucide-icon [img]="CheckCircle2" class="icon-sm mr-1"></lucide-icon> Profile updated successfully!</div>
                <div class="save-error flex-align-center" *ngIf="profileError()"><lucide-icon [img]="AlertCircle" class="icon-sm mr-1"></lucide-icon> {{ profileError() }}</div>
                <button type="submit" class="btn-primary flex-align-center" [disabled]="savingProfile()">
                  <lucide-icon [img]="Save" class="icon-sm mr-1" *ngIf="!savingProfile()"></lucide-icon>
                  {{ savingProfile() ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Change Password -->
          <div class="card form-card">
            <div class="card-heading">
              <h3 class="flex-align-center"><lucide-icon [img]="ShieldCheck" class="icon-md mr-2"></lucide-icon> Change Password</h3>
              <p>Keep your account secure with a strong password</p>
            </div>

            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
              <div class="form-field">
                <label>Current Password</label>
                <input type="password" formControlName="currentPassword" placeholder="Enter current password">
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label>New Password</label>
                  <input type="password" formControlName="newPassword" placeholder="Min. 8 characters">
                  <span class="field-error" *ngIf="passwordForm.get('newPassword')?.touched && passwordForm.get('newPassword')?.invalid">
                    Min. 8 characters required
                  </span>
                </div>
                <div class="form-field">
                  <label>Confirm Password</label>
                  <input type="password" formControlName="confirmPassword" placeholder="Repeat new password">
                </div>
              </div>

              <div class="form-actions">
                <div class="save-success flex-align-center" *ngIf="pwSaved()"><lucide-icon [img]="CheckCircle2" class="icon-sm mr-1"></lucide-icon> Password changed successfully!</div>
                <div class="save-error flex-align-center" *ngIf="pwError()"><lucide-icon [img]="AlertCircle" class="icon-sm mr-1"></lucide-icon> {{ pwError() }}</div>
                <button type="submit" class="btn-primary flex-align-center" [disabled]="savingPw()">
                  <lucide-icon [img]="Key" class="icon-sm mr-1" *ngIf="!savingPw()"></lucide-icon>
                  {{ savingPw() ? 'Updating...' : 'Update Password' }}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      <!-- Loading Spinner -->
      <div *ngIf="pageLoading()" class="loading-wrap">
        <div class="spinner"></div>
        <p>Loading your profile...</p>
      </div>

    </div>
  `,
  styles: [`
    .profile-page { padding: 0.75rem 1.5rem; max-width: 1100px; margin: 0 auto; }

    .profile-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1rem; padding: 0.75rem 1.25rem;
      background: rgba(255,255,255,0.65); backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.4); border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }
    .page-title { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin: 0; }
    .page-sub { font-size: 0.75rem; color: var(--text-muted); margin: 0.15rem 0 0; }

    .role-badge {
      padding: 0.3rem 0.8rem; border-radius: 999px; font-size: 0.7rem;
      font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
    }

    .profile-grid { display: grid; grid-template-columns: 260px 1fr; gap: 1rem; }

    /* Avatar Card */
    .avatar-card { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
    .avatar-section { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
    .avatar-wrap { position: relative; }
    .avatar-img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #6366f1; }
    .avatar-placeholder {
      width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; font-weight: 800; color: white;
    }
    .avatar-edit-btn {
      position: absolute; bottom: 0; right: 0; width: 26px; height: 26px;
      background: #6366f1; border-radius: 50%; display: flex; align-items: center;
      justify-content: center; font-size: 0.7rem; cursor: pointer; border: 2px solid white;
    }
    .hidden-input { display: none; }
    .avatar-name { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .avatar-email { font-size: 0.75rem; color: var(--text-muted); margin: 0; }
    .avatar-role-badge { padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.65rem; font-weight: 700; }
    .btn-remove-avatar {
      background: none; border: 1px solid #fca5a5; color: #ef4444;
      padding: 0.25rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.7rem;
    }
    .btn-remove-avatar:hover { background: #fef2f2; }

    .profile-info-block { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.5rem; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px dashed var(--border); }
    .info-label { font-size: 0.72rem; color: var(--text-muted); }
    .info-val { font-size: 0.78rem; font-weight: 600; color: var(--text-primary); }
    .status-active { color: #059669; }

    /* Form Stack */
    .form-stack { display: flex; flex-direction: column; gap: 1rem; }
    .form-card { padding: 1.25rem; }
    .card-heading { margin-bottom: 1rem; }
    .card-heading h3 { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.15rem; }
    .card-heading p { font-size: 0.75rem; color: var(--text-muted); margin: 0; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
    .form-field label { font-size: 0.72rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .form-field input {
      padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: 6px;
      background: var(--bg-secondary); color: var(--text-primary); font-size: 0.85rem; outline: none;
      transition: border-color 0.2s;
    }
    .form-field input:focus { border-color: #6366f1; }
    .field-disabled { opacity: 0.6; cursor: not-allowed; }
    .form-field small { font-size: 0.65rem; color: var(--text-muted); margin-top: 0.2rem; }
    .field-error { font-size: 0.65rem; color: #ef4444; }

    .form-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.25rem; }
    .btn-primary {
      padding: 0.5rem 1.25rem; background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 0.82rem;
      cursor: pointer; transition: opacity 0.2s;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .save-success { font-size: 0.75rem; color: #059669; font-weight: 600; }
    .save-error { font-size: 0.75rem; color: #ef4444; font-weight: 600; }

    /* Role Colors */
    .role-Admin { background: rgba(239,68,68,0.1); color: #dc2626; }
    .role-Manager { background: rgba(245,158,11,0.1); color: #d97706; }
    .role-Sales\ Rep { background: rgba(99,102,241,0.1); color: #4f46e5; }
    .role-Support\ Agent { background: rgba(16,185,129,0.1); color: #059669; }
    .role-Viewer { background: rgba(107,114,128,0.1); color: #6b7280; }

    .loading-wrap { text-align: center; padding: 3rem; color: var(--text-muted); }
    .spinner { width: 30px; height: 30px; border: 3px solid var(--border); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .icon-xs { width: 12px; height: 12px; }
    .icon-sm { width: 14px; height: 14px; }
    .icon-md { width: 18px; height: 18px; }
    .mr-1 { margin-right: 0.25rem; }
    .mr-2 { margin-right: 0.4rem; }
    .flex-align-center { display: flex; align-items: center; }
    .inline-icon { display: inline-flex; vertical-align: middle; }

    @media (max-width: 768px) {
      .profile-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  readonly Camera = Camera;
  readonly Trash2 = Trash2;
  readonly Calendar = Calendar;
  readonly Lock = Lock;
  readonly CheckCircle2 = CheckCircle2;
  readonly User = User;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly Save = Save;
  readonly Key = Key;
  readonly AlertCircle = AlertCircle;
  readonly ShieldCheck = ShieldCheck;

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  profile = signal<any>(null);
  pageLoading = signal(true);
  userRole = signal('');

  // Profile form
  savingProfile = signal(false);
  profileSaved = signal(false);
  profileError = signal('');

  // Password form
  savingPw = signal(false);
  pwSaved = signal(false);
  pwError = signal('');

  profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: [''],
    phone: ['']
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  initials = () => {
    const p = this.profile();
    if (!p) return '?';
    return ((p.firstName?.[0] || '') + (p.lastName?.[0] || '')).toUpperCase() || p.email?.[0]?.toUpperCase() || '?';
  };

  ngOnInit() {
    // Get role from auth token (getCurrentUser() returns cached session user)
    const u = this.auth.getCurrentUser();
    this.userRole.set(u?.roles?.[0] || '');

    this.http.get<any>('http://localhost:5284/api/users/profile').subscribe({
      next: (data) => {
        this.profile.set(data);
        this.profileForm.patchValue({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || ''
        });
        this.userRole.set(data.roles?.[0] || this.userRole());
        this.pageLoading.set(false);
      },
      error: () => this.pageLoading.set(false)
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true);
    this.profileSaved.set(false);
    this.profileError.set('');

    this.http.put('http://localhost:5284/api/users/profile', this.profileForm.value).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.profileSaved.set(true);
        // Refresh
        this.http.get<any>('http://localhost:5284/api/users/profile').subscribe(d => this.profile.set(d));
        setTimeout(() => this.profileSaved.set(false), 3000);
      },
      error: (e) => {
        this.savingProfile.set(false);
        this.profileError.set(e?.error?.message || 'Failed to update profile.');
      }
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) return;
    const val = this.passwordForm.value;
    if (val.newPassword !== val.confirmPassword) {
      this.pwError.set('Passwords do not match!');
      return;
    }
    this.savingPw.set(true);
    this.pwSaved.set(false);
    this.pwError.set('');

    this.http.post('http://localhost:5284/api/users/change-password', {
      currentPassword: val.currentPassword,
      newPassword: val.newPassword
    }).subscribe({
      next: () => {
        this.savingPw.set(false);
        this.pwSaved.set(true);
        this.passwordForm.reset();
        setTimeout(() => this.pwSaved.set(false), 3000);
      },
      error: (e) => {
        this.savingPw.set(false);
        this.pwError.set(e?.error?.message || 'Failed to change password.');
      }
    });
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    this.http.post<any>('http://localhost:5284/api/users/profile/avatar', formData).subscribe({
      next: (res) => {
        const p = this.profile();
        if (p) this.profile.set({ ...p, avatarUrl: res.avatarUrl });
      },
      error: (e) => alert(e?.error?.message || 'Avatar upload failed.')
    });
  }

  removeAvatar() {
    this.http.delete('http://localhost:5284/api/users/profile/avatar').subscribe({
      next: () => {
        const p = this.profile();
        if (p) this.profile.set({ ...p, avatarUrl: null });
      }
    });
  }
}
