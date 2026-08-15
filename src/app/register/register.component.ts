import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { ClientSessionService } from '../../services/client-session.service';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  private readonly clientSessionService = inject(ClientSessionService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
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

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }

  ngOnInit(): void {
    this.seoService.update({
      title: 'Créer un compte',
      description: 'Créez votre compte Reza pour réserver restaurants, soins et activités en ligne.',
      path: '/register'
    });
  }

  register(): void {
    if (this.loading) return;

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.nom.trim() || !this.prenom.trim() || !this.phoneNumber.trim() || !this.email.trim() || !this.password.trim() || !this.confirmPassword.trim()) {
      this.errorMessage = 'Tous les champs sont obligatoires.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    const phone = this.phoneNumber.trim();
    if (!phone.startsWith('+')) {
      this.errorMessage = 'Le numéro WhatsApp doit commencer par "+". (Ex: +212...)';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage = 'Veuillez saisir une adresse e-mail valide.';
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
