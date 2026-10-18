import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, catchError, forkJoin, of, takeUntil } from 'rxjs';

import { AvisService } from '../../services/avis.service';
import { ClientSessionService } from '../../services/client-session.service';
import {
  BusinessType,
  EtablissementCard,
  EtablissementSearchFilters,
  EtablissementsService,
  RezaSearchType
} from '../../services/etablissements.service';
import { FilterGroup, FilterGroupDto, FilterOption, FilterService } from '../../services/filter.service';
import { SeoService } from '../../services/seo.service';

import { LanguageService } from '../../i18n/language.service';
import { LocaleSwitcherComponent } from '../../i18n/locale-switcher.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
/** Translation keys. */
const TYPE_LABELS: Record<RezaSearchType, string> = {
  restaurant: 'types.restaurants',
  soin: 'types.beauty',
  activite: 'types.activities'
};

@Component({
  selector: 'app-etablissementrecherche',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, DecimalPipe, TranslatePipe, LocaleSwitcherComponent],
  templateUrl: './etablissementrecherche.component.html',
  styleUrl: './etablissementrecherche.component.css'
})
export class EtablissementrechercheComponent implements OnInit, OnDestroy {
  private readonly clientSessionService = inject(ClientSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly avisService = inject(AvisService);
  private readonly etablissementsService = inject(EtablissementsService);
  private readonly filterService = inject(FilterService);
  private readonly seoService = inject(SeoService);
  private readonly i18n = inject(LanguageService);
  private readonly destroy$ = new Subject<void>();

  selectedType: RezaSearchType = 'restaurant';
  selectedCity = '';
  selectedText = '';
  filterGroups: FilterGroupDto[] = [];
  selectedFilters: Partial<Record<FilterGroup, FilterOption[]>> = {};
  activeFilterGroup: FilterGroupDto | null = null;
  etablissements: EtablissementCard[] = [];
  loading = true;
  filtersLoading = true;
  error = false;
  filterSearchText = '';
  sortByRating = false;

  get typeLabel(): string {
    return this.i18n.t(TYPE_LABELS[this.selectedType]);
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.selectedType = (params.get('type') as RezaSearchType | null) ?? 'restaurant';
        this.selectedCity = params.get('city') ?? '';
        this.selectedText = params.get('text') ?? '';
        this.selectedFilters = {};
        this.activeFilterGroup = null;
        this.loadFilters();
        this.search();

        this.seoService.update({
          title: this.typeLabelInCity(this.typeLabel),
          description: this.i18n.t('results.seoDescription', { what: this.typeLabelInCity(this.typeLabel.toLowerCase()) }),
          path: '/etablissementrecherche'
        });
      });
  }

  private typeLabelInCity(type: string): string {
    return this.selectedCity ? this.i18n.t('results.titleInCity', { type, city: this.selectedCity }) : type;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  rememberReservation(id: number): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('selectedEtablissementId', String(id));
    }
  }

  toggleFilter(group: FilterGroup, option: FilterOption): void {
    const selected = this.selectedFilters[group] ?? [];
    const exists = selected.some((item) => item.id === option.id);

    this.selectedFilters[group] = exists
      ? selected.filter((item) => item.id !== option.id)
      : [...selected, option];

    this.search();
  }

  openFilterGroup(group: FilterGroupDto): void {
    this.activeFilterGroup = group;
    this.filterSearchText = '';
  }

  closeFilterDrawer(): void {
    this.activeFilterGroup = null;
    this.filterSearchText = '';
  }

  selectedCount(group: FilterGroup): number {
    return this.selectedFilters[group]?.length ?? 0;
  }

  isFilterSelected(group: FilterGroup, option: FilterOption): boolean {
    return (this.selectedFilters[group] ?? []).some((item) => item.id === option.id);
  }

  clearFilters(): void {
    this.selectedFilters = {};
    this.search();
  }

  toggleRatingSort(): void {
    this.sortByRating = !this.sortByRating;
    this.applyRatingSort();
  }

  get hasSelectedFilters(): boolean {
    return Object.values(this.selectedFilters).some((options) => (options?.length ?? 0) > 0);
  }

  get filteredActiveOptions(): FilterOption[] {
    const options = this.activeFilterGroup?.options ?? [];
    const searchText = this.normalizeFilterText(this.filterSearchText);

    if (!searchText) {
      return options;
    }

    return options.filter((option) => this.normalizeFilterText(option.libelle).includes(searchText));
  }

  get selectedTypeLabel(): string {
    switch (this.selectedType) {
      case 'soin':
        return this.i18n.t('nav.beauty');
      case 'activite':
        return this.i18n.t('nav.activity');
      default:
        return this.i18n.t('nav.restaurant');
    }
  }

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }

  groupLabel(group: FilterGroup): string {
    return this.i18n.t(`results.groups.${group}`);
  }

  groupIcon(group: FilterGroup): string {
    switch (group) {
      case 'CUISINE':
        return 'cuisine';
      case 'REGIME_ALIMENTAIRE':
        return 'regime';
      case 'CADRE_AMBIANCE':
        return 'cadre';
      case 'PRESTATION':
        return 'prestation';
      case 'POUR_QUI':
        return 'pour-qui';
      case 'GAMME_PRODUIT':
        return 'gamme';
      case 'ACTIVITE':
        return 'activite';
      case 'ENVIRONNEMENT':
        return 'environnement';
    }
  }

  private loadFilters(): void {
    this.filtersLoading = true;
    this.filterService
      .getByBusinessType(this.mapSearchTypeToBusinessType(this.selectedType))
      .pipe(catchError(() => of([])))
      .subscribe((groups) => {
        this.filterGroups = groups;
        this.filtersLoading = false;
      });
  }

  private search(): void {
    this.loading = true;
    this.error = false;

    this.etablissementsService.searchByType(this.selectedType, this.buildSearchFilters()).subscribe({
      next: (etablissements) => {
        if (etablissements.length === 0) {
          this.etablissements = [];
          this.loading = false;
          return;
        }

        forkJoin(
          etablissements.map((etablissement) =>
            this.avisService.getSummary(etablissement.id).pipe(catchError(() => of(null)))
          )
        ).subscribe((summaries) => {
          this.etablissements = etablissements.map((etablissement, index) => {
            const summary = summaries[index];

            if (!summary) {
              return etablissement;
            }

            return {
              ...etablissement,
              reviewCount: summary.count,
              rating: summary.average
            };
          });
          this.applyRatingSort();
          this.loading = false;
        });
      },
      error: () => {
        this.etablissements = [];
        this.loading = false;
        this.error = true;
      }
    });
  }

  private buildSearchFilters(): EtablissementSearchFilters {
    return {
      text: this.selectedText,
      city: this.selectedCity,
      cuisine: this.getSelectedIds('CUISINE'),
      regime: this.getSelectedIds('REGIME_ALIMENTAIRE'),
      ambiance: this.getSelectedIds('CADRE_AMBIANCE'),
      prestation: this.getSelectedIds('PRESTATION'),
      pourQui: this.getSelectedIds('POUR_QUI'),
      gammeProduit: this.getSelectedIds('GAMME_PRODUIT'),
      activite: this.getSelectedIds('ACTIVITE'),
      environnement: this.getSelectedIds('ENVIRONNEMENT')
    };
  }

  private getSelectedIds(group: FilterGroup): number[] {
    return (this.selectedFilters[group] ?? []).map((option) => option.id);
  }

  private applyRatingSort(): void {
    if (!this.sortByRating) {
      return;
    }

    this.etablissements = [...this.etablissements].sort((first, second) => {
      const ratingDelta = this.getRatingValue(second.rating) - this.getRatingValue(first.rating);

      if (ratingDelta !== 0) {
        return ratingDelta;
      }

      return second.reviewCount - first.reviewCount;
    });
  }

  private getRatingValue(value: number): number {
    return Number.isFinite(value) ? value : 0;
  }

  private normalizeFilterText(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
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
}
