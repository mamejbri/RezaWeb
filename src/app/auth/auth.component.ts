import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClientSessionService } from '../../services/client-session.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  private readonly authService = inject(AuthService);
  private readonly clientSessionService = inject(ClientSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }

  login(): void {
    if (!this.email.trim() || !this.password.trim() || this.loading) {
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
        this.errorMessage = 'Email ou mot de passe incorrect.';
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
