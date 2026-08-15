import { Routes } from '@angular/router';

import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./auth/auth.component').then((m) => m.AuthComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      )
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      )
  },
  {
    path: 'reset-password/:token',
    loadComponent: () =>
      import('./reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      )
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'reservations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./reservations/reservations.component').then(
        (m) => m.ReservationsComponent
      )
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./profile/profile.component').then((m) => m.ProfileComponent)
  },
  {
    path: 'recherche',
    loadComponent: () =>
      import('./recherche/recherche.component').then((m) => m.RechercheComponent)
  },
  {
    path: 'etablissementrecherche',
    loadComponent: () =>
      import('./etablissementrecherche/etablissementrecherche.component').then(
        (m) => m.EtablissementrechercheComponent
      )
  },
  {
    path: 'reservation/:slug',
    loadComponent: () =>
      import('./reservation/reservation.component').then((m) => m.ReservationComponent)
  },
  {
    path: 'reservation',
    loadComponent: () =>
      import('./reservation/reservation.component').then((m) => m.ReservationComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
