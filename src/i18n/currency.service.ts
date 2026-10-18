import { HttpClient } from '@angular/common/http';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import { API_PUBLIC_BASE_URL } from '../services/api.config';
import { LanguageService } from './language.service';

export const BASE_CURRENCY = 'MAD';
export const CURRENCIES = ['MAD', 'EUR', 'USD', 'GBP', 'TND'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

const STORAGE_KEY = 'reza_currency';

interface ExchangeRatesResponse {
  base: string;
  rates: Record<string, number>;
  updatedAt: string | null;
}

/**
 * Display-only currency conversion. Every amount coming from the API is in MAD; the viewer's
 * chosen currency is applied at render time. Falls back to MAD until/unless rates are known.
 */
@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(LanguageService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly currencies = CURRENCIES;
  private readonly selected = signal<CurrencyCode>(this.readStored());
  private readonly rates = signal<Record<string, number>>({ [BASE_CURRENCY]: 1 });

  /** Currency actually used for display: the selected one if a rate is known, otherwise MAD. */
  readonly currency = computed<CurrencyCode>(() =>
    this.rates()[this.selected()] ? this.selected() : BASE_CURRENCY,
  );
  readonly selectedCurrency = this.selected.asReadonly();

  constructor() {
    this.loadRates();
  }

  private loadRates(): void {
    if (!this.isBrowser) return;
    this.http.get<ExchangeRatesResponse>(`${API_PUBLIC_BASE_URL}/public/exchange-rates`).subscribe({
      next: (res) => this.rates.set({ ...(res?.rates ?? {}), [BASE_CURRENCY]: 1 }),
      error: () => {
        // keep whatever rates we already have
      },
    });
  }

  setCurrency(code: CurrencyCode): void {
    this.selected.set(code);
    // Rates may be missing (server had none yet, offline at load): retry instead of silently showing MAD.
    if (code !== BASE_CURRENCY && !this.rates()[code]) {
      this.loadRates();
    }
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // storage unavailable (private mode etc.) — selection still applies for this page
    }
  }

  convert(amountInBase: number): number {
    return amountInBase * (this.rates()[this.currency()] ?? 1);
  }

  /** Formats a MAD amount in the display currency, e.g. 120 → "11,04 €". */
  format(amountInBase: number | string | null | undefined): string {
    if (amountInBase === null || amountInBase === undefined || amountInBase === '') return '';
    const n = Number(amountInBase);
    if (!Number.isFinite(n)) return '';
    const code = this.currency();
    const value = this.convert(n);
    const fractionDigits = code === BASE_CURRENCY && Number.isInteger(value) ? 0 : 2;
    return new Intl.NumberFormat(this.i18n.locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  }

  private readStored(): CurrencyCode {
    if (!this.isBrowser) return BASE_CURRENCY;
    try {
      const v = this.document.defaultView?.localStorage.getItem(STORAGE_KEY) ?? '';
      return (CURRENCIES as readonly string[]).includes(v) ? (v as CurrencyCode) : BASE_CURRENCY;
    } catch {
      return BASE_CURRENCY;
    }
  }
}
