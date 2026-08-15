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
}
