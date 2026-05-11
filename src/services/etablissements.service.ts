import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, catchError } from 'rxjs';

import { API_BASE_URL, API_PUBLIC_BASE_URL } from './api.config';

export type RezaSearchType = 'restaurant' | 'soin' | 'activite';
export type BusinessType = 'RESTAURANT' | 'SPA' | 'ACTIVITY';

export type EtablissementCard = {
  id: number;
  name: string;
  address: string;
  rating: string;
  reviewCount: number;
  imageUrl: string | null;
};

export type PhotoLike = {
  imageUrl?: string | null;
  photoUrl?: string | null;
  url?: string | null;
  storageKey?: string | null;
  path?: string | null;
  menuPhoto?: boolean | null;
};

export type BookingPolicyUnit = 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | string;

export type BookingRules = {
  minBookingValue?: number | null;
  minBookingUnit?: BookingPolicyUnit | null;
  maxBookingValue?: number | null;
  maxBookingUnit?: BookingPolicyUnit | null;
  cancelBeforeValue?: number | null;
  cancelBeforeUnit?: BookingPolicyUnit | null;
};

export type Prestation = {
  id: number;
  nom: string;
  description?: string | null;
  prixFixe?: number | null;
  prixMin?: number | null;
  prixMax?: number | null;
  durationMinutes?: number | null;
  categorie?: {
    id: number;
    nom: string;
  } | null;
  visible: boolean;
  validated: boolean;
  showAsUnavailable: boolean;
  hidden: boolean;
};

export type EtablissementDetail = {
  id: number;
  nom: string;
  address?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  photoPaths?: string[] | null;
  menuPhotoPaths?: string[] | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  businessType?: BusinessType | null;
  photos?: PhotoLike[] | null;
  prestations?: Prestation[] | null;
  bookingRules?: BookingRules | null;
  priseRdvMinValeur?: number | null;
  priseRdvMinUnite?: BookingPolicyUnit | null;
  priseRdvMaxValeur?: number | null;
  priseRdvMaxUnite?: BookingPolicyUnit | null;
  annulationRdvValeur?: number | null;
  annulationRdvUnite?: BookingPolicyUnit | null;
};

type EtablissementSearchRequest = {
  text: string | null;
  cuisine: number[];
  regime: number[];
  ambiance: number[];
  prestation: number[];
  pourQui: number[];
  gammeProduit: number[];
  activite: number[];
  environnement: number[];
  minPrice: number | null;
  maxPrice: number | null;
  type: BusinessType;
};

export type EtablissementSearchFilters = Partial<
  Pick<
    EtablissementSearchRequest,
    | 'cuisine'
    | 'regime'
    | 'ambiance'
    | 'prestation'
    | 'pourQui'
    | 'gammeProduit'
    | 'activite'
    | 'environnement'
  >
>;

type SpringPage<T> = {
  content: T[];
};

@Injectable({
  providedIn: 'root'
})
export class EtablissementsService {
  private readonly http = inject(HttpClient);

  searchByType(type: RezaSearchType, filters: EtablissementSearchFilters = {}, page = 0, size = 20): Observable<EtablissementCard[]> {
    return this.http
      .post<SpringPage<EtablissementDetail>>(
        `${API_BASE_URL}/etablissements/search`,
        this.buildSearchRequest(type, filters),
        {
          params: { page, size }
        }
      )
      .pipe(map((response) => response.content.map((item) => this.mapDtoToCard(item))));
  }

  getById(id: number): Observable<EtablissementDetail> {
    return this.http.get<EtablissementDetail>(`${API_BASE_URL}/etablissements/find/by/id/${id}`);
  }

  getPrestations(etablissementId: number): Observable<Prestation[]> {
    // TODO: Implement backend endpoint to fetch prestations for an establishment
    // Expected endpoint: GET /etablissements/{id}/prestations
    // For now, return mock data for testing or empty array
    return of(this.getMockPrestations());
  }

  private getMockPrestations(): Prestation[] {
    return [
      {
        id: 1,
        nom: 'Massage Relaxant',
        description: 'Massage complet du corps pour détente',
        prixFixe: 80,
        durationMinutes: 60,
        visible: true,
        validated: true,
        showAsUnavailable: false,
        hidden: false
      },
      {
        id: 2,
        nom: 'Soin du Visage',
        description: 'Soin complet du visage avec produits premium',
        prixFixe: 60,
        durationMinutes: 45,
        visible: true,
        validated: true,
        showAsUnavailable: false,
        hidden: false
      },
      {
        id: 3,
        nom: 'Manucure',
        description: 'Manucure complète',
        prixMin: 25,
        prixMax: 40,
        durationMinutes: 30,
        visible: true,
        validated: true,
        showAsUnavailable: false,
        hidden: false
      }
    ];
  }

  getDisplayImage(item: Pick<EtablissementDetail, 'imageUrl' | 'photoPaths' | 'photos'>): string {
    return this.resolveImageUrl(item) ?? 'assets/images/default_image.jpg';
  }

  getGalleryImages(item: Pick<EtablissementDetail, 'imageUrl' | 'photoPaths' | 'photos'>): string[] {
    const values = [
      this.toAbsoluteFileUrl(item.imageUrl),
      ...(item.photoPaths ?? []).map((path) => this.toAbsoluteFileUrl(path)),
      ...((item.photos ?? [])
        .filter((photo) => !photo.menuPhoto)
        .flatMap((photo) => [
          this.toAbsoluteFileUrl(photo.imageUrl),
          this.toAbsoluteFileUrl(photo.photoUrl),
          this.toAbsoluteFileUrl(photo.url),
          this.toAbsoluteFileUrl(photo.path),
          this.storageKeyToFileUrl(photo.storageKey)
        ]))
    ].filter((value): value is string => !!value);

    return [...new Set(values)];
  }

  getMenuImages(item: Pick<EtablissementDetail, 'menuPhotoPaths' | 'photos'>): string[] {
    const values = [
      ...(item.menuPhotoPaths ?? []).map((path) => this.toAbsoluteFileUrl(path)),
      ...((item.photos ?? [])
        .filter((photo) => photo.menuPhoto)
        .flatMap((photo) => [
          this.toAbsoluteFileUrl(photo.imageUrl),
          this.toAbsoluteFileUrl(photo.photoUrl),
          this.toAbsoluteFileUrl(photo.url),
          this.toAbsoluteFileUrl(photo.path),
          this.storageKeyToFileUrl(photo.storageKey)
        ]))
    ].filter((value): value is string => !!value);

    return [...new Set(values)];
  }

  getRatingLabel(item: Pick<EtablissementDetail, 'averageRating' | 'reviewCount'>): string {
    const averageRating = item.averageRating ?? 0;
    const reviewCount = item.reviewCount ?? 0;
    return `${averageRating.toString().replace('.', ',')} (${reviewCount} AVIS) $$$`;
  }

  private buildSearchRequest(type: RezaSearchType, filters: EtablissementSearchFilters): EtablissementSearchRequest {
    return {
      text: null,
      cuisine: filters.cuisine ?? [],
      regime: filters.regime ?? [],
      ambiance: filters.ambiance ?? [],
      prestation: filters.prestation ?? [],
      pourQui: filters.pourQui ?? [],
      gammeProduit: filters.gammeProduit ?? [],
      activite: filters.activite ?? [],
      environnement: filters.environnement ?? [],
      minPrice: null,
      maxPrice: null,
      type: this.mapSearchTypeToBusinessType(type)
    };
  }

  private mapSearchTypeToBusinessType(type: RezaSearchType): BusinessType {
    switch (type) {
      case 'soin':
        return 'SPA';
      case 'activite':
        return 'ACTIVITY';
      default:
        return 'RESTAURANT';
    }
  }

  private mapDtoToCard(item: EtablissementDetail): EtablissementCard {
    return {
      id: item.id,
      name: item.nom,
      address: item.address?.trim() || 'Adresse non renseignee',
      rating: this.getRatingLabel(item),
      reviewCount: item.reviewCount ?? 0,
      imageUrl: this.resolveImageUrl(item) ?? 'assets/images/default_image.jpg'
    };
  }

  private resolveImageUrl(item: Pick<EtablissementDetail, 'imageUrl' | 'photoPaths' | 'photos'>): string | null {
    const directImage = this.toAbsoluteFileUrl(item.imageUrl);
    if (directImage) {
      return directImage;
    }

    const firstPhotoPath = item.photoPaths?.[0];
    const photoPathUrl = this.toAbsoluteFileUrl(firstPhotoPath);
    if (photoPathUrl) {
      return photoPathUrl;
    }

    const firstPhoto = item.photos?.[0];
    if (!firstPhoto) {
      return null;
    }

    return (
      this.toAbsoluteFileUrl(firstPhoto.imageUrl) ||
      this.toAbsoluteFileUrl(firstPhoto.photoUrl) ||
      this.toAbsoluteFileUrl(firstPhoto.url) ||
      this.toAbsoluteFileUrl(firstPhoto.path) ||
      this.storageKeyToFileUrl(firstPhoto.storageKey) ||
      null
    );
  }

  private toAbsoluteFileUrl(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    if (value.startsWith('/')) {
      return `${API_PUBLIC_BASE_URL}${value}`;
    }

    return `${API_PUBLIC_BASE_URL}/api/files/${value}`;
  }

  private storageKeyToFileUrl(storageKey?: string | null): string | null {
    if (!storageKey) {
      return null;
    }

    return `${API_PUBLIC_BASE_URL}/api/files/${storageKey}`;
  }
}
