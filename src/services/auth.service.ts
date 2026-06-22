import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from './api.config';
import { ClientSessionService } from './client-session.service';
import { AuthTokenService } from './auth-token.service';

type LoginRequest = {
  email: string;
  password: string;
};

type LoginClientResponse = {
  token: string;
  userId: number;
  email: string;
  clientId: number;
};

type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

type ForgotPasswordRequest = {
  email: string;
};

type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type RegistrationClientRequest = {
  email: string;
  password: string;
  phoneNumber: string;
  name: string;
  lastName: string;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly clientSessionService = inject(ClientSessionService);
  private readonly authTokenService = inject(AuthTokenService);

  registerClient(payload: RegistrationClientRequest): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/auth/register_client`, payload);
  }

  loginClient(payload: LoginRequest): Observable<LoginClientResponse> {
    return this.http
      .post<LoginClientResponse>(`${API_BASE_URL}/auth/login_client`, payload)
      .pipe(
        tap((response) => {
          this.authTokenService.setToken(response.token);
          this.clientSessionService.ensureLoaded(true);
        })
      );
  }

  changePassword(payload: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/auth/change-password`, payload);
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/auth/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/auth/reset-password`, payload);
  }

  logout(): void {
    this.authTokenService.clearToken();
    this.clientSessionService.clear();
  }
}
