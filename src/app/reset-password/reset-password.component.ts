import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClientSessionService } from '../../services/client-session.service';

import { LanguageService } from '../../i18n/language.service';
import { LocaleSwitcherComponent } from '../../i18n/locale-switcher.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, TranslatePipe, LocaleSwitcherComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(LanguageService);
  private readonly clientSessionService = inject(ClientSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token = this.route.snapshot.queryParamMap.get('token') ?? this.route.snapshot.paramMap.get('token') ?? '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }

  resetPassword(): void {
    const token = this.token.trim();
    const newPassword = this.newPassword.trim();

    if (this.loading) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (!token) {
      this.errorMessage = this.i18n.t('reset.invalidLink');
      return;
    }

    if (newPassword.length < 8) {
      this.errorMessage = this.i18n.t('reset.tooShort');
      return;
    }

    if (newPassword !== this.confirmPassword.trim()) {
      this.errorMessage = this.i18n.t('reset.mismatch');
      return;
    }

    this.loading = true;

    this.authService.resetPassword({ token, newPassword }).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.i18n.t('reset.success');
        setTimeout(() => void this.router.navigateByUrl('/auth'), 1200);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = this.i18n.t('reset.error');
      }
    });
  }
}
