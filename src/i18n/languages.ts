export type Lang = 'fr' | 'en' | 'ar' | 'es' | 'pt' | 'de' | 'tr' | 'id' | 'zh' | 'ja' | 'hi' | 'ru';

export interface LanguageInfo {
  code: Lang;
  label: string;
  dir: 'ltr' | 'rtl';
  /** Angular LOCALE_ID and Intl locale (ar-MA keeps Latin digits; Angular's 'pt' is Brazilian). */
  locale: string;
}

export const LANGUAGES: readonly LanguageInfo[] = [
  { code: 'fr', label: 'Français', dir: 'ltr', locale: 'fr' },
  { code: 'en', label: 'English', dir: 'ltr', locale: 'en' },
  { code: 'ar', label: 'العربية', dir: 'rtl', locale: 'ar-MA' },
  { code: 'es', label: 'Español', dir: 'ltr', locale: 'es' },
  { code: 'pt', label: 'Português (Brasil)', dir: 'ltr', locale: 'pt' },
  { code: 'de', label: 'Deutsch', dir: 'ltr', locale: 'de' },
  { code: 'tr', label: 'Türkçe', dir: 'ltr', locale: 'tr' },
  { code: 'id', label: 'Bahasa Indonesia', dir: 'ltr', locale: 'id' },
  { code: 'zh', label: '简体中文', dir: 'ltr', locale: 'zh-Hans' },
  { code: 'ja', label: '日本語', dir: 'ltr', locale: 'ja' },
  { code: 'hi', label: 'हिन्दी', dir: 'ltr', locale: 'hi' },
  { code: 'ru', label: 'Русский', dir: 'ltr', locale: 'ru' },
];

export const DEFAULT_LANG: Lang = 'fr';
export const LANG_COOKIE = 'reza_lang';

export function isLang(value: unknown): value is Lang {
  return LANGUAGES.some((l) => l.code === value);
}

export function languageInfo(lang: Lang): LanguageInfo {
  return LANGUAGES.find((l) => l.code === lang)!;
}

export function readCookie(cookieHeader: string | undefined | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}
