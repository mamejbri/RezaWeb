import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { API_BASE_URL } from './api.config';
import { AuthTokenService } from './auth-token.service';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authTokenService = inject(AuthTokenService);
  // AuthService is resolved lazily, only when a 401 needs a logout: injecting it here creates a
  // DI cycle (ClientSessionService -> getMe() -> this interceptor -> AuthService -> ClientSessionService)
  // whenever the session service loads the profile while being constructed, i.e. on every page
  // refresh with a stored token (NG0200: the avatar vanished and /profile rendered blank).
  const injector = inject(Injector);
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
        injector.get(AuthService).logout();
      }
      return throwError(() => err);
    })
  );
};
