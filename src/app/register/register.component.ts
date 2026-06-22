import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { ClientSessionService } from '../../services/client-session.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly clientSessionService = inject(ClientSessionService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  nom = '';
  prenom = '';
  phoneNumber = '';
  email = '';
  password = '';
  cguChecked = false;

  loading = false;
  errorMessage = '';
  successMessage = '';

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }

  register(): void {
    if (this.loading) return;

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.nom.trim() || !this.prenom.trim() || !this.phoneNumber.trim() || !this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Tous les champs sont obligatoires.';
      return;
    }

    if (!this.cguChecked) {
      this.errorMessage = 'Vous devez accepter les CGU de Reza pour continuer.';
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
        this.successMessage = 'Inscription réussie ! Redirection en cours...';
        setTimeout(() => {
          void this.router.navigate(['/auth']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 400) {
          this.errorMessage = 'Données d\'inscription invalides.';
        } else if (err.error && typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.';
        }
      }
    });
  }
}
