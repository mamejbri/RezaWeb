import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LocaleSwitcherComponent } from '../../i18n/locale-switcher.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

/**
 * Full-screen layout of the client sign-in / sign-up / password pages: a photo panel that shows
 * what can be booked (restaurants, beauty, activities — slow cross-fade), and the form side with
 * home link, language / currency and the light / dark switch.
 */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterLink, TranslatePipe, LocaleSwitcherComponent, ThemeToggleComponent],
  template: `
    <div class="shell">
      <aside class="visual" aria-hidden="true">
        <img class="slide s1" src="/assets/images/auth-restaurant.jpg" alt="" />
        <img class="slide s2" src="/assets/images/auth-soin.jpg" alt="" />
        <img class="slide s3" src="/assets/images/auth-activites.jpg" alt="" />
        <div class="shade"></div>

        <a class="v-logo" routerLink="/" tabindex="-1"><img src="/assets/images/logo-dark.png" alt="" /></a>

        <div class="v-copy">
          <div class="chips">
            <span class="chip c1">{{ 'authUi.catRestaurant' | t }}</span>
            <span class="chip c2">{{ 'authUi.catBeauty' | t }}</span>
            <span class="chip c3">{{ 'authUi.catActivity' | t }}</span>
          </div>
          <h2>{{ 'authUi.brandTitle' | t }}</h2>
          <p>{{ 'authUi.brandCopy' | t }}</p>
          <ul>
            <li>
              <span class="ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              </span>
              {{ 'authUi.perk1' | t }}
            </li>
            <li>
              <span class="ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </span>
              {{ 'authUi.perk2' | t }}
            </li>
            <li>
              <span class="ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </span>
              {{ 'authUi.perk3' | t }}
            </li>
          </ul>
        </div>
      </aside>

      <main class="side">
        <div class="topbar">
          <a class="home" routerLink="/">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>{{ 'authUi.backHome' | t }}</span>
          </a>
          <div class="tools">
            <app-locale-switcher />
            <app-theme-toggle />
          </div>
        </div>

        <div class="content" [class.wide]="wide">
          <a class="m-logo" routerLink="/">
            <img class="light-only" src="/assets/images/logo.png" alt="REZA" />
            <img class="dark-only" src="/assets/images/logo-dark.png" alt="" aria-hidden="true" />
          </a>
          <ng-content />
        </div>
      </main>
    </div>
  `,
  styles: `
    :host { display: block; min-height: 100vh; background: var(--c-bg); color: var(--c-text); transition: background-color .25s ease; }
    .shell { display: grid; grid-template-columns: minmax(400px, 46%) 1fr; min-height: 100vh; }

    /* ---------- photo panel ---------- */
    .visual { position: sticky; top: 0; height: 100vh; overflow: hidden; background: #120f0e; isolation: isolate; color: #fff; }
    .slide {
      position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; z-index: -2;
      animation: slide 18s infinite; will-change: opacity, transform;
    }
    /* the first photo starts already faded in (no black panel on load) */
    .s1 { animation-delay: -0.9s; }
    .s2 { animation-delay: 6s; }
    .s3 { animation-delay: 12s; }
    @keyframes slide {
      0% { opacity: 0; transform: scale(1.08); }
      5% { opacity: 1; }
      33% { opacity: 1; }
      39% { opacity: 0; transform: scale(1); }
      100% { opacity: 0; transform: scale(1); }
    }
    .shade {
      position: absolute; inset: 0; z-index: -1;
      background:
        linear-gradient(180deg, rgba(10, 8, 7, 0.55) 0%, rgba(10, 8, 7, 0.1) 30%, rgba(10, 8, 7, 0.35) 55%, rgba(10, 8, 7, 0.92) 100%),
        radial-gradient(120% 60% at 0% 100%, rgba(207, 50, 50, 0.35), transparent 60%);
    }
    .v-logo { position: absolute; top: 34px; inset-inline-start: 40px; display: inline-block; }
    .v-logo img { height: 46px; display: block; }
    .v-copy { position: absolute; inset-inline: 40px; bottom: 44px; max-width: 520px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
    .chip {
      padding: 6px 12px; border-radius: 999px; font-size: 12.5px; font-weight: 600;
      color: rgba(255, 255, 255, 0.82); background: rgba(255, 255, 255, 0.1);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18); backdrop-filter: blur(8px);
      animation: chip 18s infinite;
    }
    .c1 { animation-delay: -0.9s; }
    .c2 { animation-delay: 6s; }
    .c3 { animation-delay: 12s; }
    @keyframes chip {
      0%, 34%, 100% { background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.82); }
      4%, 30% { background: #cf3232; color: #fff; box-shadow: inset 0 0 0 1px #cf3232; }
    }
    .v-copy h2 { margin: 0 0 12px; font-size: clamp(28px, 2.7vw, 40px); line-height: 1.1; font-weight: 800; letter-spacing: -0.02em; text-wrap: balance; }
    .v-copy p { margin: 0 0 22px; font-size: 15.5px; line-height: 1.6; color: rgba(255, 255, 255, 0.78); max-width: 460px; }
    .v-copy ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
    .v-copy li { display: flex; align-items: center; gap: 12px; font-size: 14.5px; font-weight: 500; color: rgba(255, 255, 255, 0.92); }
    .v-copy .ico {
      flex-shrink: 0; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 11px;
      background: rgba(255, 255, 255, 0.12); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16); backdrop-filter: blur(8px);
    }
    .v-copy .ico svg { width: 17px; height: 17px; }

    /* ---------- form side ---------- */
    .side { display: flex; flex-direction: column; min-width: 0; padding: 22px 32px 44px; }
    .topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; }
    .home {
      display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 14px 0 10px; border-radius: 999px;
      font-size: 13.5px; font-weight: 600; color: var(--c-text-2); text-decoration: none;
      background: var(--c-card); box-shadow: 0 0 0 1px var(--c-line);
    }
    .home:hover { color: var(--c-text); }
    .home svg { width: 16px; height: 16px; }
    :host-context([dir='rtl']) .home svg { transform: scaleX(-1); }
    .tools { display: flex; align-items: center; gap: 10px; }
    :host .tools ::ng-deep .locale-switcher__select {
      height: 38px; border-radius: 12px; font-weight: 600;
      background: var(--c-card); color: var(--c-text); border-color: var(--c-line-strong);
    }

    .content {
      flex: 1; width: 100%; max-width: 440px; margin: 0 auto; padding-top: 7vh;
      display: flex; flex-direction: column;
      animation: rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .content.wide { max-width: 540px; }
    @keyframes rise { from { opacity: 0; transform: translateY(10px); } }
    .m-logo { display: none; margin: 0 auto 22px; }
    .m-logo img { height: 44px; display: block; }
    .dark-only { display: none !important; }
    :host-context(html.app-dark) .dark-only { display: block !important; }
    :host-context(html.app-dark) .light-only { display: none !important; }

    @media (max-width: 1023px) {
      .shell { grid-template-columns: 1fr; }
      .visual { display: none; }
      .m-logo { display: block; }
      .content { padding-top: 3vh; }
    }
    @media (max-width: 560px) {
      .side { padding: 14px 16px 32px; }
      .home { width: 38px; padding: 0; justify-content: center; }
      .home span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
          }
    @media (prefers-reduced-motion: reduce) {
      .slide { animation: none; }
      .s1 { opacity: 1; }
      .chip { animation: none; }
      .content { animation: none; }
    }
  `,
})
export class AuthShellComponent {
  /** wider form column (sign-up) */
  @Input() wide = false;
}
