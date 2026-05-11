import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthTokenService {
  private readonly storageKey = 'reza_token';
  private readonly tokenSignal = signal<string | null>(this.readStoredToken());

  isAuthenticated(): boolean {
    return !!this.tokenSignal();
  }

  getToken(): string | null {
    return this.tokenSignal();
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
}
