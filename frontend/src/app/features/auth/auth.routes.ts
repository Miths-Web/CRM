import { Routes } from '@angular/router';
import { redirectToSetupIfNeeded } from '../../core/guards/setup.guard';

export const AUTH_ROUTES: Routes = [
    {
        path: 'login',
        canActivate: [redirectToSetupIfNeeded],
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        canActivate: [redirectToSetupIfNeeded],
        loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'forgot-password',
        canActivate: [redirectToSetupIfNeeded],
        loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];
