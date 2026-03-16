import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    roles: string[];
    isActive: boolean;
    avatarUrl?: string;
    createdAt: string;
}

export interface UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface CompanySettings {
    companyName: string;
    companyEmail?: string;
    companyPhone?: string;
    website?: string;
    address?: string;
    timezone?: string;
    currency?: string;
    logoUrl?: string;
}

export interface SystemInfo {
    version: string;
    environment: string;
    dbStatus: string;
    emailStatus: string;
    storageUsed: string;
    uptime: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
    constructor(private api: ApiService) { }

    /** Profile */
    getProfile(): Observable<UserProfile> {
        return this.api.get<UserProfile>('users/profile');
    }

    updateProfile(dto: UpdateProfileDto): Observable<UserProfile> {
        return this.api.put<UserProfile>('users/profile', dto);
    }

    changePassword(dto: ChangePasswordDto): Observable<{ success: boolean; message: string }> {
        return this.api.post('users/change-password', dto);
    }

    /** Users (Admin only) */
    getAllUsers(): Observable<UserProfile[]> {
        return this.api.get<UserProfile[]>('users');
    }

    createUser(dto: { firstName: string; lastName: string; email: string; password: string; role: string }): Observable<UserProfile> {
        return this.api.post<UserProfile>('users', dto);
    }

    updateUserRole(userId: string, role: string): Observable<UserProfile> {
        return this.api.put<UserProfile>(`users/${userId}/role`, { roleName: role });
    }

    toggleUserStatus(userId: string): Observable<UserProfile> {
        return this.api.patch<UserProfile>(`users/${userId}/toggle-status`, {});
    }

    deleteUser(userId: string): Observable<void> {
        return this.api.delete<void>(`users/${userId}`);
    }

    /** Company */
    getCompanySettings(): Observable<CompanySettings> {
        return this.api.get<CompanySettings>('settings/company');
    }

    updateCompanySettings(dto: CompanySettings): Observable<CompanySettings> {
        return this.api.put<CompanySettings>('settings/company', dto);
    }

    /** System */
    getSystemInfo(): Observable<SystemInfo> {
        return this.api.get<SystemInfo>('settings/system-info');
    }

    /** Admin — Demo Data */
    seedDemoData(): Observable<any> {
        return this.api.post<any>('admin/seed-demo', {});
    }

    clearAllData(): Observable<any> {
        return this.api.delete<any>('admin/clear-all');
    }
}
