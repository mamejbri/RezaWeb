import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClientSessionService } from '../../services/client-session.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
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
        this.successMessage = 'Si ce compte existe, un lien de reinitialisation a ete envoye.';
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de demander la reinitialisation pour le moment.';
      }
    });
  }
}
