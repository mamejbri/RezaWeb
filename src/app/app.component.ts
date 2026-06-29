import { Component, HostListener, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs';

import { SiteFooterComponent } from './site-footer/site-footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SiteFooterComponent],
  template: `
    <router-outlet />
    <app-site-footer />

    @if (showScrollButton) {
      <button class="scroll-to-top" (click)="scrollToTop()" aria-label="Retour en haut">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    }
  `
})
export class AppComponent {
  private readonly title = inject(Title);
  private readonly router = inject(Router);

  showScrollButton = false;

  constructor() {
    this.title.setTitle('REZA');

    if (typeof document !== 'undefined') {
      this.updateFavicon('/assets/images/logo.png?v=1');
    }

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.showScrollButton = window.scrollY > 400;
    }
  }

  scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
