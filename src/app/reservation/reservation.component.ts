import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, inject, ViewChild, ElementRef, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, of } from 'rxjs';

import { AvailabilityService, PrestationAvailabilityResponse, RestaurantAvailabilityResponse } from '../../services/availability.service';
import { AvisListItem, AvisService, ReviewSummary } from '../../services/avis.service';
import { ClientSessionService } from '../../services/client-session.service';
import { EtablissementDetail, EtablissementsService, Prestation, PrestationCategorie } from '../../services/etablissements.service';
import { CreateReservationPayload, ReservationService } from '../../services/reservation.service';

type ReservationTab = 'rendezvous' | 'menu' | 'avis' | 'apropos';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './reservation.component.html',
  styleUrl: './reservation.component.css'
})
export class ReservationComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly avisService = inject(AvisService);
  private readonly clientSessionService = inject(ClientSessionService);
  private readonly etablissementsService = inject(EtablissementsService);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly reservationService = inject(ReservationService);

  @ViewChild('thumbsContainer', { static: false }) thumbsContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('menuThumbsContainer', { static: false }) menuThumbsContainer!: ElementRef<HTMLDivElement>;

  etablissement: EtablissementDetail | null = null;
  loading = true;
  errorMessage = '';
  availabilityMessage = '';
  reservationMessage = '';
  reservationError = '';
  slotsLoading = false;
  reservationLoading = false;
  reviewsLoading = false;
  reviewsError = '';

  gallery: string[] = [];
  menuImages: string[] = [];
  activeImageIndex = 0;
  activeTab: ReservationTab = 'rendezvous';
  isMenuViewerOpen = false;
  activeMenuImageIndex = 0;
  selectedDate = new Date().toISOString().slice(0, 10);
  selectedPeople = 2;
  selectedTime = '';
  midiSlots: string[] = [];
  soirSlots: string[] = [];
  reviews: AvisListItem[] = [];
  reviewSummary: ReviewSummary | null = null;

  categories: PrestationCategorie[] = [];
  prestationsByCat: Record<number, Prestation[]> = {};
  categoriesLoading = false;
  loadingCategoryId: number | null = null;
  expandedCategoryId: number | null = null;

  selectedPrestation: Prestation | null = null;
  prestationSlots: string[] = [];

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }

  get heroImage(): string {
    return this.gallery[this.activeImageIndex] ?? 'assets/images/default_image.jpg';
  }

  get displayName(): string {
    return this.etablissement?.nom ?? 'Établissement';
  }

  get displayAddress(): string {
    return this.etablissement?.address?.trim() || 'Adresse indisponible';
  }

  get displayRating(): string {
    if (this.reviewSummary) {
      return this.etablissementsService.getRatingLabel({
        averageRating: this.reviewSummary.average,
        reviewCount: this.reviewSummary.count
      });
    }

    return this.etablissement ? this.etablissementsService.getRatingLabel(this.etablissement) : 'Aucun avis';
  }

  get hasMenu(): boolean {
    return this.menuImages.length > 0;
  }

  get isRestaurant(): boolean {
    return this.etablissement?.businessType === 'RESTAURANT';
  }

  get searchType(): 'restaurant' | 'soin' | 'activite' {
    switch (this.etablissement?.businessType) {
      case 'SPA':
        return 'soin';
      case 'ACTIVITY':
        return 'activite';
      default:
        return 'restaurant';
    }
  }

  get selectedDateLabel(): string {
    const date = new Date(`${this.selectedDate}T12:00:00`);

    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  get minBookableDate(): string {
    return this.toDateInputValue(this.getEarliestBookableDateTime());
  }

  get maxBookableDate(): string | null {
    const latest = this.getLatestBookableDateTime();
    return latest ? this.toDateInputValue(latest) : null;
  }

  ngOnInit(): void {
    let id = 0;
    if (isPlatformBrowser(this.platformId)) {
      id = Number(sessionStorage.getItem('selectedEtablissementId')) || 0;
    }

    if (!id) {
      this.loading = false;
      this.errorMessage = "Impossible de charger l'etablissement.";
      return;
    }

    this.etablissementsService.getById(id).subscribe({
      next: (etablissement) => {
        this.etablissement = etablissement;
        this.gallery = this.etablissementsService.getGalleryImages(etablissement);
        this.menuImages = this.etablissementsService.getMenuImages(etablissement);

        if (this.gallery.length === 0) {
          this.gallery = [this.etablissementsService.getDisplayImage(etablissement)];
        }

        this.applyDateBounds();

        // Load prestation categories for non-restaurants
        if (!this.isRestaurant) {
          this.loadCategories();
        }

        this.loading = false;
        this.loadReviews();
        this.loadAvailability();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = "Impossible de charger l'etablissement.";
      }
    });
  }

  setTab(tab: ReservationTab): void {
    this.activeTab = tab;
  }

  chooseImage(index: number): void {
    this.activeImageIndex = index;
  }

  openMenuImage(index: number): void {
    this.activeMenuImageIndex = index;
    this.isMenuViewerOpen = true;
  }

  closeMenuImageViewer(): void {
    this.isMenuViewerOpen = false;
  }

  previousMenuImage(): void {
    if (this.menuImages.length === 0) {
      return;
    }

    this.activeMenuImageIndex = (this.activeMenuImageIndex - 1 + this.menuImages.length) % this.menuImages.length;
  }

  nextMenuImage(): void {
    if (this.menuImages.length === 0) {
      return;
    }

    this.activeMenuImageIndex = (this.activeMenuImageIndex + 1) % this.menuImages.length;
  }

  returnToSearch(): void {
    void this.router.navigate(['/etablissementrecherche'], {
      queryParams: { type: this.searchType }
    });
  }

  scrollMenuThumbs(direction: number): void {
    if (this.menuThumbsContainer) {
      const container = this.menuThumbsContainer.nativeElement as HTMLElement & { scrollBy?: (options: ScrollToOptions) => void; scrollLeft: number };
      const scrollAmount = 240;

      if (typeof container.scrollBy === 'function') {
        container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollLeft += direction * scrollAmount;
      }
    }
  }

  scrollThumbs(direction: number): void {
    if (this.thumbsContainer) {
      const container = this.thumbsContainer.nativeElement;
      const scrollAmount = 200; // Adjust as needed
      container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
  }

  updatePeople(step: 1 | -1): void {
    this.selectedPeople = Math.max(1, this.selectedPeople + step);
  }

  onDateChanged(): void {
    this.applyDateBounds();
    this.selectedTime = '';
    this.availabilityMessage = '';
    this.reservationMessage = '';
    this.reservationError = '';
    
    if (this.isRestaurant) {
      this.loadRestaurantAvailability();
    } else if (this.selectedPrestation) {
      this.loadPrestationAvailability();
    } else {
      // For non-restaurants without prestation selected, show reminder
      this.prestationSlots = [];
      this.availabilityMessage = 'Sélectionnez une prestation pour voir les disponibilités.';
    }
  }

  selectTime(slot: string): void {
    this.selectedTime = slot;
    this.reservationMessage = '';
    this.reservationError = '';
  }

  toggleCategory(categoryId: number): void {
    if (this.expandedCategoryId === categoryId) {
      this.expandedCategoryId = null;
      return;
    }

    this.expandedCategoryId = categoryId;
    this.selectedPrestation = null;
    this.selectedTime = '';
    this.prestationSlots = [];
    this.availabilityMessage = '';

    if (!this.prestationsByCat[categoryId]) {
      this.loadPrestationsForCategory(categoryId);
    }
  }

  selectPrestation(prestation: Prestation): void {
    this.selectedPrestation = prestation;
    this.selectedTime = '';
    this.reservationMessage = '';
    this.reservationError = '';
    this.loadPrestationAvailability();
  }

  openDatePicker(input: HTMLInputElement): void {
    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };

    // Ensure input is visible before attempting to open picker
    const originalOpacity = pickerInput.style.opacity;
    pickerInput.style.opacity = '1';

    if (typeof pickerInput.showPicker === 'function') {
      try {
        pickerInput.showPicker();
        // Restore opacity after picker is shown
        setTimeout(() => {
          pickerInput.style.opacity = originalOpacity;
        }, 0);
      } catch {
        pickerInput.focus();
        // Restore opacity on error
        pickerInput.style.opacity = originalOpacity;
      }
    } else {
      pickerInput.focus();
      // Restore opacity for fallback focus
      pickerInput.style.opacity = originalOpacity;
    }
  }

  get canConfirmReservation(): boolean {
    return (
      !!this.selectedTime &&
      this.isSlotBookable(this.selectedTime) &&
      (this.isRestaurant || !!this.selectedPrestation) &&
      !this.reservationLoading
    );
  }

  confirmReservation(): void {
    this.reservationMessage = '';
    this.reservationError = '';

    if (this.reservationLoading) {
      return;
    }

    if (!this.isAuthenticated) {
      void this.router.navigateByUrl('/auth');
      return;
    }

    this.clientSessionService.ensureLoaded();
    const clientId = this.clientSessionService.profile()?.id;

    if (!clientId) {
      this.reservationError = 'Impossible de confirmer votre identite. Reessayez dans un instant.';
      return;
    }

    if (!this.etablissement?.id) {
      this.reservationError = "Impossible de trouver l'etablissement.";
      return;
    }

    if (!this.selectedTime) {
      this.reservationError = 'Selectionnez un horaire.';
      return;
    }

    if (!this.isSlotBookable(this.selectedTime)) {
      this.reservationError = "Ce creneau n'est plus reservable.";
      this.selectedTime = '';
      this.loadAvailability();
      return;
    }

    if (!this.isRestaurant && !this.selectedPrestation?.id) {
      this.reservationError = 'Selectionnez une prestation.';
      return;
    }

    const payload: CreateReservationPayload = {
      clientId,
      etablissementId: this.etablissement.id,
      date: this.selectedDate,
      time: this.selectedTime
    };

    if (this.isRestaurant) {
      payload.partySize = this.selectedPeople;
    } else {
      payload.prestationId = this.selectedPrestation!.id;
    }

    this.reservationLoading = true;

    this.reservationService.createFlex(payload).subscribe({
      next: () => {
        this.reservationLoading = false;
        this.reservationMessage = this.isRestaurant
          ? 'Votre demande de reservation a ete envoyee.'
          : 'Votre reservation est confirmee.';
        this.selectedTime = '';
        this.loadAvailability();
      },
      error: (error) => {
        this.reservationLoading = false;
        this.reservationError = this.getReservationErrorMessage(error?.error?.message);
      }
    });
  }

  formatReviewDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  reviewAuthor(review: AvisListItem): string {
    const parts = [review.clientName, review.clientLastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Client Reza';
  }

  private loadCategories(): void {
    if (!this.etablissement?.id) {
      return;
    }

    this.categoriesLoading = true;

    this.etablissementsService.getCategoriesByEtablissement(this.etablissement.id).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.categoriesLoading = false;
      },
      error: () => {
        this.categories = [];
        this.categoriesLoading = false;
      }
    });
  }

  private loadPrestationsForCategory(categoryId: number): void {
    this.loadingCategoryId = categoryId;

    this.etablissementsService.getPrestationsByCategorie(categoryId).subscribe({
      next: (prestations) => {
        this.prestationsByCat = {
          ...this.prestationsByCat,
          [categoryId]: prestations.filter(p => p.visible && p.validated && !p.showAsUnavailable && !p.hidden)
        };
        this.loadingCategoryId = null;
      },
      error: () => {
        this.prestationsByCat = { ...this.prestationsByCat, [categoryId]: [] };
        this.loadingCategoryId = null;
      }
    });
  }

  private loadReviews(): void {
    if (!this.etablissement?.id) {
      return;
    }

    this.reviewsLoading = true;
    this.reviewsError = '';

    this.avisService.getSummary(this.etablissement.id).pipe(catchError(() => of(null))).subscribe((summary) => {
      this.reviewSummary = summary;
    });

    this.avisService
      .listForEtablissement(this.etablissement.id)
      .pipe(
        catchError(() => {
          this.reviewsError = 'Impossible de charger les avis.';
          return of([]);
        })
      )
      .subscribe((reviews) => {
        this.reviews = reviews;
        this.reviewsLoading = false;
      });
  }

  private loadAvailability(): void {
    if (this.isRestaurant) {
      this.loadRestaurantAvailability();
    } else if (this.selectedPrestation) {
      this.loadPrestationAvailability();
    } else {
      // For non-restaurants, clear slots until prestation is selected
      this.midiSlots = [];
      this.soirSlots = [];
      this.prestationSlots = [];
      this.availabilityMessage = 'Sélectionnez une prestation pour voir les disponibilités.';
    }
  }

  private loadRestaurantAvailability(): void {
    if (!this.etablissement?.id) {
      return;
    }

    this.slotsLoading = true;
    this.availabilityMessage = '';
    this.midiSlots = [];
    this.soirSlots = [];

    this.availabilityService
      .getRestaurantAvailability(this.etablissement.id, this.selectedDate)
      .pipe(
        catchError(() => {
          this.slotsLoading = false;
          this.availabilityMessage = 'Impossible de charger les disponibilités.';
          return of(null);
        })
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }

        this.slotsLoading = false;

        if (!response.open || response.slots.length === 0) {
          this.availabilityMessage = 'Aucun créneau disponible pour cette date.';
          return;
        }

        const bookableSlots = this.filterBookableSlots(response.slots);

        if (bookableSlots.length === 0) {
          this.availabilityMessage = 'Aucun creneau reservable selon les regles de reservation.';
          return;
        }

        this.midiSlots = bookableSlots.filter((slot) => this.toMinutes(slot) < 18 * 60);
        this.soirSlots = bookableSlots.filter((slot) => this.toMinutes(slot) >= 18 * 60);
      });
  }

  private loadPrestationAvailability(): void {
    if (!this.etablissement?.id || !this.selectedPrestation?.id) {
      return;
    }

    this.slotsLoading = true;
    this.availabilityMessage = '';
    this.prestationSlots = [];

    this.availabilityService
      .getPrestationAvailability(this.etablissement.id, this.selectedPrestation.id, this.selectedDate)
      .pipe(
        catchError(() => {
          this.slotsLoading = false;
          this.availabilityMessage = 'Impossible de charger les disponibilités.';
          return of(null);
        })
      )
      .subscribe((response: PrestationAvailabilityResponse | null) => {
        if (!response) {
          return;
        }

        this.slotsLoading = false;

        if (response.slots.length === 0) {
          this.availabilityMessage = 'Aucun créneau disponible pour cette date et prestation.';
          return;
        }

        const bookableSlots = this.filterBookableSlots(response.slots);

        if (bookableSlots.length === 0) {
          this.availabilityMessage = 'Aucun creneau reservable selon les regles de reservation.';
          return;
        }

        this.prestationSlots = bookableSlots;
      });
  }

  private applyDateBounds(): void {
    const minDate = this.minBookableDate;
    const maxDate = this.maxBookableDate;

    if (this.selectedDate < minDate) {
      this.selectedDate = minDate;
    }

    if (maxDate && this.selectedDate > maxDate) {
      this.selectedDate = maxDate;
    }
  }

  private filterBookableSlots(slots: string[]): string[] {
    return slots.filter((slot) => this.isSlotBookable(slot));
  }

  private isSlotBookable(slot: string): boolean {
    const slotDateTime = this.getSlotDateTime(slot);
    const earliest = this.getEarliestBookableDateTime();
    const latest = this.getLatestBookableDateTime();

    if (slotDateTime.getTime() < earliest.getTime()) {
      return false;
    }

    return !latest || slotDateTime.getTime() <= latest.getTime();
  }

  private getSlotDateTime(slot: string): Date {
    const [hours, minutes] = slot.split(':').map(Number);
    const date = new Date(`${this.selectedDate}T00:00:00`);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private getEarliestBookableDateTime(): Date {
    return this.addPolicyDuration(
      new Date(),
      this.etablissement?.bookingRules?.minBookingValue ?? this.etablissement?.priseRdvMinValeur,
      this.etablissement?.bookingRules?.minBookingUnit ?? this.etablissement?.priseRdvMinUnite
    );
  }

  private getLatestBookableDateTime(): Date | null {
    const value = this.etablissement?.bookingRules?.maxBookingValue ?? this.etablissement?.priseRdvMaxValeur;
    const unit = this.etablissement?.bookingRules?.maxBookingUnit ?? this.etablissement?.priseRdvMaxUnite;

    if (value == null || value <= 0 || !unit) {
      return null;
    }

    return this.addPolicyDuration(new Date(), value, unit);
  }

  private addPolicyDuration(base: Date, value: number | null | undefined, unit: string | null | undefined): Date {
    const date = new Date(base);

    if (value == null || value <= 0 || !unit || unit === 'null') {
      return date;
    }

    switch (unit.toUpperCase()) {
      case 'MINUTE':
      case 'MINUTES':
        date.setMinutes(date.getMinutes() + value);
        break;
      case 'HOUR':
      case 'HOURS':
      case 'HEURE':
      case 'HEURES':
        date.setHours(date.getHours() + value);
        break;
      case 'DAY':
      case 'DAYS':
      case 'JOUR':
      case 'JOURS':
        date.setDate(date.getDate() + value);
        break;
      case 'WEEK':
      case 'WEEKS':
      case 'SEMAINE':
      case 'SEMAINES':
        date.setDate(date.getDate() + value * 7);
        break;
      case 'MONTH':
      case 'MONTHS':
      case 'MOIS':
        date.setMonth(date.getMonth() + value);
        break;
      case 'YEAR':
      case 'YEARS':
      case 'ANNEE':
      case 'ANNEES':
        date.setFullYear(date.getFullYear() + value);
        break;
    }

    return date;
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toMinutes(slot: string): number {
    const [hours, minutes] = slot.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getReservationErrorMessage(message: unknown): string {
    if (typeof message !== 'string') {
      return 'Impossible de confirmer la reservation.';
    }

    if (message.includes('Aucun collaborateur disponible')) {
      return 'Ce creneau vient de devenir indisponible. Choisissez un autre horaire.';
    }

    if (message.includes('partySize')) {
      return 'Indiquez le nombre de personnes.';
    }

    if (message.includes('prestationId')) {
      return 'Selectionnez une prestation.';
    }

    return message;
  }
}
