import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { firstName: string; lastName: string; email: string; password: string; phone?: string; }
export interface UserProfile { id: string; firstName: string; lastName: string; email: string; avatarUrl?: string; roles: string[]; }
export interface AuthResponse { success: boolean; message: string; accessToken?: string; refreshToken?: string; expiresAt?: string; user?: UserProfile; }

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly TOKEN_KEY = 'dhwiti_token';
    private readonly REFRESH_KEY = 'dhwiti_refresh';
    private readonly USER_KEY = 'dhwiti_user';

    private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.getStoredUser());
    currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) { }

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
            tap(res => {
                if (res.success && res.user) {
                    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
                    this.currentUserSubject.next(res.user);
                }
            })
        );
    }

    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, request);
    }

    logout(): void {
        this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
        localStorage.removeItem(this.USER_KEY);
        this.currentUserSubject.next(null);
        this.router.navigate(['/auth/login']);
    }

    isLoggedIn(): boolean { return this.getCurrentUser() !== null; }
    getCurrentUser(): UserProfile | null { return this.currentUserSubject.value; }
    hasRole(role: string): boolean { return this.getCurrentUser()?.roles?.includes(role) ?? false; }
    isAdmin(): boolean { return this.hasRole('Admin'); }
    isManager(): boolean { return this.hasRole('Admin') || this.hasRole('Manager'); }

    private getStoredUser(): UserProfile | null {
        try { return JSON.parse(localStorage.getItem(this.USER_KEY) ?? 'null'); }
        catch { return null; }
    }
}
