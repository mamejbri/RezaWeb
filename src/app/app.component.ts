import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { SiteFooterComponent } from './site-footer/site-footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SiteFooterComponent],
  template: '<router-outlet /><app-site-footer />'
})
export class AppComponent {
  private readonly title = inject(Title);

  constructor() {
    this.title.setTitle('REZA');

    if (typeof document !== 'undefined') {
      this.updateFavicon('/assets/images/logo.png?v=1');
    }
  }

  private updateFavicon(href: string): void {
    const relations = ['icon', 'shortcut icon', 'apple-touch-icon'];

    for (const rel of relations) {
      const link = this.ensureHeadLink(rel);
      link.href = href;
      if (rel !== 'apple-touch-icon') {
        link.type = 'image/png';
      }
    }
  }

  private ensureHeadLink(rel: string): HTMLLinkElement {
    const selector = `link[rel="${rel}"]`;
    const existing = document.head.querySelector(selector);

    if (existing instanceof HTMLLinkElement) {
      return existing;
    }

    const link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
    return link;
  }
}
