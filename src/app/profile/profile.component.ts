import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ClientSessionService } from '../../services/client-session.service';
import { ClientService, type ClientProfile } from '../../services/client.service';

import { LanguageService } from '../../i18n/language.service';
import { LocaleSwitcherComponent } from '../../i18n/locale-switcher.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, TranslatePipe, LocaleSwitcherComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(LanguageService);
  private readonly clientSessionService = inject(ClientSessionService);
  private readonly clientService = inject(ClientService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

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
    // No token on the server: keep the loading state there, the browser loads the profile.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.clientService.getMe().subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = this.i18n.t('profile.loadError');
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
      this.infoErrorMessage = this.i18n.t('profile.fillAll');
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
        this.infoMessage = this.i18n.t('profile.infoSaved');
      },
      error: () => {
        this.infoSaving = false;
        this.infoErrorMessage = this.i18n.t('profile.infoError');
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
      this.passwordErrorMessage = this.i18n.t('profile.fillPasswords');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.passwordErrorMessage = this.i18n.t('profile.passwordMismatch');
      return;
    }

    if (currentPassword === newPassword) {
      this.passwordErrorMessage = this.i18n.t('profile.passwordSame');
      return;
    }

    this.passwordSaving = true;

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.passwordSaving = false;
        this.passwordMessage = this.i18n.t('profile.passwordChanged');
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
      },
      error: () => {
        this.passwordSaving = false;
        this.passwordErrorMessage = this.i18n.t('profile.passwordError');
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
        this.photoErrorMessage = this.i18n.t('profile.photoError');
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
