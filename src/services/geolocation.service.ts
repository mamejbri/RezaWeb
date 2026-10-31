import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

export type LatLng = { lat: number; lng: number };

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private readonly platformId = inject(PLATFORM_ID);

  /** Rejects when the browser has no geolocation, the user refuses, or no fix arrives in time. */
  current(): Promise<LatLng> {
    if (!isPlatformBrowser(this.platformId) || !navigator.geolocation) {
      return Promise.reject(new Error('Geolocation unavailable'));
    }

    return new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        reject,
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      )
    );
  }
}
