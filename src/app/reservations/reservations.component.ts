import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Observable, catchError, forkJoin, of } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { AvailabilityService } from '../../services/availability.service';
import { AvisResponse, AvisService } from '../../services/avis.service';
import { ClientService } from '../../services/client.service';
import { ClientSessionService } from '../../services/client-session.service';
import { API_PUBLIC_BASE_URL } from '../../services/api.config';
import { EtablissementDetail, EtablissementsService } from '../../services/etablissements.service';
import { ReservationDto, ReservationService, UpdateReservationPayload } from '../../services/reservation.service';

type ReservationView = 'future' | 'past';

type EditState = {
  reservationId: number;
  date: string;
  time: string;
  slots: string[];
  loadingSlots: boolean;
  error: string;
};

type ReviewState = {
  reservationId: number;
  etablissementId: number;
  etablissementName: string;
  rating: number;
  contenu: string;
  existingReview: AvisResponse | null;
  loading: boolean;
  saving: boolean;
  error: string;
};

type ReservationReviewMap = Record<number, AvisResponse | null>;

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css'
})
export class ReservationsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly clientSessionService = inject(ClientSessionService);
  private readonly clientService = inject(ClientService);
  private readonly avisService = inject(AvisService);
  private readonly reservationService = inject(ReservationService);
  private readonly etablissementsService = inject(EtablissementsService);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly router = inject(Router);

  view: ReservationView = 'future';
  upcomingReservations: ReservationDto[] = [];
  pastReservations: ReservationDto[] = [];
  etablissementPolicies: Record<number, EtablissementDetail> = {};
  editState: EditState | null = null;
  reviewState: ReviewState | null = null;
  reservationReviews: ReservationReviewMap = {};
  clientId: number | null = null;
  loading = false;
  actionLoadingId: number | null = null;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    if (!this.isAuthenticated) {
      void this.router.navigateByUrl('/auth');
      return;
    }

    this.clientSessionService.ensureLoaded();
    const profile = this.clientSessionService.profile();

    if (profile?.id) {
      this.clientId = profile.id;
      this.loadReservations();
      return;
    }

    this.clientService.getMe().subscribe({
      next: (client) => {
        this.clientSessionService.setProfile(client);
        this.clientId = client.id;
        this.loadReservations();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger votre profil.';
      }
    });
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/');
  }

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }

  get displayedReservations(): ReservationDto[] {
    return this.view === 'future' ? this.upcomingReservations : this.pastReservations;
  }

  setView(view: ReservationView): void {
    this.view = view;
    this.editState = null;
    this.reviewState = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  startEdit(reservation: ReservationDto): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.canChangeReservation(reservation)) {
      this.errorMessage = "Cette reservation n'est plus modifiable.";
      return;
    }

    this.editState = {
      reservationId: reservation.id,
      date: reservation.date,
      time: this.trimTime(reservation.heureDebut),
      slots: [],
      loadingSlots: false,
      error: ''
    };
    this.loadEditSlots(reservation);
  }

  cancelEdit(): void {
    this.editState = null;
  }

  setEditDate(reservation: ReservationDto, date: string): void {
    if (!this.editState) {
      return;
    }

    this.editState.date = date;
    this.editState.time = '';
    this.loadEditSlots(reservation);
  }

  selectEditTime(slot: string): void {
    if (this.editState) {
      this.editState.time = slot;
      this.editState.error = '';
    }
  }

  updateReservation(reservation: ReservationDto): void {
    if (!this.editState || this.actionLoadingId) {
      return;
    }

    if (!this.canChangeReservation(reservation)) {
      this.errorMessage = "Cette reservation n'est plus modifiable.";
      this.editState = null;
      return;
    }

    if (!this.editState.time) {
      this.editState.error = 'Selectionnez un horaire.';
      return;
    }

    const payload: UpdateReservationPayload = {
      dateReservation: this.editState.date,
      heureDebut: this.normalizeTimeForApi(this.editState.time),
      heureFin: this.getUpdatedEndTime(reservation),
      statut: reservation.statut
    };

    this.actionLoadingId = reservation.id;
    this.reservationService.updateReservation(reservation.id, payload).subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.editState = null;
        this.successMessage = 'Votre Reza a ete modifiee.';
        this.loadReservations();
      },
      error: () => {
        this.actionLoadingId = null;
        this.errorMessage = 'Impossible de modifier cette Reza.';
      }
    });
  }

  cancelReservation(reservation: ReservationDto): void {
    if (!this.clientId || this.actionLoadingId) {
      return;
    }

    if (!this.canChangeReservation(reservation)) {
      this.errorMessage = "Cette reservation n'est plus annulable.";
      return;
    }

    this.actionLoadingId = reservation.id;
    this.reservationService.cancelByClient({ reservationId: reservation.id, clientId: this.clientId }).subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.editState = null;
        this.successMessage = 'Votre Reza a ete annulee.';
        this.loadReservations();
      },
      error: () => {
        this.actionLoadingId = null;
        this.errorMessage = 'Impossible d annuler cette Reza.';
      }
    });
  }

  leaveReview(reservation: ReservationDto): void {
    if (!this.clientId) {
      this.errorMessage = 'Impossible de trouver votre profil client.';
      return;
    }

    this.reviewState = {
      reservationId: reservation.id,
      etablissementId: reservation.etablissementId,
      etablissementName: reservation.name,
      rating: 5,
      contenu: '',
      existingReview: null,
      loading: true,
      saving: false,
      error: ''
    };

    this.avisService.findByReservation(reservation.id).subscribe({
      next: (review) => {
        if (!this.reviewState || this.reviewState.reservationId !== reservation.id) {
          return;
        }

        this.reviewState.loading = false;
        this.reviewState.existingReview = review;
        this.reviewState.rating = review?.rating ?? 5;
        this.reviewState.contenu = review?.contenu ?? '';
      },
      error: () => {
        if (!this.reviewState || this.reviewState.reservationId !== reservation.id) {
          return;
        }

        this.reviewState.loading = false;
        this.reviewState.error = 'Impossible de charger cet avis.';
      }
    });
  }

  closeReviewModal(): void {
    this.reviewState = null;
  }

  setReviewRating(rating: number): void {
    if (this.reviewState?.existingReview) {
      return;
    }

    if (this.reviewState) {
      this.reviewState.rating = rating;
    }
  }

  saveReview(): void {
    if (!this.reviewState || this.reviewState.existingReview || this.reviewState.saving || !this.clientId) {
      return;
    }

    const contenu = this.reviewState.contenu.trim();

    if (!this.reviewState.rating || this.reviewState.rating < 1 || this.reviewState.rating > 5) {
      this.reviewState.error = 'Choisissez une note entre 1 et 5.';
      return;
    }

    this.reviewState.saving = true;
    this.reviewState.error = '';

    this.avisService
      .create({
        etablissementId: this.reviewState.etablissementId,
        clientId: this.clientId,
        reservationId: this.reviewState.reservationId,
        rating: this.reviewState.rating,
        contenu
      })
      .subscribe({
        next: (review) => {
          if (!this.reviewState) {
            return;
          }

          this.reviewState.saving = false;
          this.reviewState.existingReview = review;
          this.reviewState.contenu = review.contenu ?? '';
          this.reviewState.rating = review.rating ?? this.reviewState.rating;
          this.successMessage = 'Votre avis a ete enregistre.';
        },
        error: () => {
          if (!this.reviewState) {
            return;
          }

          this.reviewState.saving = false;
          this.reviewState.error = 'Impossible d enregistrer votre avis.';
        }
      });
  }

  hasExistingReview(reservationId: number): boolean {
    return !!this.reservationReviews[reservationId];
  }

  reviewAuthor(review: AvisResponse): string {
    const parts = [review.clientName, review.clientLastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Client Reza';
  }

  canChangeReservation(reservation: ReservationDto): boolean {
    const policy = this.getPolicy(reservation);

    if (!policy) {
      return false;
    }

    const start = this.getReservationDateTime(reservation);
    const limit = this.addPolicyDuration(
      new Date(),
      policy.bookingRules?.cancelBeforeValue ?? policy.annulationRdvValeur,
      policy.bookingRules?.cancelBeforeUnit ?? policy.annulationRdvUnite
    );

    return start.getTime() > limit.getTime();
  }

  formatDate(dateValue: string): string {
    const date = new Date(`${dateValue}T12:00:00`);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  trimTime(time: string | null | undefined): string {
    return time ? time.slice(0, 5) : '';
  }

  resolveImageUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) {
      return null;
    }

    if (/^https?:\/\//i.test(imageUrl)) {
      return imageUrl;
    }

    return `${API_PUBLIC_BASE_URL}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
  }

  private loadReservations(): void {
    if (!this.clientId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      future: this.reservationService.getUpcomingForClient(this.clientId).pipe(catchError(() => of([]))),
      past: this.reservationService.getPastForClient(this.clientId).pipe(catchError(() => of([])))
    }).subscribe(({ future, past }) => {
      this.upcomingReservations = future;
      this.pastReservations = past;
      this.loading = false;
      this.loadMissingPolicies([...future, ...past]);
      this.loadPastReservationReviews(past);
    });
  }

  private loadPastReservationReviews(reservations: ReservationDto[]): void {
    if (reservations.length === 0) {
      this.reservationReviews = {};
      return;
    }

    forkJoin(
      reservations.map((reservation) =>
        this.avisService.findByReservation(reservation.id).pipe(catchError(() => of(null)))
      )
    ).subscribe((reviews) => {
      const nextMap: ReservationReviewMap = {};

      reservations.forEach((reservation, index) => {
        nextMap[reservation.id] = reviews[index];
      });

      this.reservationReviews = nextMap;
    });
  }

  private loadMissingPolicies(reservations: ReservationDto[]): void {
    const missingIds = [
      ...new Set(
        reservations
          .map((reservation) => reservation.etablissementId)
          .filter((id) => !this.etablissementPolicies[id])
      )
    ];

    if (missingIds.length === 0) {
      return;
    }

    forkJoin(
      missingIds.map((id) =>
        this.etablissementsService.getById(id).pipe(
          catchError(() => of(null))
        )
      )
    ).subscribe((etablissements) => {
      etablissements.forEach((etablissement) => {
        if (etablissement?.id) {
          this.etablissementPolicies[etablissement.id] = etablissement;
        }
      });
    });
  }

  private loadEditSlots(reservation: ReservationDto): void {
    if (!this.editState) {
      return;
    }

    this.editState.loadingSlots = true;
    this.editState.error = '';
    this.editState.slots = [];

    const date = this.editState.date;
    const request: Observable<{ slots: string[] } | null> = reservation.prestationId
      ? this.availabilityService
          .getPrestationAvailability(reservation.etablissementId, reservation.prestationId, date)
          .pipe(catchError(() => of(null)))
      : this.availabilityService
          .getRestaurantAvailability(reservation.etablissementId, date)
          .pipe(catchError(() => of(null)));

    request.subscribe((response) => {
      if (!this.editState || this.editState.reservationId !== reservation.id) {
        return;
      }

      this.editState.loadingSlots = false;

      if (!response || !('slots' in response) || response.slots.length === 0) {
        this.editState.error = 'Aucun creneau disponible pour cette date.';
        return;
      }

      this.editState.slots = response.slots.filter((slot: string) => this.isEditSlotBookable(reservation, date, slot));

      if (this.editState.slots.length === 0) {
        this.editState.error = 'Aucun creneau modifiable selon les regles de reservation.';
      }
    });
  }

  private isEditSlotBookable(reservation: ReservationDto, date: string, slot: string): boolean {
    const policy = this.getPolicy(reservation);
    const slotDate = new Date(`${date}T00:00:00`);
    const [hours, minutes] = slot.split(':').map(Number);
    slotDate.setHours(hours, minutes, 0, 0);

    const earliest = this.addPolicyDuration(
      new Date(),
      policy?.bookingRules?.minBookingValue ?? policy?.priseRdvMinValeur,
      policy?.bookingRules?.minBookingUnit ?? policy?.priseRdvMinUnite
    );

    const latest = this.getLatestBookableDateTime(policy);

    if (slotDate.getTime() < earliest.getTime()) {
      return false;
    }

    return !latest || slotDate.getTime() <= latest.getTime();
  }

  private getLatestBookableDateTime(policy: EtablissementDetail | undefined): Date | null {
    const value = policy?.bookingRules?.maxBookingValue ?? policy?.priseRdvMaxValeur;
    const unit = policy?.bookingRules?.maxBookingUnit ?? policy?.priseRdvMaxUnite;

    if (value == null || value <= 0 || !unit) {
      return null;
    }

    return this.addPolicyDuration(new Date(), value, unit);
  }

  private getUpdatedEndTime(reservation: ReservationDto): string | null {
    if (!this.editState?.time) {
      return reservation.heureFin ?? null;
    }

    const duration = reservation.prestationDuration;
    if (!duration) {
      return reservation.heureFin ? this.normalizeTimeForApi(this.trimTime(reservation.heureFin)) : null;
    }

    const [hours, minutes] = this.editState.time.split(':').map(Number);
    const date = new Date(`${this.editState.date}T00:00:00`);
    date.setHours(hours, minutes + duration, 0, 0);

    return this.normalizeTimeForApi(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`);
  }

  private getReservationDateTime(reservation: ReservationDto): Date {
    const [hours, minutes] = this.trimTime(reservation.heureDebut).split(':').map(Number);
    const date = new Date(`${reservation.date}T00:00:00`);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private getPolicy(reservation: ReservationDto): EtablissementDetail | undefined {
    return this.etablissementPolicies[reservation.etablissementId];
  }

  private normalizeTimeForApi(time: string): string {
    return time.length === 5 ? `${time}:00` : time;
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
}
