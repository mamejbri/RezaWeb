import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { API_BASE_URL } from './api.config';
import { AuthTokenService } from './auth-token.service';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authTokenService = inject(AuthTokenService);
  const authService = inject(AuthService);
  const token = authTokenService.getToken();
  const isApiRequest = request.url.startsWith(API_BASE_URL);

  const outgoing = token && isApiRequest
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(outgoing).pipe(
    catchError((err: unknown) => {
      // Only a request that actually carried our token can mean "the session died" — a 401
      // on a public/anonymous call is normal and shouldn't touch the (already logged-out) state.
      if (isApiRequest && token && err instanceof HttpErrorResponse && err.status === 401) {
        authService.logout();
      }
      return throwError(() => err);
    })
  );
};
