import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ClientSessionService } from '../../services/client-session.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly clientSessionService = inject(ClientSessionService);

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }
}
