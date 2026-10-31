import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.config';

export type RestaurantAvailabilityResponse = {
  date: string;
  open: boolean;
  reason: string | null;
  stepMinutes: number;
  slots: string[];
};

export type PrestationAvailabilityResponse = {
  etablissementId: number;
  prestationId: number;
  date: string;
  durationMinutes: number;
  stepMinutes: number;
  bufferBefore: number;
  bufferAfter: number;
  slots: string[];
};

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  private readonly http = inject(HttpClient);

  getRestaurantAvailability(etablissementId: number, date: string): Observable<RestaurantAvailabilityResponse> {
    return this.http.get<RestaurantAvailabilityResponse>(
      `${API_BASE_URL}/availability/${etablissementId}/availability`,
      {
        params: { date }
      }
    );
  }

  getPrestationAvailability(
    etablissementId: number,
    prestationId: number,
    date: string,
    quantity = 1,
    excludeReservationId?: number | null
  ): Observable<PrestationAvailabilityResponse> {
    const params: Record<string, string> = {
      etablissementId: etablissementId.toString(),
      date,
      quantity: String(quantity)
    };
    if (excludeReservationId != null) {
      params['excludeReservationId'] = String(excludeReservationId);
    }

    return this.http.get<PrestationAvailabilityResponse>(
      `${API_BASE_URL}/availability/prestations/${prestationId}/slots`,
      { params }
    );
  }

  /**
   * Start times for a whole panier: its prestations one after the other (a pack as its steps),
   * each by someone qualified and free for it. Only the first prestation used to be checked.
   */
  getPanierAvailability(
    etablissementId: number,
    prestationIds: number[],
    date: string,
    collaborateurByPrestation: Record<number, number | null> = {}
  ): Observable<PrestationAvailabilityResponse> {
    const params: Record<string, string> = {
      etablissementId: etablissementId.toString(),
      prestationIds: prestationIds.join(','),
      date
    };
    const pins = Object.entries(collaborateurByPrestation)
      .filter(([, c]) => c != null)
      .map(([p, c]) => `${p}:${c}`);
    if (pins.length) {
      params['collaborateurs'] = pins.join(',');
    }

    return this.http.get<PrestationAvailabilityResponse>(`${API_BASE_URL}/availability/panier/slots`, { params });
  }
}
