import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_BASE_URL, API_PUBLIC_BASE_URL } from '../services/api.config';
import { LanguageService } from './language.service';

/** Header read by the backend to translate database content (Google Cloud Translation). */
export const CONTENT_LANG_HEADER = 'X-Lang';

function isApiRequest(url: string): boolean {
  return url.startsWith(API_BASE_URL) || url.startsWith(API_PUBLIC_BASE_URL) || url.includes('/api/reza/');
}

/**
 * Asks the API for prestations, descriptions, reviews... in the UI language. Works during SSR
 * too: the language then comes from the request cookie (SSR_LANG).
 */
export const contentLanguageInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url) || req.headers.has(CONTENT_LANG_HEADER)) {
    return next(req);
  }
  const lang = inject(LanguageService).lang;
  return next(req.clone({ setHeaders: { [CONTENT_LANG_HEADER]: lang } }));
};
