import { Pipe, PipeTransform, inject } from '@angular/core';

import { LanguageService } from './language.service';

/** `{{ 'auth.login' | t }}` or `{{ 'booking.count' | t: { n: 3 } }}` */
@Pipe({ name: 't', standalone: true })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(LanguageService);

  transform(key: string, params?: Record<string, unknown>): string {
    return this.i18n.t(key, params);
  }
}
