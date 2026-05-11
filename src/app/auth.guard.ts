import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ClientSessionService } from '../services/client-session.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const clientSessionService = inject(ClientSessionService);
  const router = inject(Router);

  if (clientSessionService.isAuthenticated()) {
    clientSessionService.ensureLoaded();
    return true;
  }

  return router.createUrlTree(['/auth'], {
    queryParams: { returnUrl: state.url }
  });
};
