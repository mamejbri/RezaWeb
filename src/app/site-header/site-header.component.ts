import { Component, DestroyRef, ElementRef, HostListener, afterNextRender, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClientSessionService } from '../../services/client-session.service';
import { CurrencyCode, CurrencyService } from '../../i18n/currency.service';
import { LanguageService } from '../../i18n/language.service';
import { Lang } from '../../i18n/languages';
import { TranslatePipe } from '../../i18n/translate.pipe';

type Menu = 'locale' | 'account' | null;

/** The one site header, mounted once in AppComponent above the router outlet. */
@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <header class="header" [class.header--scrolled]="scrolled">
      <div class="header__inner">
        <a class="brand" routerLink="/" [attr.aria-label]="'nav.home' | t" (click)="close()">
          <img class="brand__logo" src="assets/images/logo.png" alt="Reza" />
        </a>

        <nav class="nav" [attr.aria-label]="'nav.main' | t">
          @for (item of navItems; track item.type) {
            <a class="nav__link" routerLink="/etablissementrecherche" [queryParams]="{ type: item.type }"
              routerLinkActive="nav__link--active" [routerLinkActiveOptions]="activeOptions" (click)="close()">
              {{ item.label | t }}
            </a>
          }
        </nav>

        <div class="actions">
          <!-- Language + currency -->
          <div class="dropdown">
            <button type="button" class="chip" [class.chip--open]="menu === 'locale'" (click)="toggle('locale')"
              [attr.aria-expanded]="menu === 'locale'" [attr.aria-label]="'locale.language' | t">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19M12 2.5c2.6 2.8 3.9 6 3.9 9.5s-1.3 6.7-3.9 9.5c-2.6-2.8-3.9-6-3.9-9.5s1.3-6.7 3.9-9.5Z" />
              </svg>
              <span>{{ i18n.lang.toUpperCase() }} · {{ currency.selectedCurrency() }}</span>
              <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>

            @if (menu === 'locale') {
              <div class="panel panel--locale" role="dialog">
                <p class="panel__label">{{ 'locale.language' | t }}</p>
                <div class="panel__grid">
                  @for (l of i18n.languages; track l.code) {
                    <button type="button" class="option" [class.option--active]="l.code === i18n.lang" (click)="setLang(l.code)">
                      {{ l.label }}
                    </button>
                  }
                </div>
                <p class="panel__label">{{ 'locale.currency' | t }}</p>
                <div class="panel__row">
                  @for (c of currency.currencies; track c) {
                    <button type="button" class="pill" [class.pill--active]="c === currency.selectedCurrency()" (click)="setCurrency(c)">
                      {{ c }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>

          @if (session.isAuthenticated()) {
            <!-- Account -->
            <div class="dropdown">
              <button type="button" class="account" [class.chip--open]="menu === 'account'" (click)="toggle('account')"
                [attr.aria-expanded]="menu === 'account'" [attr.aria-label]="'nav.myAccount' | t">
                <span class="avatar" [style.background-image]="session.avatarStyle()"></span>
                <span class="account__name">{{ firstName }}</span>
                <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>

              @if (menu === 'account') {
                <div class="panel panel--account" role="menu">
                  <div class="panel__user">
                    <span class="avatar avatar--lg" [style.background-image]="session.avatarStyle()"></span>
                    <div class="panel__user-text">
                      <strong>{{ fullName || ('account.title' | t) }}</strong>
                      @if (session.profile()?.email; as email) {
                        <span>{{ email }}</span>
                      }
                    </div>
                  </div>
                  <a class="menu-item" routerLink="/reservations" (click)="close()" role="menuitem">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
                    {{ 'account.myReza' | t }}
                  </a>
                  <a class="menu-item" routerLink="/profile" (click)="close()" role="menuitem">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8.5" r="4" /><path d="M4.5 20.5c1.3-3.6 4.1-5.5 7.5-5.5s6.2 1.9 7.5 5.5" /></svg>
                    {{ 'account.myInfo' | t }}
                  </a>
                  <div class="panel__divider"></div>
                  <button type="button" class="menu-item menu-item--danger" (click)="logout()" role="menuitem">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 4.5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3M10 16.5 14.5 12 10 7.5M14.5 12H4" /></svg>
                    {{ 'account.logout' | t }}
                  </button>
                </div>
              }
            </div>
          } @else {
            <a class="link-pro" href="https://pro.booktareza.com/login">{{ 'nav.iAmPro' | t }}</a>
            <a class="btn-login" routerLink="/auth" (click)="close()">{{ 'nav.login' | t }}</a>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host {
      --red: #c53334;
      --red-soft: #fbecec;
      --ink: #111111;
      --muted: #667085;
      --line: rgba(17, 17, 17, 0.08);
      display: block;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .header {
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: saturate(180%) blur(14px);
      -webkit-backdrop-filter: saturate(180%) blur(14px);
      border-bottom: 1px solid var(--line);
      transition: box-shadow 200ms ease, background 200ms ease;
    }

    .header--scrolled {
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 8px 24px rgba(17, 17, 17, 0.06);
    }

    .header__inner {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 24px;
      width: min(1440px, 100%);
      height: 72px;
      margin: 0 auto;
      padding: 0 24px;
      box-sizing: border-box;
    }

    .brand { justify-self: start; display: inline-flex; }
    .brand__logo { display: block; height: 40px; width: auto; }

    /* Center navigation: soft pills, active one tinted red */
    .nav {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      border-radius: 999px;
      background: #f4f4f2;
    }

    .nav__link {
      padding: 9px 18px;
      border-radius: 999px;
      color: #344054;
      font-size: 0.93rem;
      font-weight: 600;
      text-decoration: none;
      white-space: nowrap;
      transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease;
    }

    .nav__link:hover { color: var(--ink); background: rgba(255, 255, 255, 0.7); }

    .nav__link--active,
    .nav__link--active:hover {
      color: var(--red);
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(17, 17, 17, 0.08);
    }

    .actions {
      justify-self: end;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .dropdown { position: relative; }

    button { font: inherit; cursor: pointer; }

    .chip,
    .account {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: #ffffff;
      color: var(--ink);
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      white-space: nowrap;
      transition: border-color 160ms ease, box-shadow 160ms ease;
    }

    .account { padding: 0 12px 0 4px; }

    .chip:hover,
    .account:hover,
    .chip--open {
      border-color: rgba(17, 17, 17, 0.18);
      box-shadow: 0 2px 8px rgba(17, 17, 17, 0.06);
    }

    .chevron { color: var(--muted); transition: transform 180ms ease; }
    .chip--open .chevron { transform: rotate(180deg); }

    .avatar {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      border-radius: 50%;
      background-color: #ece7e7;
      background-position: center;
      background-size: cover;
      box-shadow: 0 0 0 2px #ffffff, 0 0 0 3px rgba(197, 51, 52, 0.35);
    }

    .avatar--lg { width: 44px; height: 44px; }

    .account__name {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .link-pro {
      padding: 0 8px;
      color: #344054;
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      white-space: nowrap;
    }

    .link-pro:hover { color: var(--red); }

    .btn-login {
      display: inline-flex;
      align-items: center;
      height: 40px;
      padding: 0 20px;
      border-radius: 999px;
      background: var(--red);
      color: #ffffff;
      font-size: 0.9rem;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
      box-shadow: 0 6px 16px rgba(197, 51, 52, 0.25);
      transition: transform 160ms ease, box-shadow 160ms ease;
    }

    .btn-login:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(197, 51, 52, 0.3); }

    /* Dropdown panels */
    .panel {
      position: absolute;
      top: calc(100% + 10px);
      inset-inline-end: 0;
      z-index: 60;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: #ffffff;
      box-shadow: 0 18px 40px rgba(17, 17, 17, 0.14);
      animation: panel-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
      transform-origin: top right;
    }

    @keyframes panel-in {
      from { opacity: 0; transform: translateY(-6px) scale(0.98); }
      to { opacity: 1; transform: none; }
    }

    .panel--locale { width: 320px; }
    .panel--account { width: 260px; padding: 8px; }

    .panel__label {
      margin: 4px 4px 8px;
      color: var(--muted);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .panel__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      margin-bottom: 12px;
    }

    .option {
      padding: 8px 10px;
      border: 0;
      border-radius: 10px;
      background: transparent;
      color: var(--ink);
      font-size: 0.86rem;
      text-align: start;
    }

    .option:hover { background: #f4f4f2; }
    .option--active, .option--active:hover { background: var(--red-soft); color: var(--red); font-weight: 700; }

    .panel__row { display: flex; flex-wrap: wrap; gap: 6px; }

    .pill {
      padding: 6px 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: #ffffff;
      color: var(--ink);
      font-size: 0.82rem;
      font-weight: 600;
    }

    .pill:hover { border-color: rgba(17, 17, 17, 0.2); }
    .pill--active, .pill--active:hover { border-color: var(--red); background: var(--red); color: #ffffff; }

    .panel__user {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 10px 12px;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--line);
    }

    .panel__user-text { display: grid; min-width: 0; }
    .panel__user-text strong { color: var(--ink); font-size: 0.92rem; }
    .panel__user-text span {
      overflow: hidden;
      color: var(--muted);
      font-size: 0.8rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px;
      border: 0;
      border-radius: 10px;
      background: transparent;
      color: var(--ink);
      font-size: 0.9rem;
      font-weight: 500;
      text-align: start;
      text-decoration: none;
      box-sizing: border-box;
    }

    .menu-item svg { color: var(--muted); }
    .menu-item:hover { background: #f4f4f2; }
    .menu-item--danger, .menu-item--danger svg { color: var(--red); }
    .menu-item--danger:hover { background: var(--red-soft); }

    .panel__divider { height: 1px; margin: 4px 0; background: var(--line); }

    /* Tablet: navigation moves to its own scrollable row under the bar */
    @media (max-width: 960px) {
      .header__inner {
        grid-template-columns: auto 1fr;
        grid-template-areas: 'brand actions' 'nav nav';
        height: auto;
        row-gap: 10px;
        padding: 12px 16px;
      }
      .brand { grid-area: brand; }
      .actions { grid-area: actions; }
      .nav {
        grid-area: nav;
        justify-self: stretch;
        justify-content: center;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .nav::-webkit-scrollbar { display: none; }
    }

    @media (max-width: 560px) {
      .brand__logo { height: 32px; }
      .link-pro, .account__name { display: none; }
      .header__inner { column-gap: 12px; }
      .actions { gap: 8px; }
      .chip { padding: 0 10px; gap: 6px; }
      .btn-login { padding: 0 14px; font-size: 0.85rem; }
      .nav { justify-content: flex-start; }
      .nav__link { padding: 8px 14px; font-size: 0.86rem; }
      .panel--locale { width: min(320px, calc(100vw - 32px)); }
    }
  `],
})
export class SiteHeaderComponent {
  readonly i18n = inject(LanguageService);
  readonly currency = inject(CurrencyService);
  readonly session = inject(ClientSessionService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly navItems = [
    { type: 'restaurant', label: 'nav.restaurant' },
    { type: 'soin', label: 'nav.beauty' },
    { type: 'activite', label: 'nav.activity' },
  ];

  readonly activeOptions = {
    paths: 'exact',
    queryParams: 'exact',
    matrixParams: 'ignored',
    fragment: 'ignored',
  } as const;

  menu: Menu = null;
  scrolled = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    // Publish the real header height (it grows when the nav wraps on tablets/phones) as
    // --site-header-h, so full-screen pages like home can size themselves to what's left.
    afterNextRender(() => {
      const root = document.documentElement;
      const el = this.host.nativeElement as HTMLElement;
      const update = () => root.style.setProperty('--site-header-h', `${el.offsetHeight}px`);
      update();
      const observer = new ResizeObserver(update);
      observer.observe(el);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  get firstName(): string {
    return this.session.profile()?.firstName ?? '';
  }

  get fullName(): string {
    const p = this.session.profile();
    return [p?.firstName, p?.lastName].filter(Boolean).join(' ');
  }

  toggle(menu: Exclude<Menu, null>): void {
    this.menu = this.menu === menu ? null : menu;
  }

  close(): void {
    this.menu = null;
  }

  setLang(lang: Lang): void {
    this.close();
    this.i18n.setLanguage(lang);
  }

  setCurrency(code: CurrencyCode): void {
    this.currency.setCurrency(code);
    this.close();
  }

  logout(): void {
    this.close();
    this.authService.logout();
    void this.router.navigateByUrl('/');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menu && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = typeof window !== 'undefined' && window.scrollY > 4;
  }
}
