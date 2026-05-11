import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthTokenService } from './auth-token.service';
import { ClientService, type ClientProfile } from './client.service';

@Injectable({
  providedIn: 'root'
})
export class ClientSessionService {
  private readonly authTokenService = inject(AuthTokenService);
  private readonly clientService = inject(ClientService);

  private readonly profileSignal = signal<ClientProfile | null>(null);
  private readonly loadingSignal = signal(false);

  readonly profile = computed(() => this.profileSignal());
  readonly isAuthenticated = computed(() => this.authTokenService.isAuthenticated());
  readonly avatarUrl = computed(() => {
    if (!this.isAuthenticated()) {
      return null;
    }

    return this.clientService.resolvePhotoUrl(this.profileSignal()?.photo) ?? 'assets/images/default.jpg';
  });
  readonly avatarStyle = computed(() => {
    const avatarUrl = this.avatarUrl();
    return avatarUrl ? `url('${avatarUrl}')` : null;
  });

  constructor() {
    if (this.authTokenService.isAuthenticated()) {
      this.ensureLoaded();
    }
  }

  ensureLoaded(force = false): void {
    if (!this.authTokenService.isAuthenticated()) {
      this.profileSignal.set(null);
      return;
    }

    if (this.loadingSignal() || (!force && this.profileSignal())) {
      return;
    }

    this.loadingSignal.set(true);
    this.clientService.getMe().subscribe({
      next: (profile) => {
        this.profileSignal.set(profile);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
      }
    });
  }

  setProfile(profile: ClientProfile | null): void {
    this.profileSignal.set(profile);
  }

  clear(): void {
    this.profileSignal.set(null);
    this.loadingSignal.set(false);
  }
}
