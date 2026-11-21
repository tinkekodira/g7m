import type { Messages } from '../en/index.js';

const changes = (count: number): string =>
  `${String(count)} ${count === 1 ? 'Änderung' : 'Änderungen'}`;

export const settings: Messages['settings'] = {
  title: 'Einstellungen',
  groups: { gym: 'Im Studio', app: 'App', account: 'Konto' },
  gyms: 'Studios',
  tour: {
    title: 'Finde dich zurecht',
    body: 'Die Einführung mit fünf Stationen jederzeit erneut ansehen.',
  },
  disclaimer:
    'Informationsinhalte, keine medizinische Beratung. Sprich mit einer Fachperson, bevor du ein Programm beginnst.',
  language: {
    title: 'Sprache',
    label: 'App-Sprache',
    hint: 'Die ganze App, Übungen eingeschlossen. Wird in deinem Konto gespeichert, damit deine anderen Geräte folgen.',
  },
  appearance: {
    title: 'Darstellung',
    dark: 'Dunkelmodus',
    darkOn: 'Ausschalten für das helle Design, bei Tageslicht leichter zu lesen.',
    darkOff: 'Aus – die App ist im hellen Design.',
  },
  training: {
    title: 'Training',
    recommendations: 'Trainingsempfehlungen',
    recommendationsOn: 'Bekomme das heutige Training und Übungsvorschläge.',
    recommendationsOff: 'Aus – wähle deine Übungen, Trainings und Routinen selbst.',
    startOptions: 'Startoptionen fürs Training anzeigen',
    startOptionsOn: 'Auf diesem Gerät eine Routine wählen oder leer starten.',
    startOptionsOff: 'Aus: Auf diesem Gerät immer mit leerem Training starten.',
  },
  units: {
    title: 'Einheiten',
    weight: 'Gewicht',
    weightDetail: 'Für jedes Gewicht in der App.',
    weightUnit: 'Gewichtseinheit',
    kilograms: 'Kilogramm',
    pounds: 'Pfund',
    note: 'Alles wird in Kilogramm gespeichert und nur in Pfund angezeigt, daher ändert ein Wechsel nie eine Zahl, die du eingetragen hast.',
  },
  plates: {
    title: 'Verfügbare Scheiben',
    yours: 'Die Scheiben deines Studios',
    detail: 'Dieselbe Liste wie unter Lernen → Scheiben. Eine Änderung hier erscheint auch dort.',
    keepOne: 'Lass mindestens eine Scheibe ausgewählt.',
  },
  rest: {
    title: 'Pausentimer',
    own: 'Eigene Pausenzeiten festlegen',
    ownOn: 'Eine Zeit für Grundübungen, eine andere für Isolationsübungen.',
    ownOff: 'Aus – jede Übung nutzt ihre eigene empfohlene Pause.',
    compound: 'Grundübungen',
    compoundHint: 'Kniebeugen, Drücken, Rudern, Kreuzheben, Klimmzüge.',
    isolation: 'Isolationsübungen',
    isolationHint: 'Curls, Seitheben, Strecken, Fliegende.',
    step: 'Minus und Plus',
    stepHint: 'Was − und + am Timer abziehen und hinzufügen.',
    stepGroup: 'Schritt des Pausentimers',
    smaller: 'Kleinerer Schritt',
    bigger: 'Größerer Schritt',
    sound: 'Ton am Ende der Pause',
    soundOn: 'Ein drei Sekunden langer Ton zusätzlich zur Vibration, solange die App offen ist.',
    soundOff: 'Aus – das Pausenende vibriert nur.',
    group: (label: string) => `Pause bei ${label}`,
    shorter: (label: string) => `Kürzere Pause bei ${label}`,
    longer: (label: string) => `Längere Pause bei ${label}`,
  },
  friends: {
    title: 'Freunde',
    didNotSave: 'Das wurde nicht gespeichert.',
    share: 'Mein Training mit Freunden teilen',
    shareOff: 'Aus: Freunde sehen deinen Namen und dass du nichts teilst.',
    shareOn: 'Deine Trainings, Bestwerte, Woche und wann du zuletzt online warst.',
    needConnection: 'Dafür brauchst du eine Verbindung.',
  },
  feedback: {
    title: 'Feedback senden',
    intro:
      'Melde einen Fehler, schlage etwas vor oder sag einfach, was dir durch den Kopf geht – es geht direkt an den Entwickler.',
    category: 'Kategorie',
    bug: 'Fehler',
    idea: 'Idee',
    other: 'Sonstiges',
    message: 'Nachricht',
    tooLong: (length: number, max: number) => `${String(length)}/${String(max)} – zu lang`,
    count: (length: number, max: number) => `${String(length)}/${String(max)}`,
    needConnection: 'Zum Senden von Feedback brauchst du eine Verbindung.',
    thanks: 'Danke – das ist beim Entwickler angekommen.',
    sending: 'Wird gesendet…',
    send: 'Feedback senden',
    sentWith:
      'Wird mit der E-Mail-Adresse deines Kontos, der App-Version und der Plattform gesendet.',
  },
  account: {
    title: 'Dein Konto',
    noProfile: 'Für dieses Konto gibt es keine Profilzeile.',
    signedIn: 'Angemeldet',
    exercises: 'Verfügbare Übungen',
    muscles: 'Muskeln am Modell',
  },
  sync: {
    title: 'Synchronisierung',
    working: ' · läuft…',
    status: 'Status',
    connected: 'Verbunden',
    connecting: 'Verbindet',
    notSetUp: 'Nicht eingerichtet',
    offline: 'Offline',
    exercises: 'Übungen auf dem Gerät',
    muscles: 'Muskeln auf dem Gerät',
    equipment: 'Ausrüstung auf dem Gerät',
    profiles: 'Deine Profilzeilen',
    workouts: 'Eingetragene Trainings',
    sets: 'Eingetragene Sätze',
    phase: {
      unconfigured:
        'Die Synchronisierung ist nicht eingerichtet. Deine Trainings sind nur auf diesem Gerät gespeichert.',
      idle: 'Nicht gestartet.',
      connecting: 'Verbindet…',
      synced: 'Auf dem Stand des Servers.',
      offline:
        'Offline. Deine Trainings sind hier gespeichert und werden synchronisiert, sobald du wieder verbunden bist.',
      offlineSince: (time: string) =>
        `Offline seit ${time}. Alles ist hier gespeichert und wird synchronisiert, sobald du wieder verbunden bist.`,
    },
    lost: (count: number, detail: string) =>
      `${changes(count)} auf diesem Gerät konnten nicht auf dem Server gespeichert werden. ${detail}`,
    refusedBug: 'Der Server hat sie abgelehnt. Das ist ein Fehler – bitte melde ihn.',
    rejected: 'Sie wurden als ungültig abgelehnt und werden nicht erneut versucht.',
    jwks: 'Der Synchronisierungsdienst hat die Anmeldung dieses Geräts abgelehnt. Seine Client Auth braucht die Supabase-JWKS-URL, um das Token zu prüfen. Alles ist weiterhin hier gespeichert.',
    refusedAccount:
      'Der Synchronisierungsdienst hat dieses Konto abgelehnt. Alles ist weiterhin auf diesem Gerät gespeichert.',
    notFound: 'Der Synchronisierungsdienst wurde unter der eingestellten Adresse nicht gefunden.',
    noRules: 'Für den Synchronisierungsdienst sind keine nutzbaren Sync-Regeln bereitgestellt.',
    couldNotConnect: (message: string) =>
      `Synchronisierung konnte keine Verbindung herstellen: ${message}`,
    uploadLost: (count: number, tables: string) =>
      `${changes(count)} konnten nicht auf dem Server gespeichert werden (${tables}) und wurden übersprungen. Alles andere wurde synchronisiert.`,
    nothingToSync: 'Nichts zu synchronisieren.',
    synced: (count: number) => `${changes(count)} synchronisiert.`,
  },
  storage: {
    title: 'Offline-Speicher',
    checking: 'Wird geprüft…',
    persistent: 'Dauerhaft',
    granted: 'Erteilt',
    refused: 'Abgelehnt',
    unsupported: 'Nicht unterstützt',
    unknown: 'Unbekannt',
    space: 'Verfügbarer Platz',
    used: 'Belegt',
    unknownSize: 'unbekannt',
    grantedDetail: 'Deine Trainings werden dauerhaft auf diesem Gerät gespeichert.',
    deniedDetail:
      'Dieses Gerät löscht deine Offline-Daten eventuell, wenn der Speicher knapp wird oder du die App eine Weile nicht öffnest. Die Anmeldung bleibt verfügbar, also geht nichts verloren, was schon synchronisiert ist.',
    unsupportedDetail: 'Dieser Browser kann keinen Offline-Speicher garantieren.',
    errorDetail: 'Der Offline-Speicher auf diesem Gerät konnte nicht geprüft werden.',
  },
  device: {
    title: 'Wo das läuft',
    shell: 'Hülle',
    platform: 'Plattform',
    pointer: 'Zeiger',
    fine: 'Fein – Hover verfügbar',
    coarse: 'Grob – nur Tippen',
    web: 'Webbrowser',
  },
  data: {
    title: 'Deine Daten',
    intro:
      'Alles, was du eingetragen hast – Trainings, Sätze, Rekorde, Wiegungen, Ziele und dein Profil – als eine Datei, die du behalten oder in einer anderen App öffnen kannst. Sie wird auf diesem Handy erstellt und funktioniert daher auch offline.',
    failed:
      'Die Datei konnte nicht erstellt werden. Nichts wurde geändert – versuche es gleich noch einmal.',
    preparing: 'Deine Datei wird vorbereitet…',
    download: 'Deine Daten herunterladen',
    empty:
      'Noch nichts eingetragen, daher enthält die Datei dein Profil und deine Antworten auf die Begrüßungsfragen.',
    holds: (parts: string) => `Sie enthält ${parts}.`,
    workouts: (count: string, n: number) => `${count} ${n === 1 ? 'Training' : 'Trainings'}`,
    sets: (count: string, n: number) => `${count} ${n === 1 ? 'Satz' : 'Sätze'}`,
    weighIns: (count: string, n: number) => `${count} ${n === 1 ? 'Wiegung' : 'Wiegungen'}`,
    notSynced:
      'Dieses Gerät hat deinen Verlauf noch nicht vollständig heruntergeladen, daher fehlen eventuell ältere Trainings. Verbinde dich, warte bis die Synchronisierung fertig ist, und lade erneut herunter.',
    noFriends:
      'Dein Freundescode und deine Freundesliste brauchen eine Verbindung und wurden daher weggelassen.',
  },
  deletion: {
    title: 'Konto löschen',
    intro:
      'Löscht dein Konto und alles darin – jedes Training, jeden Satz, Rekord, jede Wiegung und jedes Ziel – vom Server und von diesem Handy. Das lässt sich nicht rückgängig machen. Wenn du eine Kopie willst, lade zuerst deine Daten herunter.',
    open: 'Mein Konto löschen…',
    word: 'LÖSCHEN',
    typeToConfirm: (word: string) => `Gib ${word} ein, um zu bestätigen`,
    needConnection:
      'Du brauchst eine Verbindung. Dein Konto wird auf dem Server gelöscht, nicht nur auf diesem Handy.',
    deleting: 'Wird gelöscht…',
    confirm: 'Mein Konto endgültig löschen',
    keep: 'Mein Konto behalten',
    unreachable:
      'Der Server war nicht erreichbar, daher wurde nichts gelöscht. Dein Konto muss dort gelöscht werden, nicht nur auf diesem Gerät – versuche es mit Verbindung erneut.',
    expired:
      'Deine Sitzung ist abgelaufen, daher wurde nichts gelöscht. Melde dich ab und wieder an und versuche es erneut.',
    failed: (message: string) => `Nichts wurde gelöscht: ${message}`,
    deleted:
      'Dein Konto wurde gelöscht, zusammen mit allem darin, vom Server und von diesem Gerät.',
  },
  gymSettings: {
    multiple: 'Ich trainiere in mehr als einem Studio',
    multipleOn: 'Jedes Training wird mit dem Studio gespeichert, in dem es war.',
    multipleOff: 'Aus: Trainings sind an kein Studio gebunden.',
    first: 'Das Studio, in dem du bisher trainiert hast',
    firstHint: 'Jedes Training, das du schon eingetragen hast, wird diesem Studio zugeordnet.',
    saveGym: 'Studio speichern',
    yours: 'Deine Studios',
    add: 'Studio hinzufügen',
    addHint:
      'Füge das andere Studio hinzu, in das du gehst. Beim Starten eines Trainings wirst du dann gefragt, welches.',
    addAction: 'Studio hinzufügen',
    rename: (name: string) => `${name} umbenennen`,
    remove: (name: string) => `${name} entfernen`,
    confirmRemove: (name: string) =>
      `${name} entfernen? Trainings dort behalten den Namen, und es wird beim Starten nicht mehr angeboten.`,
    tooLong: (max: number) => `Halte den Namen bei höchstens ${String(max)} Zeichen.`,
  },
};
