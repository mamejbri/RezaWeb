import { Component } from '@angular/core';

import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <footer class="site-footer">
      <p class="site-footer__note">{{ 'footer.rights' | t }}</p>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
    }

    .site-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 72px;
      padding: 18px 20px;
      background: #f7f7f7;
      color: #101828;
    }

    .site-footer__note {
      margin: 0;
      text-align: center;
      font-size: 0.92rem;
      font-weight: 600;
      line-height: 1.4;
    }
  `]
})
export class SiteFooterComponent {}
