import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'reza_client.theme';

/**
 * Light / dark mode for the client site (switch in the header and on the sign-in pages). The
 * choice is remembered per browser; without one the system setting is used. index.html applies
 * it before first paint (no flash); this service keeps it in sync afterwards.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly theme = signal<Theme>(this.initial());

  constructor() {
    if (!this.isBrowser) return;
    this.apply();
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', (e) => {
      if (!this.stored()) this.set(e.matches ? 'dark' : 'light', false);
    });
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme, remember = true): void {
    this.theme.set(theme);
    this.apply();
    if (remember && this.isBrowser) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        /* private mode: applied for this visit only */
      }
    }
  }

  private apply(): void {
    if (!this.isBrowser) return;
    const dark = this.theme() === 'dark';
    const html = this.document.documentElement;
    html.classList.toggle('app-dark', dark);
    html.style.colorScheme = dark ? 'dark' : '';
  }

  private stored(): Theme | null {
    if (!this.isBrowser) return null;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'dark' || v === 'light' ? v : null;
    } catch {
      return null;
    }
  }

  private initial(): Theme {
    if (!this.isBrowser) return 'light';
    return this.stored() ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
}
