import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const auth = inject(AuthService);

    return next(req).pipe(
        catchError(err => {
            if (err.status === 401) {
                auth.logout();
                router.navigate(['/auth/login']);
            } else if (err.status === 403) {
                // BUG-015 FIX: 403 Forbidden handle karo — unauthorized page pe bhejo
                router.navigate(['/unauthorized']);
            }
            const message = err.error?.message ?? err.message ?? 'An unexpected error occurred';
            return throwError(() => new Error(message));
        })
    );
};
