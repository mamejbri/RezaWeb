import { Component } from '@angular/core';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  template: `
    <footer class="site-footer">
      <p class="site-footer__note">&copy; 2026 Reza. Powered by AXYNEA Agency. All Rights Reserved.</p>
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
