import type { Messages } from '../en/index.js';

export const auth: Messages['auth'] = {
  tagline: 'Dein Trainingsverlauf wird auf jedem Gerät synchronisiert, auf dem du dich anmeldest.',
  language: 'Sprache',
  resetIntro:
    'Gib die E-Mail-Adresse ein, mit der du dich registriert hast. Wir schicken dir einen Link, um ein neues Passwort festzulegen.',
  modes: 'Anmelden oder Konto erstellen',
  signIn: 'Anmelden',
  createAccount: 'Konto erstellen',
  email: 'E-Mail',
  password: 'Passwort',
  passwordHint: 'Mindestens 8 Zeichen.',
  createAnAccount: 'Ein Konto erstellen',
  resetMyPassword: 'Passwort zurücksetzen',
  working: 'Einen Moment…',
  sendResetLink: 'Link zum Zurücksetzen senden',
  backToSignIn: 'Zurück zur Anmeldung',
  or: 'oder',
  google: 'Weiter mit Google',
  forgot: 'Passwort vergessen?',
  newPassword: {
    title: 'Neues Passwort wählen',
    accountOpen: 'Dein Konto ist geöffnet.',
    signedInAs: (email: string) => `Angemeldet als ${email}.`,
    explain:
      'Dieser Link hat dein Konto geöffnet. Lege jetzt ein Passwort fest – es ist ab sofort das, mit dem du dich anmeldest.',
    label: 'Neues Passwort',
    minimum: (length: number) => `Mindestens ${String(length)} Zeichen.`,
    again: 'Noch einmal eingeben',
    mismatch: 'Die Eingaben stimmen nicht überein.',
    set: 'Passwort festlegen',
    keep: 'Überspringen – aktuelles Passwort behalten',
  },
  notices: {
    confirm: 'Konto erstellt. Bestätige es über den Link in deiner E-Mail und melde dich dann an.',
    googleFailed: 'Die Anmeldeseite konnte nicht geöffnet werden.',
    unsent: (count: number) =>
      `${String(count)} Änderungen haben den Server noch nicht erreicht, daher wurde auf diesem Gerät nichts gelöscht. Melde dich mit Verbindung wieder an, um sie zu speichern.`,
    resetSent:
      'Wenn zu dieser E-Mail-Adresse ein Konto gehört, ist ein Link unterwegs. Er ist eine Stunde gültig.',
  },
  errors: {
    credentials:
      'E-Mail und Passwort passen nicht zusammen. Prüfe beides – oder erstelle ein Konto, falls du noch keins hast.',
    registered: 'Zu dieser E-Mail-Adresse gibt es schon ein Konto. Melde dich stattdessen an.',
    short: 'Passwörter brauchen mindestens 8 Zeichen.',
    rateLimit: 'Zu viele Versuche. Warte eine Minute und versuche es erneut.',
    network: 'Der Server ist nicht erreichbar. Prüfe deine Verbindung.',
    samePassword: 'Das ist dein bisheriges Passwort. Wähle ein anderes.',
    otherBrowser:
      'Öffne den Link im selben Browser, in dem du das Zurücksetzen angefordert hast, und versuche es erneut.',
  },
};
