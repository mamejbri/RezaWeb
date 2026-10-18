import { Component, inject } from '@angular/core';

import { CurrencyCode, CurrencyService } from './currency.service';
import { LanguageService } from './language.service';
import { Lang } from './languages';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-locale-switcher',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <select class="locale-switcher__select" [attr.aria-label]="'locale.language' | t"
      (change)="setLang($any($event.target).value)">
      @for (l of i18n.languages; track l.code) {
        <option [value]="l.code" [selected]="l.code === i18n.lang">{{ l.label }}</option>
      }
    </select>
    <select class="locale-switcher__select" [attr.aria-label]="'locale.currency' | t"
      (change)="setCurrency($any($event.target).value)">
      @for (c of currency.currencies; track c) {
        <option [value]="c" [selected]="c === currency.selectedCurrency()">{{ c }}</option>
      }
    </select>
  `,
  styles: [`
    :host { display: inline-flex; gap: 6px; align-items: center; flex-shrink: 0; }
    .locale-switcher__select {
      height: 34px;
      padding: 0 8px;
      border: 1px solid #d0d5dd;
      border-radius: 8px;
      background: #fff;
      color: #101828;
      font: inherit;
      font-size: 0.85rem;
      cursor: pointer;
    }
  `],
})
export class LocaleSwitcherComponent {
  readonly i18n = inject(LanguageService);
  readonly currency = inject(CurrencyService);

  setLang(lang: Lang): void {
    this.i18n.setLanguage(lang);
  }

  setCurrency(code: CurrencyCode): void {
    this.currency.setCurrency(code);
  }
}
