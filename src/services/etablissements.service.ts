import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, catchError } from 'rxjs';

import { API_BASE_URL, API_PUBLIC_BASE_URL } from './api.config';

export type RezaSearchType = 'restaurant' | 'soin' | 'activite';
export type BusinessType = 'RESTAURANT' | 'SPA' | 'ACTIVITY';

export type EtablissementCard = {
  id: number;
  name: string;
  slug: string;
  address: string;
  rating: number;
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

export type PrestationCategorie = {
  id: number;
  nom: string;
  description?: string | null;
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
  slug?: string | null;
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

  getBySlug(slug: string): Observable<EtablissementDetail> {
    return this.http.get<EtablissementDetail>(`${API_BASE_URL}/etablissements/find/by/slug/${slug}`);
  }

  getCategoriesByEtablissement(etablissementId: number): Observable<PrestationCategorie[]> {
    return this.http
      .get<{ content: PrestationCategorie[] }>(
        `${API_BASE_URL}/prestation-categories/etablissement/${etablissementId}`,
        { params: { page: 0, size: 50, sort: 'id,asc' } }
      )
      .pipe(
        map((page) => page.content),
        catchError(() => of([]))
      );
  }

  getPrestationsByCategorie(categorieId: number): Observable<Prestation[]> {
    return this.http
      .get<Prestation[]>(`${API_BASE_URL}/prestations/categorie/${categorieId}`)
      .pipe(catchError(() => of([])));
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
      slug: item.slug ?? '',
      address: item.address?.trim() || 'Adresse non renseignee',
      rating: item.averageRating ?? 0,
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
