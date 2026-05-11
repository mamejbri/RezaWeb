import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL, API_ORIGIN, API_PUBLIC_BASE_URL } from './api.config';

export type ClientProfile = {
  id: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  photo: string | null;
};

export type UpdateClientProfileRequest = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type ClientPhotoUpdateRequest = {
  photoBase64: string;
};

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private readonly http = inject(HttpClient);

  getMe(): Observable<ClientProfile> {
    return this.http.get<ClientProfile>(`${API_BASE_URL}/clients/me`);
  }

  updateMe(payload: UpdateClientProfileRequest): Observable<ClientProfile> {
    return this.http.put<ClientProfile>(`${API_BASE_URL}/clients/me`, payload);
  }

  updateMyPhoto(payload: ClientPhotoUpdateRequest): Observable<ClientProfile> {
    return this.http.put<ClientProfile>(`${API_BASE_URL}/clients/me/photo`, payload);
  }

  resolvePhotoUrl(photo: string | null | undefined): string | null {
    if (!photo) {
      return null;
    }

    if (/^https?:\/\//i.test(photo)) {
      return photo;
    }

    if (photo.startsWith('/uploads/')) {
      return `${API_PUBLIC_BASE_URL}${photo}`;
    }

    if (photo.startsWith('/')) {
      return `${API_ORIGIN}${photo}`;
    }

    return `${API_PUBLIC_BASE_URL}/${photo}`;
  }
}
