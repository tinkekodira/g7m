import type { Messages } from '../en/index.js';

export const tour: Messages['tour'] = {
  stops: [
    {
      title: 'Démarrer une séance',
      text: 'Prêt à t’entraîner ? Démarre ta séance ici, ou reprends une séance en cours.',
    },
    {
      title: 'Progrès et historique',
      text: 'Ouvre Progrès depuis l’accueil pour analyser ton entraînement et revoir tes séances passées.',
    },
    {
      title: 'Bibliothèque d’exercices',
      text: 'Parcours les exercices depuis l’accueil pour chercher dans toute la bibliothèque et trouver des conseils pour chaque mouvement.',
    },
    {
      title: 'Ton corps 3D interactif',
      text: 'Retrouve le corps 3D dans Apprendre. Touche un muscle pour découvrir les exercices qui le travaillent.',
    },
    {
      title: 'S’entraîner entre amis',
      text: 'Ajoute des amis ici, comparez vos entraînements et lancez-vous des défis.',
    },
  ],
  position: (index: number, total: number) => `${String(index)} sur ${String(total)}`,
  skip: 'Passer la visite',
  opening: 'Ouverture de cette étape… Tu peux continuer ou passer.',
  finish: 'Terminer la visite',
  replay: 'Faire la visite de l’app',
  invitationTitle: 'Trouve tes repères',
  invitationBody: 'Cinq étapes rapides pour découvrir tes outils d’entraînement.',
  take: 'Faire une visite rapide',
  dismissLabel: 'Ignorer l’invitation à la visite',
  dismiss: 'Ignorer',
};
