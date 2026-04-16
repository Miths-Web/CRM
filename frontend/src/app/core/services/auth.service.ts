import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, EMPTY } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { firstName: string; lastName: string; email: string; password: string; phone?: string; }
export interface UserProfile { id: string; firstName: string; lastName: string; email: string; avatarUrl?: string; roles: string[]; permissions?: string[]; phone?: string; department?: string; jobTitle?: string; }
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
                    // BUG-005 FIX: sessionStorage use karo — tab close hone par clear hota hai
                    sessionStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
                    this.currentUserSubject.next(res.user);
                }
            })
        );
    }

    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, request);
    }

    logout(): void {
        // BUG-014 FIX: Logout API error silently handle karo — user ko logout toh hona chahiye
        this.http.post(`${environment.apiUrl}/auth/logout`, {}).pipe(catchError(() => EMPTY)).subscribe();
        sessionStorage.removeItem(this.USER_KEY); // BUG-005 FIX: sessionStorage use karo
        this.currentUserSubject.next(null);
        this.router.navigate(['/auth/login']);
    }

    isLoggedIn(): boolean { return this.getCurrentUser() !== null; }
    getCurrentUser(): UserProfile | null { return this.currentUserSubject.value; }
    updateCurrentUser(user: UserProfile): void {
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
    }
    hasRole(role: string): boolean { return this.getCurrentUser()?.roles?.includes(role) ?? false; }
    isAdmin(): boolean { return this.hasRole('Admin'); }
    isManager(): boolean { return this.hasRole('Admin') || this.hasRole('Manager'); }

    private getStoredUser(): UserProfile | null {
        try { return JSON.parse(sessionStorage.getItem(this.USER_KEY) ?? 'null'); } // BUG-005 FIX
        catch { return null; }
    }

    hasPermission(module: string, action: string): boolean {
        if (this.isAdmin()) return true; // Admin has power sab kar sakta hai
        const p = this.getCurrentUser()?.permissions;
        if (!p) return false;
        return p.includes(`${module}.${action}`);
    }
}
