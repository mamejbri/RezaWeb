import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClientSessionService } from '../../services/client-session.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  private readonly authService = inject(AuthService);
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
      this.errorMessage = 'Le lien de reinitialisation est invalide ou incomplet.';
      return;
    }

    if (newPassword.length < 8) {
      this.errorMessage = 'Le nouveau mot de passe doit contenir au moins 8 caracteres.';
      return;
    }

    if (newPassword !== this.confirmPassword.trim()) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.loading = true;

    this.authService.resetPassword({ token, newPassword }).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Votre mot de passe a ete reinitialise.';
        setTimeout(() => void this.router.navigateByUrl('/auth'), 1200);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de reinitialiser ce mot de passe.';
      }
    });
  }
}
