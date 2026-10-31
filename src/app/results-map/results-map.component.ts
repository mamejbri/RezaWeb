import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewChild,
  ViewEncapsulation,
  inject
} from '@angular/core';
import type * as Leaflet from 'leaflet';

import { LanguageService } from '../../i18n/language.service';
import { EtablissementCard } from '../../services/etablissements.service';
import { LatLng } from '../../services/geolocation.service';

/** Centre of Morocco, shown when nothing on the map has coordinates. */
const FALLBACK_CENTER: Leaflet.LatLngTuple = [31.8, -7.1];
const FALLBACK_ZOOM = 5;

/**
 * Pins the search results (and the client, when their position is known) on an OpenStreetMap map.
 * Leaflet touches `window`, so it is loaded only in the browser, after the view exists.
 */
@Component({
  selector: 'app-results-map',
  standalone: true,
  template: `<div #host class="results-map" role="region" [attr.aria-label]="label"></div>`,
  styleUrl: './results-map.component.css',
  // Leaflet builds the markers and popups itself, outside the template.
  encapsulation: ViewEncapsulation.None
})
export class ResultsMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);
  private readonly i18n = inject(LanguageService);

  @Input() places: EtablissementCard[] = [];
  @Input() origin: LatLng | null = null;
  @Output() selectPlace = new EventEmitter<EtablissementCard>();

  @ViewChild('host', { static: true }) private host!: ElementRef<HTMLDivElement>;

  private L: typeof Leaflet | null = null;
  private map: Leaflet.Map | null = null;
  private markers: Leaflet.LayerGroup | null = null;
  private destroyed = false;

  get label(): string {
    return this.i18n.t('results.map');
  }

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const module = await import('leaflet');
    // The UMD build lands on `default` with some bundlers and on the namespace with others.
    const L = ((module as { default?: typeof Leaflet }).default ?? module) as typeof Leaflet;
    if (this.destroyed) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.L = L;
      this.map = L.map(this.host.nativeElement, { scrollWheelZoom: false }).setView(FALLBACK_CENTER, FALLBACK_ZOOM);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map);
      this.markers = L.layerGroup().addTo(this.map);
      this.render();
    });
  }

  ngOnChanges(): void {
    this.zone.runOutsideAngular(() => this.render());
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.map?.remove();
    this.map = null;
  }

  private render(): void {
    const { L, map, markers } = this;
    if (!L || !map || !markers) {
      return;
    }

    markers.clearLayers();
    const points: Leaflet.LatLngTuple[] = [];

    for (const place of this.places) {
      if (place.latitude == null || place.longitude == null) {
        continue;
      }
      const point: Leaflet.LatLngTuple = [place.latitude, place.longitude];
      points.push(point);
      L.marker(point, { icon: this.pinIcon(L), title: place.name })
        .bindPopup(() => this.popup(place))
        .addTo(markers);
    }

    if (this.origin) {
      const point: Leaflet.LatLngTuple = [this.origin.lat, this.origin.lng];
      points.push(point);
      L.marker(point, {
        icon: L.divIcon({ className: 'results-map__origin', iconSize: [22, 22], iconAnchor: [11, 11] }),
        title: this.i18n.t('results.youAreHere'),
        zIndexOffset: 1000
      })
        .bindTooltip(this.i18n.t('results.youAreHere'))
        .addTo(markers);
    }

    if (points.length === 0) {
      map.setView(FALLBACK_CENTER, FALLBACK_ZOOM);
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 15 });
    }
  }

  /**
   * The teardrop is drawn by an inner span: Leaflet positions the marker element itself with a
   * transform, so rotating that element would also rotate its position on the map.
   */
  private pinIcon(L: typeof Leaflet): Leaflet.DivIcon {
    return L.divIcon({
      className: 'results-map__pin',
      html: '<span></span>',
      iconSize: [26, 26],
      // Tip of the rotated teardrop sits ~18px below the box centre.
      iconAnchor: [13, 31],
      popupAnchor: [0, -30]
    });
  }

  /** Built as DOM nodes (not an HTML string) so names and addresses are never parsed as markup. */
  private popup(place: EtablissementCard): HTMLElement {
    const root = document.createElement('div');
    root.className = 'results-map__popup';

    const name = document.createElement('strong');
    name.textContent = place.name;
    root.appendChild(name);

    const address = document.createElement('span');
    address.textContent =
      place.distanceKm != null ? `${place.address} · ${place.distanceKm.toFixed(1)} km` : place.address;
    root.appendChild(address);

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = this.i18n.t('results.viewPlace');
    button.addEventListener('click', () => this.zone.run(() => this.selectPlace.emit(place)));
    root.appendChild(button);

    return root;
  }
}
