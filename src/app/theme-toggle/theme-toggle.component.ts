import { Component, inject } from '@angular/core';

import { TranslatePipe } from '../../i18n/translate.pipe';
import { ThemeService } from '../../services/theme.service';

/** Sun / moon switch for light and dark mode (site header, sign-in pages). */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="theme"
      [class.is-dark]="theme.theme() === 'dark'"
      (click)="theme.toggle()"
      [attr.aria-label]="(theme.theme() === 'dark' ? 'authUi.themeLight' : 'authUi.themeDark') | t"
      [attr.title]="(theme.theme() === 'dark' ? 'authUi.themeLight' : 'authUi.themeDark') | t"
    >
      <span class="track">
        <span class="thumb">
          @if (theme.theme() === 'dark') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
          }
        </span>
      </span>
    </button>
  `,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; }
    .theme { border: 0; padding: 0; background: none; cursor: pointer; border-radius: 999px; }
    .track {
      position: relative; display: block; width: 62px; height: 34px; border-radius: 999px;
      background: var(--s-card); box-shadow: inset 0 0 0 1px var(--s-line-soft);
      transition: background-color 0.25s ease;
    }
    .theme:hover .track { box-shadow: inset 0 0 0 1px var(--s-ink-3); }
    .thumb {
      position: absolute; top: 4px; inset-inline-start: 4px; display: grid; place-items: center;
      width: 26px; height: 26px; border-radius: 50%; color: #fff;
      background: var(--c-brand-gradient); box-shadow: var(--c-shadow-brand);
      transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .thumb svg { width: 14px; height: 14px; }
    .is-dark .thumb { transform: translateX(28px); }
    :host-context([dir='rtl']) .is-dark .thumb { transform: translateX(-28px); }
    @media (max-width: 560px) {
      .track { width: 54px; height: 32px; }
      .thumb { width: 24px; height: 24px; }
      .is-dark .thumb { transform: translateX(22px); }
      :host-context([dir='rtl']) .is-dark .thumb { transform: translateX(-22px); }
    }
  `,
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
