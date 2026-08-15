import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthTokenService {
  private readonly storageKey = 'reza_token';
  private readonly tokenSignal = signal<string | null>(this.readStoredToken());

  constructor() {
    // Drop a token that already expired while the app was closed, before anything tries to use it.
    const token = this.tokenSignal();
    if (token && this.isExpired(token)) {
      this.clearToken();
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /** Returns the token, or null (clearing storage) if it's present but expired. Decodes the
   *  JWT's `exp` claim client-side only to detect staleness early — the server remains the
   *  source of truth and still rejects any token this check gets wrong. */
  getToken(): string | null {
    const token = this.tokenSignal();
    if (token && this.isExpired(token)) {
      this.clearToken();
      return null;
    }
    return token;
  }

  setToken(token: string): void {
    if (this.hasStorage()) {
      localStorage.setItem(this.storageKey, token);
    }

    this.tokenSignal.set(token);
  }

  clearToken(): void {
    if (this.hasStorage()) {
      localStorage.removeItem(this.storageKey);
    }

    this.tokenSignal.set(null);
  }

  private hasStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }

  private readStoredToken(): string | null {
    if (!this.hasStorage()) {
      return null;
    }

    return localStorage.getItem(this.storageKey);
  }

  private isExpired(token: string): boolean {
    const exp = this.decodeExp(token);
    return exp != null && Date.now() >= exp * 1000;
  }

  private decodeExp(token: string): number | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      );
      const payload = JSON.parse(json);
      return typeof payload?.exp === 'number' ? payload.exp : null;
    } catch {
      return null;
    }
  }
}
