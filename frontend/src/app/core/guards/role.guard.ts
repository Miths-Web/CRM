import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Usage in routes:
 *   canActivate: [authGuard, roleGuard(['Admin'])]
 *   canActivate: [authGuard, roleGuard(['Admin', 'Manager'])]
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
    return () => {
        const auth = inject(AuthService);
        const router = inject(Router);

        const user = auth.getCurrentUser();

        // Not logged in at all — redirect to login
        if (!user) {
            router.navigate(['/auth/login']);
            return false;
        }

        const userRoles = user.roles ?? [];

        // Check if user has at least one of the allowed roles
        const hasAccess = allowedRoles.some(role => userRoles.includes(role));

        if (!hasAccess) {
            // Unauthorized — redirect to a 403 page or dashboard with error
            router.navigate(['/unauthorized']);
            return false;
        }

        return true;
    };
};
