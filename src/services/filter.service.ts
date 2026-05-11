import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.config';
import { BusinessType } from './etablissements.service';

export type FilterGroup =
  | 'CUISINE'
  | 'REGIME_ALIMENTAIRE'
  | 'CADRE_AMBIANCE'
  | 'PRESTATION'
  | 'POUR_QUI'
  | 'GAMME_PRODUIT'
  | 'ACTIVITE'
  | 'ENVIRONNEMENT';

export type FilterOption = {
  id: number;
  libelle: string;
};

export type FilterGroupDto = {
  group: FilterGroup;
  options: FilterOption[];
};

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private readonly http = inject(HttpClient);

  getByBusinessType(businessType: BusinessType): Observable<FilterGroupDto[]> {
    return this.http.get<FilterGroupDto[]>(`${API_BASE_URL}/filters/by-business-type`, {
      params: { businessType }
    });
  }
}
