import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeArMa from '@angular/common/locales/ar-MA';
import localeEs from '@angular/common/locales/es';
import localePt from '@angular/common/locales/pt';
import localeDe from '@angular/common/locales/de';
import localeTr from '@angular/common/locales/tr';
import localeId from '@angular/common/locales/id';
import localeZhHans from '@angular/common/locales/zh-Hans';
import localeJa from '@angular/common/locales/ja';
import localeHi from '@angular/common/locales/hi';
import localeRu from '@angular/common/locales/ru';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { authInterceptor } from '../services/auth.interceptor';
import { LanguageService } from '../i18n/language.service';

registerLocaleData(localeFr);
registerLocaleData(localeArMa);
registerLocaleData(localeEs);
registerLocaleData(localePt);
registerLocaleData(localeDe);
registerLocaleData(localeTr);
registerLocaleData(localeId);
registerLocaleData(localeZhHans);
registerLocaleData(localeJa);
registerLocaleData(localeHi);
registerLocaleData(localeRu);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useFactory: (i18n: LanguageService) => i18n.locale, deps: [LanguageService] },
  ]
};
