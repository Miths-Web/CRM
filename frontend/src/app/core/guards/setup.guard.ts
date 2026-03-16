import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * setupGuard — Yeh guard INITIAL-SETUP page ko protect karta hai.
 *
 * Kaam kaise karta hai:
 * - /setup route par jaane se pehle backend se check karta hai ki koi user hai ya nahi.
 * - Agar DB mein pehle se user hai → /auth/login par redirect karo (setup dobara nahi hoga)
 * - Agar koi user nahi → setup page allow karo
 */
export const setupGuard: CanActivateFn = () => {
    const http = inject(HttpClient);
    const router = inject(Router);

    return http.get<{ isSetupDone: boolean }>(`${environment.apiUrl}/auth/is-setup`).pipe(
        map(response => {
            if (response.isSetupDone) {
                // Setup already ho chuka hai, login page par bhejo
                router.navigate(['/auth/login']);
                return false;
            }
            // Koi user nahi — setup page allow karo
            return true;
        }),
        catchError(() => {
            // Backend unreachable ho toh setup page dikhao
            return of(true);
        })
    );
};

/**
 * redirectToSetupIfNeeded — Yeh guard EVERY public/login page par lagega.
 *
 * Kaam kaise karta hai:
 * - Agar DB mein koi user nahi hai → seedha /setup page par redirect karo
 * - Agar user hai → normal flow allow karo
 */
export const redirectToSetupIfNeeded: CanActivateFn = () => {
    const http = inject(HttpClient);
    const router = inject(Router);

    return http.get<{ isSetupDone: boolean }>(`${environment.apiUrl}/auth/is-setup`).pipe(
        map(response => {
            if (!response.isSetupDone) {
                // Koi user nahi — setup page par bhejo
                router.navigate(['/setup']);
                return false;
            }
            return true;
        }),
        catchError(() => {
            // Error aaye toh normal flow allow karo
            return of(true);
        })
    );
};
