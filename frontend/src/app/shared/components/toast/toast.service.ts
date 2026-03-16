import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;   // ms — default 4000, 0 = sticky
    dismissible?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    /** Reactive list of active toasts */
    toasts = signal<Toast[]>([]);

    private idCounter = 0;

    // ── Public API ────────────────────────────────────────────────

    success(title: string, message?: string, duration = 4000): void {
        this.add({ type: 'success', title, message, duration });
    }

    error(title: string, message?: string, duration = 6000): void {
        this.add({ type: 'error', title, message, duration });
    }

    warning(title: string, message?: string, duration = 5000): void {
        this.add({ type: 'warning', title, message, duration });
    }

    info(title: string, message?: string, duration = 4000): void {
        this.add({ type: 'info', title, message, duration });
    }

    /** Manually remove a toast by ID */
    dismiss(id: string): void {
        this.toasts.update(list => list.filter(t => t.id !== id));
    }

    /** Remove all toasts */
    clear(): void {
        this.toasts.set([]);
    }

    // ── Internal ──────────────────────────────────────────────────

    private add(opts: Omit<Toast, 'id' | 'dismissible'>): void {
        const toast: Toast = {
            id: `toast-${++this.idCounter}-${Date.now()}`,
            dismissible: true,
            ...opts
        };

        this.toasts.update(list => [...list, toast]);

        // Auto-dismiss after duration (0 = sticky)
        if (toast.duration && toast.duration > 0) {
            setTimeout(() => this.dismiss(toast.id), toast.duration);
        }
    }
}
