import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, of } from 'rxjs';

import { ClientSessionService } from '../../services/client-session.service';
import { EtablissementsService, RezaSearchType } from '../../services/etablissements.service';
import { GeolocationService, LocationError } from '../../services/geolocation.service';
import { SeoService } from '../../services/seo.service';

import { LanguageService } from '../../i18n/language.service';
import { LocaleSwitcherComponent } from '../../i18n/locale-switcher.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
type TypeConfig = {
  /** Translation key. */
  label: string;
  image: string;
};

const TYPE_CONFIG: Record<RezaSearchType, TypeConfig> = {
  restaurant: { label: 'nav.restaurant', image: 'assets/images/restaurant-bg.png' },
  soin: { label: 'nav.beauty', image: 'assets/images/soin-bg.jpg' },
  activite: { label: 'nav.activity', image: 'assets/images/activites-bg.jpg' }
};

const DEFAULT_CITIES = ['Casablanca', 'Marrakech', 'Rabat', 'Tanger', 'Agadir', 'Fès'];

@Component({
  selector: 'app-recherche',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, TranslatePipe, LocaleSwitcherComponent],
  templateUrl: './recherche.component.html',
  styleUrl: './recherche.component.css'
})
export class RechercheComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly i18n = inject(LanguageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientSessionService = inject(ClientSessionService);
  private readonly etablissementsService = inject(EtablissementsService);
  private readonly seoService = inject(SeoService);
  private readonly geolocation = inject(GeolocationService);

  selectedType: RezaSearchType = 'restaurant';
  searchText = '';
  cities: string[] = [];
  citiesLoading = true;
  locating = false;
  /** i18n key of why the position could not be had, or null. */
  locationError: string | null = null;

  get typeConfig(): TypeConfig {
    return TYPE_CONFIG[this.selectedType];
  }

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }

  ngOnInit(): void {
    this.selectedType = (this.route.snapshot.queryParamMap.get('type') as RezaSearchType | null) ?? 'restaurant';

    this.seoService.update({
      title: this.i18n.t('search.seoTitle'),
      description: this.i18n.t('search.seoDescription'),
      path: '/recherche'
    });

    if (isPlatformBrowser(this.platformId)) {
      this.loadCities();
    } else {
      this.citiesLoading = false;
    }
  }

  submitSearch(): void {
    this.goToResults();
  }

  selectCity(city: string): void {
    this.goToResults(city);
  }

  skipToAllResults(): void {
    this.goToResults();
  }

  searchNearMe(): void {
    this.locating = true;
    this.locationError = null;

    this.geolocation
      .current()
      .then(({ lat, lng }) => this.goToResults(undefined, { lat: lat.toFixed(5), lng: lng.toFixed(5) }))
      .catch((error) => (this.locationError = locationErrorKey(error)))
      .finally(() => (this.locating = false));
  }

  private loadCities(): void {
    this.citiesLoading = true;

    this.etablissementsService
      .getCities(this.selectedType)
      .pipe(catchError(() => of([])))
      .subscribe((cities) => {
        this.cities = cities.length > 0 ? cities : DEFAULT_CITIES;
        this.citiesLoading = false;
      });
  }

  private goToResults(city?: string, position?: { lat: string; lng: string }): void {
    const queryParams: Record<string, string> = { type: this.selectedType, ...position };

    const trimmedText = this.searchText.trim();
    if (trimmedText) {
      queryParams['text'] = trimmedText;
    }

    if (city) {
      queryParams['city'] = city;
    }

    void this.router.navigate(['/etablissementrecherche'], { queryParams });
  }
}

/** The message for why the position could not be had. */
function locationErrorKey(error: unknown): string {
  const reason = error instanceof LocationError ? error.reason : 'unavailable';
  return {
    denied: 'results.locationDenied',
    unavailable: 'results.locationUnavailable',
    timeout: 'results.locationTimeout',
    insecure: 'results.locationInsecure'
  }[reason];
}
