import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // We now use HttpOnly cookies for JWT authentication.
    // Setting withCredentials: true ensures cookies are sent with all API requests.
    const cloned = req.clone({
        withCredentials: true
    });
    return next(cloned);
};

