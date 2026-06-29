import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ClientSessionService } from '../../services/client-session.service';

type HomeCard = {
  title: string;
  type: string;
  image: string;
};

type ProCard = {
  title: string;
  description: string;
  image: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private readonly clientSessionService = inject(ClientSessionService);

  readonly categories = ['Restaurant', 'Beauté / Bien être', 'Activitée'];

  readonly featureCards: HomeCard[] = [
    {
      title: 'Restaurant',
      type: 'restaurant',
      image: 'assets/images/restaurant-bg.png'
    },
    {
      title: 'Beauté / Bien être',
      type: 'soin',
      image: 'assets/images/soin-bg.jpg'
    },
    {
      title: 'Activitée',
      type: 'activite',
      image: 'assets/images/activites-bg.jpg'
    }
  ];

  readonly proCards: ProCard[] = [
    {
      title: 'Augmenter votre visibilité',
      description:
        'We organize community beach cleanups to clear litter around coastlines.We organize community beach cleanups to clear litter around coastlines.We organize community beach cleanups to clear litter around coastlines.',
      image: 'assets/images/soin-bg.jpg'
    },
    {
      title: 'Agendas centralisé',
      description:
        'We organize community beach cleanups to clear litter around coastlines.We organize community beach cleanups to clear litter around coastlines.We organize community beach cleanups to clear litter around coastlines.',
      image: 'assets/images/restaurant-bg.png'
    },
    {
      title: '0% de com',
      description:
        'We organize community beach cleanups to clear litter around coastlines.We organize community beach cleanups to clear litter around coastlines.We organize community beach cleanups to clear litter around coastlines.',
      image: 'assets/images/activites-bg.jpg'
    }
  ];

  readonly faqs = [
    {
      question: "Qu’est-ce que Reza ?",
      answer:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
    },
    {
      question: 'Comment prendre rendez-vous sur Reza ?',
      answer:
        'Choisissez une catégorie, trouvez un établissement, puis sélectionnez votre créneau pour confirmer la réservation en quelques clics.'
    },
    {
      question: 'Comment inscrire mon établissement sur Reza ?',
      answer:
        "Passez par l'espace professionnel pour créer votre fiche, publier vos disponibilités et commencer à recevoir des réservations."
    },
    {
      question: 'Qu’est-ce que Reza ?',
      answer:
        'Reza simplifie la recherche, la réservation et la gestion des rendez-vous pour les clients comme pour les établissements.'
    }
  ];

  get isAuthenticated(): boolean {
    return this.clientSessionService.isAuthenticated();
  }

  get avatarStyle(): string | null {
    return this.clientSessionService.avatarStyle();
  }
}
