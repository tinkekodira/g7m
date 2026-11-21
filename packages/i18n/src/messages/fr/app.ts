import type { Messages } from '../en/index.js';

export const app: Messages['app'] = {
  accountReady: {
    title: 'Préparation de ton compte',
    notArrived:
      'Ton profil n’est pas encore arrivé sur cet appareil. Vérifie ta connexion et réessaie.',
  },
  update: {
    ready: 'Une nouvelle version de g7m est prête.',
  },
  tabs: {
    main: 'Principal',
    learn: 'Apprendre',
    friends: 'Amis',
    home: 'Accueil',
    profile: 'Profil',
    settings: 'Réglages',
    needsAttention: '(à vérifier)',
  },
  loadingStates: {
    account: 'Chargement de ton compte…',
    train: 'S’entraîner',
    workout: 'Chargement de la séance…',
    yourProfile: 'Ton profil',
    exercises: 'Exercices',
    profile: 'Chargement de ton profil…',
    exerciseList: 'Chargement des exercices…',
    bodyView: 'Chargement de la vue du corps…',
    leaderboard: 'Chargement du classement…',
    requests: 'Chargement des demandes…',
    friends: 'Chargement des amis…',
    numbers: 'Chargement de tes chiffres…',
    thisMonth: 'Chargement de ce mois…',
  },
  crash: {
    updatedTitle: 'g7m a été mis à jour',
    updatedDetail:
      'Une nouvelle version est arrivée pendant que cet écran était ouvert, et une partie n’est plus là où l’ancienne l’attend. Recharge pour terminer la mise à jour. Rien de ce que tu as enregistré n’est perdu.',
    bugTitle: 'Un problème est survenu sur cet écran',
    bugDetailInWorkout:
      'Ta séance est en sécurité. Chaque série est enregistrée sur cet appareil dès que tu la coches : tu peux rouvrir la séance depuis l’accueil et reprendre où tu en étais.',
    bugDetail:
      'Tout ce que tu as enregistré est sauvegardé sur cet appareil, rien n’est perdu. Réessaie ou retourne à l’accueil.',
    goToHome: 'Aller à l’accueil',
    reloadApp: 'Recharger l’app',
    reportDetails: 'Détails pour un rapport de bug',
    reportSafe:
      'Rien ici ne permet de t’identifier : tu peux le coller dans un message sans risque.',
    copied: 'Copié',
    copyDetails: 'Copier les détails',
    copyFailed:
      'Ce navigateur refuse de le copier. Appuie longuement sur le texte ci-dessus pour le sélectionner.',
  },
  serverErrors: {
    clockSkew:
      'L’horloge de cet appareil est en avance sur le serveur, donc le jeton de connexion semble venir du futur. Active Réglages → Général → Date et heure → Réglage automatique, puis rouvre l’app.',
    sessionExpired: 'Ta session a expiré. Déconnecte-toi puis reconnecte-toi.',
    offline:
      'Impossible de joindre le serveur. Tes séances sont enregistrées sur cet appareil et se synchroniseront dès que tu seras de nouveau en ligne.',
    noAccess: 'Tu n’as pas accès à cela. Si tu viens de te connecter, essaie de rouvrir l’app.',
    gone: 'Cet élément n’existe plus.',
  },
};
