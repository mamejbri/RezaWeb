import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClientSessionService } from '../../services/client-session.service';

import { LanguageService } from '../../i18n/language.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';
@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, AuthShellComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(LanguageService);
  private readonly clientSessionService = inject(ClientSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loading = false;
  errorMessage = '';
  showPassword = false;
  /** submit was attempted: empty fields get flagged */
  tried = false;

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }

  login(): void {
    if (this.loading) return;
    this.tried = true;
    if (!this.email.trim() || !this.password.trim()) {
      this.errorMessage = this.i18n.t('authUi.fillAll');
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.loginClient({
      email: this.email.trim(),
      password: this.password
    }).subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigateByUrl(this.returnUrl);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = this.i18n.t('auth.invalidCredentials');
      }
    });
  }

  private get returnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');

    if (!value || !value.startsWith('/') || value.startsWith('//')) {
      return '/reservations';
    }

    return value;
  }
}
