import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, forkJoin, map, of, takeUntil } from 'rxjs';

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

@Component({
  selector: 'app-etablissementrecherche',
  standalone: true,
  imports: [RouterLink],
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
  private readonly destroy$ = new Subject<void>();

  selectedType: RezaSearchType = 'restaurant';
  filterGroups: FilterGroupDto[] = [];
  selectedFilters: Partial<Record<FilterGroup, FilterOption[]>> = {};
  activeFilterGroup: FilterGroupDto | null = null;
  etablissements: EtablissementCard[] = [];
  loading = true;
  filtersLoading = true;
  error = false;

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map((params) => (params.get('type') as RezaSearchType | null) ?? 'restaurant'),
        takeUntil(this.destroy$)
      )
      .subscribe((type) => {
        this.selectedType = type;
        this.selectedFilters = {};
        this.activeFilterGroup = null;
        this.loadFilters();
        this.search();
      });
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
  }

  closeFilterDrawer(): void {
    this.activeFilterGroup = null;
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

  get hasSelectedFilters(): boolean {
    return Object.values(this.selectedFilters).some((options) => (options?.length ?? 0) > 0);
  }

  get selectedTypeLabel(): string {
    switch (this.selectedType) {
      case 'soin':
        return 'Soin';
      case 'activite':
        return 'Activité';
      default:
        return 'Restaurants';
    }
  }

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }

  groupLabel(group: FilterGroup): string {
    switch (group) {
      case 'CUISINE':
        return 'Type de cuisine';
      case 'REGIME_ALIMENTAIRE':
        return 'Régime alimentaire';
      case 'CADRE_AMBIANCE':
        return 'Cadre et ambiance';
      case 'PRESTATION':
        return 'Prestation';
      case 'POUR_QUI':
        return 'Pour qui';
      case 'GAMME_PRODUIT':
        return 'Gamme de produit';
      case 'ACTIVITE':
        return 'Activité';
      case 'ENVIRONNEMENT':
        return 'Environnement';
    }
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
              rating: `${summary.average.toString().replace('.', ',')} (${summary.count} AVIS) $$$`
            };
          });
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
