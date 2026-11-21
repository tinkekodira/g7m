import type { Messages } from '../en/index.js';

export const profile: Messages['profile'] = {
  title: 'Dein Profil',
  edit: 'Bearbeiten',
  you: 'Du',
  loading: 'Dein Profil wird geladen…',
  addName: 'Namen hinzufügen',
  numbers: 'Deine Werte',
  addWeight: 'Gewicht hinzufügen',
  logWeight: (value: string) => `Gewicht ${value}. Heutiges Gewicht eintragen`,
  notSet: 'Nicht festgelegt – hinzufügen',
  bestLiftsDescription:
    'Das Schwerste, was du bei jeder Übung bewegt hast. Bei Körpergewichtsübungen zählt dein Körpergewicht mit.',
  disclaimer:
    'Informationsinhalte, keine medizinische Beratung. Diese Werte formen einen Trainingsplan, mehr nicht.',
  achievementsLine: 'Meilensteine aus deinem Training',
  toEarn: (total: number) => `${String(total)} zu verdienen. Dein erstes Training ist der erste.`,
  earnedOf: (earned: number, total: number) => `${String(earned)} von ${String(total)} verdient`,
  achievements: 'Erfolge',
  loadingLevel: 'Dein Level wird geladen…',
  level: 'Level',
  levelLabel: (level: number, into: string, of: string) =>
    `Level ${String(level)}: ${into} von ${of} XP bis Level ${String(level + 1)}`,
  routines: 'Deine Routinen',
  routinesEmpty: 'Trainings, die du gespeichert hast',
  routinesNone: 'Speichere ein Training, dann wird eine daraus',
  loadingGoal: 'Dein Ziel wird geladen…',
  yourGoal: 'Dein Ziel',
  chooseGoal: 'Wähle, wofür du trainierst',
  goalDecides: 'Es bestimmt das Training, das die Startseite für dich schreibt.',
  choose: 'Wählen',
  change: 'Ändern',
  training: 'Dein Training',
  trainingSubtitle: (weeks: number) => `Die letzten ${String(weeks)} Wochen, auf deinem Körper.`,
  workingOut: 'Wird berechnet, was du trainiert hast…',
  trainingEmpty: (weeks: number) =>
    `In den letzten ${String(weeks)} Wochen noch nichts eingetragen. Schließe ein Training ab, dann erscheint es hier.`,
  worthAdding: 'Lohnt sich zu ergänzen',
  lookingAtWeek: 'Deine Woche wird angesehen…',
  afterWorkouts: (sessions: number) =>
    `Nach ${String(sessions)} Trainings steht hier, was zurückfällt, und je eine Übung dafür.`,
  nothingBehind: 'Gerade liegt nichts hinter seinem Wochenziel.',
  behind: (group: string, sets: number) => `${group} · ${String(sets)} Sätze im Rückstand`,
  views: { front: 'Vorne', back: 'Hinten' },
  less: 'Weniger',
  more: 'Mehr',
  trainedMost: 'Am meisten trainiert',
  personalRecords: 'Persönliche Rekorde',
  bestLifts: 'Bestwerte',
  exercises: (count: number) => (count === 1 ? 'Übung' : 'Übungen'),
  loadingBests: 'Bestwerte werden geladen…',
  nothingMeasurable: 'Noch nichts Messbares.',
  showFewer: 'Weniger anzeigen',
  showAll: (count: number) => `Alle ${String(count)} anzeigen`,
  tiles: {
    weight: 'Gewicht',
    height: 'Größe',
    age: 'Alter',
    activity: 'Außerhalb des Studios',
    sex: 'Geschlecht',
    bmi: 'BMI',
  },
  bands: {
    below: 'Unter dem Bereich',
    healthy: 'Gesund',
    above: 'Über dem Bereich',
    well_above: 'Deutlich darüber',
  },
  bmiStandard:
    'Das ist der Standardbereich. Gib dein Alter und deine Trainingstage pro Woche an, dann wird er auf deinen Körper abgestimmt.',
  bmiAdjusted:
    'Dein Bereich richtet sich nach Alter, Geschlecht und Trainingsumfang. Der einfache BMI zählt Muskeln als Übergewicht, daher ist 18,5–25 der falsche Bereich für jemanden, der Krafttraining macht.',
  unknownExercise: 'Unbekannte Übung',
  goalLine: (days: number, date: string) =>
    `${String(days)} ${days === 1 ? 'Tag' : 'Tage'} pro Woche · seit ${date}`,
  editProblems: {
    weight: 'Gib ein Gewicht ein.',
    range: 'Das liegt außerhalb des Bereichs, der gespeichert werden kann.',
    height: (unit: string) => `Gib eine Größe in ${unit} ein.`,
    born: (min: number, max: number) =>
      `Gib dein Geburtsdatum ein. Zwischen ${String(min)} und ${String(max)}.`,
  },
  country: { label: 'Woher kommst du?', ratherNot: 'Keine Angabe' },
  goalChoicesHint: 'Wähle alles Zutreffende.',
  weighIn: {
    title: 'Gewicht eintragen',
    first: 'Der erste Punkt deines Verlaufs.',
    last: (weight: string, when: string) => `Zuletzt ${weight} · ${when}`,
    today: (unit: string) => `Heutiges Gewicht (${unit})`,
    save: 'Gewicht speichern',
  },
  challengeRecord: {
    title: 'Herausforderungsbilanz',
    wins: (count: string) => `${count} Siege`,
    losses: (count: string) => `${count} Niederlagen`,
    draws: (count: string) => `${count} Unentschieden`,
    offline: 'Verbinde dich, um deine Herausforderungsbilanz zu laden.',
    unavailable: 'Herausforderungsbilanz nicht verfügbar. Wird automatisch erneut versucht.',
    loading: 'Herausforderungsbilanz wird geladen…',
  },
  metrics: {
    title: 'Profil bearbeiten',
    intro: 'Woraus dein Plan gebaut wird. Nichts davon wird geteilt.',
    weight: 'Gewicht',
    chartSummary: (weeks: number, readings: number) =>
      `Gewicht in den letzten ${String(weeks)} Wochen, ${String(readings)} Messungen.`,
    aboutYou: 'Über dich',
    yourName: 'Dein Name',
    nameHint: 'Damit begrüßt dich die Startseite, und das sehen deine Freunde.',
    height: (unit: string) => `Größe (${unit})`,
    dateOfBirth: 'Geburtsdatum',
    youAre: (age: number) => `Du bist ${String(age)}`,
    whereFrom: 'Woher du kommst',
    countryHint: 'Deine Flagge im Profil und ein Hallo in deiner Sprache auf der Startseite.',
    sex: 'Geschlecht',
    sexHint:
      'Damit nennen wir realistische Raten für Zu- und Abnahme. Es ändert nie, wie viel Training du bekommst.',
    setAtSignup: 'Bei der Registrierung festgelegt',
    saved: 'Gespeichert',
    saveChanges: 'Änderungen speichern',
    outside: 'Außerhalb des Studios',
    outsideHint:
      'Deine durchschnittliche Woche abseits des Trainings. Trainings werden aus deinem Protokoll gezählt.',
    outsideLabel: 'Deine Woche außerhalb des Studios',
    readings: 'Letzte Messungen',
    readingsHint:
      'Hier wird nichts überschrieben. Entferne eine Messung nur, wenn sie falsch eingegeben wurde: Eine entfernte hinterlässt eine Lücke im Verlauf.',
    remove: (line: string, when: string) => `${line} entfernen, ${when}`,
    fat: (percent: string) => `${percent} % Fett`,
  },
  prompt: {
    addWeight: 'Gewicht hinzufügen',
    addWeightBody:
      'Es bestimmt die Last bei Klimmzügen und Dips und ist der erste Punkt deines Verlaufs.',
    due: 'Zeit fürs Wiegen',
    dueBody: (days: string) =>
      `Es ist ${days} her. Einmal pro Woche reicht, um einen Trend zu sehen.`,
    overdue: 'Dein Verlauf ist still geworden',
    overdueBody: (days: string) =>
      `Das letzte Gewicht hier ist ${days} alt. Eine Messung bringt ihn zurück.`,
    lessThanDay: 'weniger als ein Tag',
    aDay: 'ein Tag',
    days: (days: number) => `${String(days)} Tage`,
    aWeek: 'eine Woche',
    weeks: (weeks: number) => `${String(weeks)} Wochen`,
    holding: (span: string) => `Stabil über ${span}.`,
    tooSoon: (down: boolean, size: string, span: string) =>
      `${down ? 'Minus' : 'Plus'} ${size} über ${span} – zu früh für eine Rate.`,
    rate: (down: boolean, size: string, span: string, rate: string) =>
      `${down ? 'Minus' : 'Plus'} ${size} über ${span} – etwa ${rate} pro Woche.`,
  },
  goal: {
    chooseOne: 'Wähle mindestens ein Trainingsziel.',
    title: 'Dein Ziel',
    intro: 'Wofür das Training ist. Du kannst es ändern, wann immer du willst.',
    profile: 'Profil',
    you: 'Du',
    basedOn: 'Auf Grundlage dessen, was du zuletzt gemacht hast',
    daysAWeek: 'Tage pro Woche',
    daysHint:
      'Wie oft du realistisch trainieren kannst. Antworte für eine schlechte Woche, nicht für eine gute – der Plan wird genau darauf zugeschnitten.',
    daysLabel: 'Trainingstage pro Woche',
    chooseGoals: 'Wähle deine Ziele',
    changeGoals: 'Ändere deine Ziele',
    save: 'Ziele speichern',
    trainingFor: 'Trainingsziel',
    daysPerWeek: (days: number) => `${String(days)} ${days === 1 ? 'Tag' : 'Tage'} pro Woche`,
    before: 'Davor',
    kept: 'Aufbewahrt, weil die Dauer zählt, wenn es darum geht, ob etwas funktioniert hat.',
    spanDays: (days: number) => `${String(days)} Tage`,
    spanWeeks: (weeks: number) => `${String(weeks)} Wochen`,
    startedToday: 'heute begonnen',
    oneDayIn: 'seit einem Tag',
    daysIn: (days: number) => `seit ${String(days)} Tagen`,
    weeksIn: (weeks: number) => `seit ${String(weeks)} Wochen`,
  },
  plan: {
    noLimit: 'Kein Limit',
    title: 'Heutige Einheit',
    builtFor: (goal: string, days: number) =>
      `Gebaut für „${goal}“, ${String(days)} Tage pro Woche.`,
    working: 'Deine Einheit wird erstellt…',
    timeToday: 'Zeit heute (Minuten)',
    timeLabel: 'Zeit heute',
    paired: (minutes: number, estimate: number) =>
      `Paarweise kombiniert für ${String(minutes)} Min. – etwa ${String(estimate)} Min.`,
    about: (estimate: number) => `Etwa ${String(estimate)} Min.`,
    leftOut: (items: string) => `Weggelassen, damit es in die Zeit passt: ${items}.`,
    resting: (groups: string) =>
      `Pause empfohlen für ${groups} – in den letzten 7 Tagen schon abgedeckt.`,
    superset: 'Supersatz',
    supersetRest: 'Supersatz · Pause nach jeder Runde',
    start: 'Dieses Training starten',
    startingPoint:
      'Jede Zahl hier ist ein Ausgangspunkt. Ändere, was du willst, sobald du drin bist – das Protokoll weiß nicht, dass ein Generator sie geschrieben hat.',
    swapTo: (name: string) => `Zu ${name} wechseln`,
    swap: 'tauschen',
    findWeight: 'Finde dein Gewicht',
    rest: (group: string, rest: string) => `${group} · ${rest} Pause`,
    reasons: {
      progress: (from: string) =>
        `Letztes Mal hast du den Bereich mit ${from} geschafft – steiger dich.`,
      jump: (from: string, reps: number) =>
        `Du hast den Bereich mit ${from} und ${String(reps)} Wdh. Reserve geschafft. Das ist ein größerer Schritt als sonst.`,
      deload: (misses: number, from: string) =>
        `${String(misses)} Einheiten unter dem Bereich mit ${from}. Geh zurück und lauf dann neu an.`,
      repeat: (reps: number, kg: string) =>
        `Letztes Mal ${String(reps)} mit ${kg}. Gleiches Gewicht, mehr Wiederholungen.`,
      returning: (days: number, from: string) =>
        `Es ist ${String(days)} Tage her. Start unter deinen ${from}, um wieder reinzukommen.`,
      firstTime:
        'Zum ersten Mal hier – nimm etwas, mit dem du noch zwei, drei Wiederholungen mehr schaffen würdest.',
    },
    noGoalTitle: 'Wähle zuerst ein Ziel',
    noGoalBody:
      'Die Einheit baut darauf auf, wofür du trainierst und wie viele Tage pro Woche du hast. Das dauert etwa zehn Sekunden.',
    chooseGoal: 'Ziel wählen',
    weekDone: 'Deine Woche ist geschafft',
    weekDoneBody: (rested: string) =>
      `Alles, was diese Einheit fordern würde, hatte seine Sätze schon: ${rested}. Eine weitere Einheit kostet jetzt mehr Erholung, als sie bringt.`,
    trainAnyway: 'Trotzdem trainieren',
  },
  routinesScreen: {
    title: 'Deine Routinen',
    finishOpen: 'Beende das offene Training, bevor du eine Routine startest.',
    openIt: 'Öffnen',
    nameRoutine: 'Routine benennen',
    name: 'Name',
    placeholder: 'Drücktag',
    create: 'Erstellen',
    build: '+ Routine von Grund auf erstellen',
    remembers:
      'Eine Routine merkt sich die Übungen und Wiederholungsbereiche, nicht die Gewichte. Die kommen aus dem, was du zuletzt bewegt hast, daher veraltet eine Routine nie.',
    exercises: (count: number) => (count === 1 ? '1 Übung' : `${String(count)} Übungen`),
    start: (name: string) => `${name} starten`,
    nothingSaved: 'Noch nichts gespeichert',
    nothingSavedBody:
      'Beende ein Training, dann kannst du es als Routine behalten – das ist der einfachste Weg, weil du sie gerade gebaut hast. Du kannst auch unten mit einer leeren beginnen oder jedes vergangene Training auf seiner Seite unter Fortschritt speichern.',
  },
  routine: {
    confirmDelete:
      'Diese Routine löschen? Die Trainings, die du damit gemacht hast, bleiben erhalten.',
    notOnDevice:
      'Diese Routine ist nicht auf diesem Gerät. Vielleicht wurde sie gelöscht oder noch nicht synchronisiert.',
    routines: 'Routinen',
    rename: 'Umbenennen',
    empty:
      'Noch leer. Füge die gewünschten Übungen hinzu, dann werden sie in jedes Training übernommen, das du damit startest.',
    superset: 'Supersatz',
    supersetLabel: (label: string) => `${label} · Supersatz`,
    ungroup: 'Auflösen',
    moveSupersetUp: 'Supersatz nach oben',
    moveSupersetDown: 'Supersatz nach unten',
    addExercise: '+ Übung hinzufügen',
    delete: 'Diese Routine löschen',
    deleteHint:
      'Die Trainings, die du damit schon gemacht hast, bleiben – sie haben stattgefunden.',
    moveUp: (name: string) => `${name} nach oben`,
    moveDown: (name: string) => `${name} nach unten`,
    remove: (name: string) => `${name} entfernen`,
  },
  data: {
    readFailed: 'Die Kopie deiner Daten auf diesem Gerät konnte nicht gelesen werden.',
    saveFailed: 'Das wurde nicht gespeichert. Versuche es erneut – noch wurde nichts gesendet.',
    saveFailedShort: 'Das wurde nicht gespeichert. Versuche es erneut.',
    routineGone: 'Diese Routine ist nicht mehr verfügbar oder hat keine Übungen.',
    recommendationsOff: 'Trainingsempfehlungen sind ausgeschaltet.',
    somethingWrong: 'Etwas ist schiefgelaufen. Versuche es erneut.',
  },
};
