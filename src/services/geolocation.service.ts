import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

export type LatLng = { lat: number; lng: number };

/**
 * Why no position came back, so the page can say what to do (it said "check the permission"
 * for every failure, even when the permission was given):
 * - denied: the site, or the browser in the system settings, may not use the location;
 * - unavailable: the device could not find where it is (location services off, no network);
 * - timeout: no position in time;
 * - insecure: the page is not served over HTTPS, browsers refuse the location there.
 */
export type LocationFailure = 'denied' | 'unavailable' | 'timeout' | 'insecure';

export class LocationError extends Error {
  constructor(readonly reason: LocationFailure) {
    super(`Geolocation failed: ${reason}`);
  }
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private readonly platformId = inject(PLATFORM_ID);

  /** Rejects with a {@link LocationError}. A slow first try is retried once with more time. */
  async current(): Promise<LatLng> {
    if (!isPlatformBrowser(this.platformId) || !navigator.geolocation) {
      throw new LocationError('unavailable');
    }
    if (!window.isSecureContext) {
      throw new LocationError('insecure');
    }

    try {
      return await this.locate({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
    } catch (error) {
      if (error instanceof LocationError && error.reason !== 'denied') {
        // Wi-Fi based positions can be slow the first time: give it one more, longer chance.
        return this.locate({ enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 });
      }
      throw error;
    }
  }

  private locate(options: PositionOptions): Promise<LatLng> {
    return new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) =>
          reject(
            new LocationError(
              error.code === error.PERMISSION_DENIED
                ? 'denied'
                : error.code === error.TIMEOUT
                  ? 'timeout'
                  : 'unavailable'
            )
          ),
        options
      )
    );
  }
}
