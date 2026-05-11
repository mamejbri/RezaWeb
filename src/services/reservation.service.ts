import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.config';

export type CreateReservationPayload = {
  clientId: number;
  etablissementId: number;
  date: string;
  time: string;
  partySize?: number;
  prestationId?: number;
  note?: string;
};

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'CLIENT_CANCELLED'
  | 'COMPLETED'
  | 'REJECTED';

export type ReservationCreateResponse = {
  id: number;
  statut?: ReservationStatus;
  date?: string;
  time?: string;
};

export type ReservationDto = {
  id: number;
  etablissementId: number;
  prestationId?: number | null;
  prestationName?: string | null;
  prestationDuration?: number | null;
  partySize?: number | null;
  date: string;
  heureDebut: string;
  heureFin?: string | null;
  statut: ReservationStatus;
  name: string;
  clientId: number;
  address?: string | null;
  imageUrl?: string | null;
  price?: number | null;
};

export type UpdateReservationPayload = {
  dateReservation: string;
  heureDebut: string;
  heureFin: string | null;
  statut: ReservationStatus;
};

export type CancelReservationPayload = {
  reservationId: number;
  clientId: number;
};

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private readonly http = inject(HttpClient);

  createFlex(payload: CreateReservationPayload): Observable<ReservationCreateResponse> {
    return this.http.post<ReservationCreateResponse>(`${API_BASE_URL}/reservations/flex`, payload);
  }

  getUpcomingForClient(clientId: number): Observable<ReservationDto[]> {
    return this.http.get<ReservationDto[]>(`${API_BASE_URL}/reservations/me/${clientId}`);
  }

  getPastForClient(clientId: number): Observable<ReservationDto[]> {
    return this.http.get<ReservationDto[]>(`${API_BASE_URL}/reservations/client/${clientId}/past`);
  }

  updateReservation(reservationId: number, payload: UpdateReservationPayload): Observable<unknown> {
    return this.http.put(`${API_BASE_URL}/reservations/${reservationId}`, payload);
  }

  cancelByClient(payload: CancelReservationPayload): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/reservations/client/cancel`, payload);
  }
}
