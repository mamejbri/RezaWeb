import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClientSessionService } from '../../services/client-session.service';

import { LanguageService } from '../../i18n/language.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, AuthShellComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(LanguageService);
  private readonly clientSessionService = inject(ClientSessionService);

  email = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }

  requestReset(): void {
    const email = this.email.trim();

    if (!email || this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword({ email }).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.i18n.t('forgot.success');
      },
      error: () => {
        this.loading = false;
        this.errorMessage = this.i18n.t('forgot.error');
      }
    });
  }
}
