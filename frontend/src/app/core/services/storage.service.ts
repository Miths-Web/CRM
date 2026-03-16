import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
    set(key: string, value: any): void {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
    }

    get<T>(key: string): T | null {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) as T : null;
        } catch { return null; }
    }

    remove(key: string): void { localStorage.removeItem(key); }

    clear(): void { localStorage.clear(); }

    getString(key: string): string | null { return localStorage.getItem(key); }

    setString(key: string, value: string): void { localStorage.setItem(key, value); }
}
