import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, InjectionToken, PLATFORM_ID, inject } from '@angular/core';

import { DEFAULT_LANG, LANGUAGES, LANG_COOKIE, Lang, isLang, languageInfo, readCookie } from './languages';
import { Translations, TRANSLATIONS } from './translations';

/** Provided by server.ts with the language read from the request cookie. */
export const SSR_LANG = new InjectionToken<Lang>('SSR_LANG');

/**
 * The language is fixed for the lifetime of a page: switching stores the choice in a cookie
 * (readable by SSR) and reloads, so LOCALE_ID, date pipes and `t` stay pure and consistent.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly ssrLang = inject(SSR_LANG, { optional: true });

  readonly languages = LANGUAGES;
  readonly lang: Lang = this.resolveInitialLang();
  readonly info = languageInfo(this.lang);
  private readonly dict: Translations = TRANSLATIONS[this.lang];

  constructor() {
    const html = this.document.documentElement;
    html.setAttribute('lang', this.lang);
    html.setAttribute('dir', this.info.dir);
  }

  get locale(): string {
    return this.info.locale;
  }

  /** Looks up a dotted key ("auth.login"); falls back to French, then to the key itself. */
  t(key: string, params?: Record<string, unknown>): string {
    const raw = lookup(this.dict, key) ?? lookup(TRANSLATIONS[DEFAULT_LANG], key) ?? key;
    if (!params) return raw;
    return raw.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => String(params[name] ?? ''));
  }

  setLanguage(lang: Lang): void {
    if (!this.isBrowser || lang === this.lang) return;
    this.document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    this.document.defaultView?.location.reload();
  }

  private resolveInitialLang(): Lang {
    if (this.ssrLang) return this.ssrLang;
    const fromCookie = readCookie(this.isBrowser ? this.document.cookie : null, LANG_COOKIE);
    return isLang(fromCookie) ? fromCookie : DEFAULT_LANG;
  }
}

function lookup(dict: unknown, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}
