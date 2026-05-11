import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ClientSessionService } from '../../services/client-session.service';
import { ClientService, type ClientProfile } from '../../services/client.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly clientSessionService = inject(ClientSessionService);
  private readonly clientService = inject(ClientService);
  private readonly router = inject(Router);

  profile: ClientProfile | null = null;
  loading = true;
  photoLoading = false;
  infoSaving = false;
  passwordSaving = false;
  infoEditMode = false;
  errorMessage = '';
  infoMessage = '';
  passwordMessage = '';
  photoErrorMessage = '';
  infoErrorMessage = '';
  passwordErrorMessage = '';

  infoForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  get firstName(): string {
    return this.infoForm.firstName;
  }

  get lastName(): string {
    return this.infoForm.lastName;
  }

  get email(): string {
    return this.infoForm.email;
  }

  get phone(): string {
    return this.infoForm.phone;
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  ngOnInit(): void {
    this.clientService.getMe().subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de charger le profil client.';
      }
    });
  }

  enableInfoEdit(): void {
    if (this.loading || this.infoSaving) {
      return;
    }

    this.infoEditMode = true;
    this.infoMessage = '';
    this.infoErrorMessage = '';
  }

  cancelInfoEdit(): void {
    if (!this.profile) {
      this.infoEditMode = false;
      return;
    }

    this.resetInfoForm(this.profile);
    this.infoEditMode = false;
    this.infoMessage = '';
    this.infoErrorMessage = '';
  }

  saveInfo(): void {
    if (!this.infoEditMode || this.infoSaving || this.loading) {
      return;
    }

    const payload = {
      firstName: this.infoForm.firstName.trim(),
      lastName: this.infoForm.lastName.trim(),
      email: this.infoForm.email.trim(),
      phone: this.infoForm.phone.trim()
    };

    if (!payload.firstName || !payload.lastName || !payload.email || !payload.phone) {
      this.infoErrorMessage = 'Remplissez tous les champs avant de sauvegarder.';
      this.infoMessage = '';
      return;
    }

    this.infoSaving = true;
    this.infoMessage = '';
    this.infoErrorMessage = '';

    this.clientService.updateMe(payload).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.infoSaving = false;
        this.infoEditMode = false;
        this.infoMessage = 'Vos informations ont ete mises a jour.';
      },
      error: () => {
        this.infoSaving = false;
        this.infoErrorMessage = 'Impossible de mettre a jour vos informations.';
      }
    });
  }

  savePassword(): void {
    if (this.passwordSaving) {
      return;
    }

    const currentPassword = this.passwordForm.currentPassword.trim();
    const newPassword = this.passwordForm.newPassword.trim();
    const confirmPassword = this.passwordForm.confirmPassword.trim();

    this.passwordMessage = '';
    this.passwordErrorMessage = '';

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.passwordErrorMessage = 'Remplissez les trois champs du mot de passe.';
      return;
    }

    if (newPassword !== confirmPassword) {
      this.passwordErrorMessage = 'La confirmation du nouveau mot de passe ne correspond pas.';
      return;
    }

    if (currentPassword === newPassword) {
      this.passwordErrorMessage = 'Le nouveau mot de passe doit etre different de l ancien.';
      return;
    }

    this.passwordSaving = true;

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.passwordSaving = false;
        this.passwordMessage = 'Votre mot de passe a ete modifie.';
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
      },
      error: () => {
        this.passwordSaving = false;
        this.passwordErrorMessage = 'Verification du mot de passe actuel impossible.';
      }
    });
  }

  selectPhoto(input: HTMLInputElement): void {
    if (this.photoLoading) {
      return;
    }

    input.click();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!input || !file) {
      return;
    }

    this.photoErrorMessage = '';
    this.photoLoading = true;

    this.readFileAsDataUrl(file)
      .then((dataUrl) => this.uploadPhoto(dataUrl))
      .then((profile) => {
        this.profile = profile;
        this.clientSessionService.setProfile(profile);
        this.photoLoading = false;
        input.value = '';
      })
      .catch(() => {
        this.photoLoading = false;
        this.photoErrorMessage = 'Impossible de mettre à jour la photo.';
        input.value = '';
      });
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/');
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private extractBase64(dataUrl: string): string {
    const separatorIndex = dataUrl.indexOf(',');
    return separatorIndex >= 0 ? dataUrl.slice(separatorIndex + 1) : dataUrl;
  }

  private async uploadPhoto(dataUrl: string): Promise<ClientProfile> {
    try {
      return await firstValueFrom(this.clientService.updateMyPhoto({ photoBase64: dataUrl }));
    } catch {
      const strippedBase64 = this.extractBase64(dataUrl);
      return firstValueFrom(this.clientService.updateMyPhoto({ photoBase64: strippedBase64 }));
    }
  }

  private applyProfile(profile: ClientProfile): void {
    this.profile = profile;
    this.clientSessionService.setProfile(profile);
    this.resetInfoForm(profile);
  }

  private resetInfoForm(profile: ClientProfile): void {
    this.infoForm = {
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      email: profile.email ?? '',
      phone: profile.phone ?? ''
    };
  }
}
