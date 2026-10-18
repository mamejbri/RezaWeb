import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ClientSessionService } from '../services/client-session.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const clientSessionService = inject(ClientSessionService);
  const router = inject(Router);

  // The token lives in localStorage, which the server (SSR and build-time prerender) can't see.
  // Redirecting there baked the login page into /profile's and /reservations' HTML, and the
  // browser then failed to hydrate the real page over it (blank page, avatar gone on refresh).
  // Render the page shell on the server and let the browser make the real decision.
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }

  if (clientSessionService.isAuthenticated()) {
    clientSessionService.ensureLoaded();
    return true;
  }

  return router.createUrlTree(['/auth'], {
    queryParams: { returnUrl: state.url }
  });
};
