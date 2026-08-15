import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, of } from 'rxjs';

import { ClientSessionService } from '../../services/client-session.service';
import { EtablissementsService, RezaSearchType } from '../../services/etablissements.service';
import { SeoService } from '../../services/seo.service';

type TypeConfig = {
  label: string;
  image: string;
};

const TYPE_CONFIG: Record<RezaSearchType, TypeConfig> = {
  restaurant: { label: 'Restaurant', image: 'assets/images/restaurant-bg.png' },
  soin: { label: 'Beauté / Bien être', image: 'assets/images/soin-bg.jpg' },
  activite: { label: 'Activitée', image: 'assets/images/activites-bg.jpg' }
};

const DEFAULT_CITIES = ['Casablanca', 'Marrakech', 'Rabat', 'Tanger', 'Agadir', 'Fès'];

@Component({
  selector: 'app-recherche',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './recherche.component.html',
  styleUrl: './recherche.component.css'
})
export class RechercheComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientSessionService = inject(ClientSessionService);
  private readonly etablissementsService = inject(EtablissementsService);
  private readonly seoService = inject(SeoService);

  selectedType: RezaSearchType = 'restaurant';
  searchText = '';
  cities: string[] = [];
  citiesLoading = true;

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
      title: 'Rechercher un établissement',
      description: 'Recherchez un restaurant, un soin bien-être ou une activité par ville et réservez votre créneau en ligne sur Reza.',
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

  private goToResults(city?: string): void {
    const queryParams: Record<string, string> = { type: this.selectedType };

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
