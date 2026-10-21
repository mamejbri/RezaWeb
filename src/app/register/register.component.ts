import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ClientSessionService } from '../../services/client-session.service';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';

import { LanguageService } from '../../i18n/language.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, AuthShellComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  private readonly clientSessionService = inject(ClientSessionService);
  private readonly i18n = inject(LanguageService);
  private readonly authService = inject(AuthService);
  private readonly seoService = inject(SeoService);

  nom = '';
  prenom = '';
  phoneNumber = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  cguChecked = false;

  loading = false;
  errorMessage = '';
  successMessage = '';
  /** account created: the page shows the welcome state */
  done = false;
  /** submit was attempted: missing fields get flagged */
  tried = false;

  get emailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }

  ngOnInit(): void {
    this.seoService.update({
      title: this.i18n.t('register.seoTitle'),
      description: this.i18n.t('register.seoDescription'),
      path: '/register'
    });
  }

  register(): void {
    if (this.loading) return;
    this.tried = true;

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.nom.trim() || !this.prenom.trim() || !this.phoneNumber.trim() || !this.email.trim() || !this.password.trim() || !this.confirmPassword.trim()) {
      this.errorMessage = this.i18n.t('register.errors.required');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = this.i18n.t('register.errors.passwordMismatch');
      return;
    }

    const phone = this.phoneNumber.trim();
    if (!phone.startsWith('+')) {
      this.errorMessage = this.i18n.t('register.errors.phonePrefix');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage = this.i18n.t('register.errors.invalidEmail');
      return;
    }

    if (!this.cguChecked) {
      this.errorMessage = this.i18n.t('register.errors.cgu');
      return;
    }

    this.loading = true;

    this.authService.registerClient({
      name: this.prenom.trim(),
      lastName: this.nom.trim(),
      phoneNumber: this.phoneNumber.trim(),
      email: this.email.trim(),
      password: this.password
    }).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.i18n.t('register.success');
        this.done = true;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 400) {
          this.errorMessage = this.i18n.t('register.errors.invalidData');
        } else if (err.error && typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = this.i18n.t('register.errors.generic');
        }
      }
    });
  }
}
