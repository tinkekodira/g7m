import type { Messages } from '../en/index.js';

export const app: Messages['app'] = {
  accountReady: {
    title: 'Dein Konto wird vorbereitet',
    notArrived:
      'Dein Profil ist noch nicht auf diesem Gerät angekommen. Prüfe deine Verbindung und versuche es erneut.',
  },
  update: {
    ready: 'Eine neue Version von g7m ist bereit.',
  },
  tabs: {
    main: 'Hauptmenü',
    learn: 'Lernen',
    friends: 'Freunde',
    home: 'Start',
    profile: 'Profil',
    settings: 'Einstellungen',
    needsAttention: '(braucht Aufmerksamkeit)',
  },
  loadingStates: {
    account: 'Dein Konto wird geladen…',
    train: 'Training',
    workout: 'Training wird geladen…',
    yourProfile: 'Dein Profil',
    exercises: 'Übungen',
    profile: 'Dein Profil wird geladen…',
    exerciseList: 'Übungen werden geladen…',
    bodyView: 'Körperansicht wird geladen…',
    leaderboard: 'Bestenliste wird geladen…',
    requests: 'Anfragen werden geladen…',
    friends: 'Freunde werden geladen…',
    numbers: 'Deine Werte werden geladen…',
    thisMonth: 'Dieser Monat wird geladen…',
  },
  crash: {
    updatedTitle: 'g7m wurde aktualisiert',
    updatedDetail:
      'Während dieser Bildschirm offen war, kam eine neue Version an, und ein Teil davon liegt nicht mehr dort, wo die alte ihn erwartet. Lade neu, um das Update abzuschließen. Nichts, was du eingetragen hast, geht verloren.',
    bugTitle: 'Auf diesem Bildschirm ist etwas schiefgelaufen',
    bugDetailInWorkout:
      'Dein Training ist sicher. Jeder Satz wird auf diesem Gerät gespeichert, sobald du ihn abhakst. Du kannst das Training also auf der Startseite wieder öffnen und dort weitermachen, wo du warst.',
    bugDetail:
      'Alles, was du eingetragen hast, ist auf diesem Gerät gespeichert, es geht also nichts verloren. Versuche es erneut oder kehre zur Startseite zurück.',
    goToHome: 'Zur Startseite',
    reloadApp: 'App neu laden',
    reportDetails: 'Details für einen Fehlerbericht',
    reportSafe:
      'Nichts davon identifiziert dich, du kannst es also gefahrlos in eine Nachricht einfügen.',
    copied: 'Kopiert',
    copyDetails: 'Details kopieren',
    copyFailed:
      'Dieser Browser lässt das Kopieren nicht zu. Halte den Text oben gedrückt, um ihn auszuwählen.',
  },
  serverErrors: {
    clockSkew:
      'Die Uhr dieses Geräts geht dem Server voraus, daher sieht das Anmelde-Token aus, als käme es aus der Zukunft. Aktiviere Einstellungen → Allgemein → Datum & Uhrzeit → Automatisch einstellen und öffne die App dann erneut.',
    sessionExpired: 'Deine Sitzung ist abgelaufen. Melde dich ab und wieder an.',
    offline:
      'Der Server ist nicht erreichbar. Deine Trainings sind auf diesem Gerät gespeichert und werden synchronisiert, sobald du wieder online bist.',
    noAccess:
      'Darauf hast du keinen Zugriff. Wenn du dich gerade erst angemeldet hast, öffne die App erneut.',
    gone: 'Diesen Eintrag gibt es nicht mehr.',
  },
};
