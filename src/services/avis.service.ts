import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { API_BASE_URL } from './api.config';

export type ReviewSummary = {
  etablissementId: number;
  count: number;
  average: number;
};

export type AvisResponse = {
  id: number;
  contenu: string | null;
  rating: number | null;
  contestation: boolean;
  statutContester?: string | null;
  reponse?: string | null;
  clientId: number;
  clientName?: string | null;
  clientLastName?: string | null;
  etablissementId: number;
  etablissementName?: string | null;
  reservationId?: number | null;
  createdDate?: string | null;
  createdBy?: string | null;
};

export type AvisListItem = {
  id: number;
  contenu?: string | null;
  rating?: number | null;
  clientId?: number | null;
  clientName?: string | null;
  clientLastName?: string | null;
  etablissementId?: number | null;
  etablissementName?: string | null;
  reservationId?: number | null;
  createdDate?: string | null;
  reponse?: string | null;
};

export type CreateAvisRequest = {
  etablissementId: number;
  clientId: number;
  reservationId?: number | null;
  rating: number;
  contenu: string;
};

@Injectable({
  providedIn: 'root'
})
export class AvisService {
  private readonly http = inject(HttpClient);

  getSummary(etablissementId: number): Observable<ReviewSummary> {
    return this.http.get<ReviewSummary>(`${API_BASE_URL}/avis/summary/${etablissementId}`);
  }

  listForEtablissement(etablissementId: number): Observable<AvisListItem[]> {
    return this.http.get<AvisListItem[]>(`${API_BASE_URL}/avis/etablissement/${etablissementId}`);
  }

  listForClient(clientId: number): Observable<AvisListItem[]> {
    return this.http.get<AvisListItem[]>(`${API_BASE_URL}/avis/me/${clientId}`);
  }

  findByReservation(reservationId: number): Observable<AvisResponse | null> {
    return this.http
      .get<AvisResponse>(`${API_BASE_URL}/avis/reservation/${reservationId}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(null);
          }

          return throwError(() => error);
        })
      );
  }

  create(payload: CreateAvisRequest): Observable<AvisResponse> {
    return this.http.post<AvisResponse>(`${API_BASE_URL}/avis`, payload);
  }
}
