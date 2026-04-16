import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, EMPTY } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const auth = inject(AuthService);
    const toast = inject(ToastService);

    return next(req).pipe(
        catchError(err => {
            // Let the login component handle its own 401/400 errors
            if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
                return throwError(() => err);
            }

            if (err.status === 401) {
                // Session expired — force logout
                toast.warning('Authentication', 'Session expired. Please log in again.');
                auth.logout();
                router.navigate(['/auth/login']);
                return EMPTY;
            }
            // 403: Do NOT redirect globally — let components handle with empty/graceful state.
            // Route-level access is already guarded by role.guard.ts.
            const message = err.error?.message ?? err.error?.title ?? err.message ?? 'An unexpected error occurred';
            if (err.status === 403) {
                toast.error('Access Denied', 'You do not have permission to perform this action.');
            } else if (err.status >= 500) {
                toast.error('Server Error', 'Server encountered an error. Please try again later.');
            } else if (err.status !== 404) {
                toast.error('Error', message);
            }
            
            return throwError(() => err); // Keep throwing the original error
        })
    );
};
