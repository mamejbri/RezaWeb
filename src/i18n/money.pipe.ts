import { Pipe, PipeTransform, inject } from '@angular/core';

import { CurrencyService } from './currency.service';

/** `{{ prestation.prixFixe | money }}` — input is always MAD, output is in the viewer's currency. */
@Pipe({ name: 'money', standalone: true, pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly currency = inject(CurrencyService);

  transform(amountInMad: number | string | null | undefined): string {
    return this.currency.format(amountInMad);
  }
}
