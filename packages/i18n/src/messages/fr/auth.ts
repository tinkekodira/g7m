import type { Messages } from '../en/index.js';

export const auth: Messages['auth'] = {
  tagline: 'Ton historique d’entraînement se synchronise sur chaque appareil où tu te connectes.',
  language: 'Langue',
  resetIntro:
    'Saisis l’e-mail utilisé à l’inscription et nous t’enverrons un lien pour choisir un nouveau mot de passe.',
  modes: 'Se connecter ou créer un compte',
  signIn: 'Se connecter',
  createAccount: 'Créer un compte',
  email: 'E-mail',
  password: 'Mot de passe',
  passwordHint: 'Au moins 8 caractères.',
  createAnAccount: 'Créer un compte',
  resetMyPassword: 'Réinitialiser mon mot de passe',
  working: 'Un instant…',
  sendResetLink: 'Envoyer le lien',
  backToSignIn: 'Retour à la connexion',
  or: 'ou',
  google: 'Continuer avec Google',
  forgot: 'Mot de passe oublié ?',
  newPassword: {
    title: 'Choisis un nouveau mot de passe',
    accountOpen: 'Ton compte est ouvert.',
    signedInAs: (email: string) => `Connecté en tant que ${email}.`,
    explain:
      'Ce lien a ouvert ton compte. Définis maintenant un mot de passe : c’est celui que tu utiliseras désormais.',
    label: 'Nouveau mot de passe',
    minimum: (length: number) => `Au moins ${String(length)} caractères.`,
    again: 'Saisis-le à nouveau',
    mismatch: 'Ils ne correspondent pas.',
    set: 'Définir le mot de passe',
    keep: 'Passer et garder mon mot de passe actuel',
  },
  notices: {
    confirm: 'Compte créé. Confirme-le avec le lien reçu par e-mail, puis connecte-toi.',
    googleFailed: 'Impossible d’ouvrir la page de connexion.',
    unsent: (count: number) =>
      `${String(count)} modifications n’avaient pas atteint le serveur, donc rien n’a été effacé sur cet appareil. Reconnecte-toi avec une connexion pour les enregistrer.`,
    resetSent:
      'Si cet e-mail a un compte, un lien de réinitialisation est en route. Il expire dans une heure.',
  },
  errors: {
    credentials:
      'Cet e-mail et ce mot de passe ne correspondent pas. Vérifie les deux, ou crée un compte si tu n’en as pas encore.',
    registered: 'Cet e-mail a déjà un compte. Connecte-toi plutôt.',
    short: 'Le mot de passe doit contenir au moins 8 caractères.',
    rateLimit: 'Trop de tentatives. Attends une minute et réessaie.',
    network: 'Impossible de joindre le serveur. Vérifie ta connexion.',
    samePassword: 'C’est déjà ton mot de passe. Choisis-en un autre.',
    otherBrowser:
      'Ouvre ce lien dans le navigateur depuis lequel tu as demandé la réinitialisation, puis réessaie.',
  },
};
