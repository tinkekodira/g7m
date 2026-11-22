import type { Messages } from '../en/index.js';

const plural = (count: number, one: string, many: string): string =>
  `${String(count)} ${count === 1 ? one : many}`;

export const workout: Messages['workout'] = {
  notOnDevice: 'Dieses Training ist nicht auf diesem Gerät.',
  progress: 'Fortschritt',
  editingClosed: 'Bearbeitung geschlossen',
  editWindow: 'Trainings können bis 2 Stunden nach dem Abschluss bearbeitet werden.',
  details: 'Trainingsdetails',
  boutRemoved: 'Einheit entfernt.',
  titleEdit: 'Training bearbeiten',
  titlePast: 'Vergangenes Training',
  title: 'Training',
  elapsed: 'vergangen',
  lifted: (weight: string) => `${weight} bewegt`,
  calendar: 'Kalender',
  editingHint:
    'Speichere jeden geänderten Satz mit „Speichern“ oder dem Haken. Die Bearbeitung schließt 2 Stunden nach dem Abschluss.',
  uncounted: (sets: number) =>
    `${sets === 1 ? 'Ein Satz wird' : `${String(sets)} Sätze werden`} nicht in der Summe gezählt – sie brauchen ein Körpergewicht als Maßstab.`,
  addExercise: '+ Übung hinzufügen',
  doneEditing: 'Bearbeitung fertig',
  finish: 'Training beenden',
  confirmDiscard: 'Dieses Training und alles darin Eingetragene verwerfen?',
  discard: 'Verwerfen',
  removeTitle: (name: string | null) => `${name ?? 'Diese Übung'} entfernen?`,
  exercise: 'Übung',
  removal: {
    nothing: 'Dafür ist noch nichts eingetragen.',
    one: (bout: boolean) =>
      `${bout ? 'Die eingetragene Einheit' : 'Der eingetragene Satz'} wird mit entfernt.`,
    many: (count: number, bout: boolean) =>
      `Die ${String(count)} eingetragenen ${bout ? 'Einheiten' : 'Sätze'} werden mit entfernt.`,
  },
  removed: {
    drop: 'Drop entfernt.',
    set: 'Satz entfernt.',
    setWithDrops: (drops: number) =>
      `Satz entfernt, mit ${String(drops)} ${drops === 1 ? 'Drop' : 'Drops'}.`,
    exercise: (name: string) => `${name} entfernt.`,
    exerciseWithSets: (name: string, sets: number) =>
      `${name} entfernt, mit ${String(sets)} ${sets === 1 ? 'Satz' : 'Sätzen'}.`,
  },
  superset: {
    label: 'Supersatz',
    heading: (count: number) => `Supersatz · ${String(count)} Übungen`,
    ungroup: 'Auflösen',
    addRound: 'Runde hinzufügen',
  },
  summary: {
    label: 'Trainingsübersicht',
    elapsed: (hours: number, minutes: number, seconds: number) =>
      `${String(hours)} ${hours === 1 ? 'Stunde' : 'Stunden'} ${String(minutes)} Minuten ${String(seconds)} Sekunden vergangen`,
    completedSets: 'Abgeschlossene Arbeitssätze: ',
    sets: (count: number) => `${String(count)} ${count === 1 ? 'Satz' : 'Sätze'}`,
  },
  start: {
    title: 'Training',
    nothing:
      'Nichts läuft. Starte ein Training und füge unterwegs Übungen hinzu – alles wird beim Tippen sofort auf diesem Handy gespeichert, ob mit oder ohne Empfang.',
    button: 'Training starten',
  },
  bodyweight: {
    title: 'Wie viel wiegst du?',
    body: 'Bei einem Klimmzug bewegst du dein eigenes Körpergewicht. Ohne diese Zahl lassen sich diese Sätze eintragen, aber nicht messen, also würden sie nirgends zählen.',
    label: (unit: string) => `Körpergewicht (${unit})`,
  },
  unknownExercise: 'Unbekannte Übung',
  thatLift: 'diese Übung',
  elsewhere: (gym: string | null, set: string) =>
    `Zum ersten Mal an diesem Gerät hier. Letztes Mal ${gym === null ? 'woanders' : `im ${gym}`}: ${set}.`,
  noSets: 'Noch keine Sätze.',
  advice: (reps: number, weight: string, next: string) =>
    `${String(reps)} Wdh. mit ${weight} – nächstes Mal ${next} versuchen`,
  warmUp: 'Aufwärmen',
  addSet: 'Satz hinzufügen',
  ramp: (count: number, from: string, to: string) =>
    `Fügt ${String(count)} ${count === 1 ? 'Satz' : 'Sätze'} von ${from} bis ${to} hinzu`,
  effort: {
    question: 'Beim letzten Satz – wie viele hättest du noch geschafft?',
    none: 'Keine',
  },
  set: {
    deleteRow: (title: string) => `${title} löschen`,
    dropAfter: (title: string) => `Drop nach ${title}`,
    drop: 'Drop',
    last: (set: string) => `Zuletzt: ${set}`,
    load: (title: string) => `Last bei ${title}`,
    bodyweight: 'Körpergewicht',
    addedWeight: 'Zusatzgewicht',
    durationFormat: (title: string) => `Format der Dauer bei ${title}`,
    seconds: 'Sekunden',
    minSec: 'Min. + Sek.',
    minutes: 'Minuten',
    reps: 'Wdh.',
    saveRow: (title: string) => `${title} speichern`,
    markSkipped: 'Als übersprungen markieren',
    needsReps: 'Gib mindestens 1 Wiederholung ein, um den Satz abzuhaken.',
    needsTime: 'Gib mindestens 1 Sekunde ein, um den Satz abzuhaken.',
  },
  check: {
    title: 'Stimmt das?',
    jump: (weight: string, best: string) =>
      `${weight} liegt weit über deiner Bestleistung von ${best}. Gespeichert wird es zu einem persönlichen Rekord.`,
    heavy: (weight: string) =>
      `${weight} hebt kaum jemand. Gespeichert wird es zu einem persönlichen Rekord.`,
    reps: (reps: number) =>
      `${String(reps)} Wiederholungen in einem Satz sind sehr viele. Prüf die Zahl, bevor sie zählt.`,
    confirm: 'Speichern',
    fix: 'Korrigieren',
  },
  rows: {
    warmup: (number: number) => `Aufwärmsatz ${String(number)}`,
    set: (number: number) => `Satz ${String(number)}`,
    drop: 'Drop',
    dropNumbered: (number: number) => `Drop ${String(number)}`,
    tickWarmup: (done: boolean, number: number) =>
      `Aufwärmsatz ${String(number)} ${done ? 'rückgängig machen' : 'abschließen'}`,
    tickDrop: (done: boolean, number: number, parent: number) =>
      `Drop ${String(number)} von Satz ${String(parent)} ${done ? 'rückgängig machen' : 'abschließen'}`,
    tickSet: (done: boolean, number: number) =>
      `Satz ${String(number)} ${done ? 'rückgängig machen' : 'abschließen'}`,
  },
  stillTraining: {
    title: 'Trainierst du noch?',
    idle: (minutes: number) =>
      `Seit ${String(minutes)} ${minutes === 1 ? 'Minute' : 'Minuten'} nichts abgehakt.`,
    keepGoing: 'Weitermachen',
    finish: 'Beenden',
  },
  rest: {
    over: 'Pause vorbei',
    resting: 'Pause',
    less: (label: string) => `${label} weniger Pause`,
    more: (label: string) => `${label} mehr Pause`,
    dismiss: 'Schließen',
  },
  record: {
    badge: 'PR',
    heaviestShort: 'Schwerster bisher',
    heaviest: (name: string) => `${name}: schwerster Satz bisher`,
    heaviestDetail: (now: string, gain: string, unit: string) =>
      `${now} ${unit} – ${gain} ${unit} über deinem alten Bestwert.`,
    bestShort: 'Bester Satz bisher',
    best: (name: string) => `${name}: bester Satz bisher`,
    bestDetail: (now: string, before: string, unit: string, beforeUnit: string) =>
      `Geschätztes Maximum ${now} ${unit}, vorher ${before} ${beforeUnit}.`,
  },
  open: {
    past: 'Trag dein vergangenes Training fertig ein',
    stale: 'Du hast ein Training offen gelassen',
    continue: 'Training fortsetzen',
    exercises: (count: number) => plural(count, 'Übung', 'Übungen'),
    setsDone: (count: number) => `${plural(count, 'Satz', 'Sätze')} erledigt`,
    justStarted: 'gerade begonnen',
    openFor: (hours: number) => `seit ${plural(hours, 'Stunde', 'Stunden')} offen`,
    minutesIn: (minutes: number) => `seit ${String(minutes)} Min.`,
    hoursIn: (hours: number, minutes: number) =>
      `seit ${String(hours)} Std. ${String(minutes)} Min.`,
  },
  autoFinish: {
    title: 'Wir haben dein Training beendet',
    closed: (when: string) =>
      `Eine Weile wurde nichts abgehakt, daher wurde dein Training von ${when} für dich geschlossen.`,
    closedAt: (when: string, at: string) =>
      `Eine Weile wurde nichts abgehakt, daher wurde dein Training von ${when} bei deinem letzten Satz um ${at} geschlossen.`,
    allSaved: 'Alles, was du eingetragen hast, ist gespeichert.',
    saved: (parts: string) => `Gespeichert: ${parts}.`,
    exercises: (count: number) => plural(count, 'Übung', 'Übungen'),
    sets: (count: number) => plural(count, 'Satz', 'Sätze'),
    bouts: (count: number) => plural(count, 'Einheit', 'Einheiten'),
    minutes: (minutes: number) => `${String(minutes)} Min.`,
    okay: 'Okay',
    see: 'Ansehen',
  },
  cardio: {
    label: 'Cardio',
    needsBodyweight:
      'Für Kalorien braucht es dein Körpergewicht. Trag es in deinem Profil ein, dann werden sie berechnet.',
    noBouts: 'Noch keine Einheiten. Füge eine hinzu, wenn du loslegst.',
    addBout: 'Einheit hinzufügen',
    timeFormat: 'Zeit in Minuten oder Minuten:Sekunden wie 25:30.',
    notANumber: (field: string) => `${field} ist keine Zahl.`,
    bout: (number: number) => `Einheit ${String(number)}`,
    boutLabel: (number: number) => `Einheit ${String(number)}`,
    time: 'Zeit',
    start: 'Start',
    stop: 'Stopp',
    calories: 'Kalorien',
    fromMachine: 'Vom Gerät. Leere das Feld, um die Schätzung zu nutzen.',
    addTime: 'Gib die Zeit ein, um sie zu schätzen, oder trag ein, was das Gerät anzeigt.',
    estimate: (calories: string, source: string) =>
      `${calories}. ${source} Gib den Wert des Geräts ein, um ihn stattdessen zu nutzen.`,
    undo: (label: string) => `${label} rückgängig machen`,
    complete: (label: string) => `${label} abschließen`,
    saveWithoutTicking: 'Speichern ohne abzuhaken',
    fields: {
      distance: (unit: string) => `Strecke (${unit})`,
      speed: (unit: string) => `Tempo (${unit})`,
      incline: 'Steigung (%)',
      level: 'Stufe',
      watts: 'Ø Watt',
      floors: 'Stockwerke',
    },
    sources: {
      machine: 'Vom Gerät.',
      treadmill: 'Geschätzt aus Tempo und Steigung.',
      power: 'Geschätzt aus den Watt.',
      pace: 'Geschätzt aus deinem Tempo.',
      stairs: 'Geschätzt aus den gestiegenen Stockwerken.',
      met: (better: string) => `Eine grobe Schätzung allein aus der Zeit. ${better}`,
    },
    better: {
      treadmill: 'Gib das Tempo ein für eine bessere.',
      bike: 'Gib die Watt ein für eine bessere.',
      rower: 'Gib Strecke oder Watt ein für eine bessere.',
      ski_erg: 'Gib Strecke oder Watt ein für eine bessere.',
      stair_climber: 'Gib die Stockwerke ein für eine bessere.',
    },
    floors: (count: number) => `${String(count)} Stockwerke`,
    nothing: 'Nichts erfasst',
  },
  gym: {
    change: (name: string | null) => `${name ?? 'Kein Studio gewählt'}, Studio ändern`,
    choose: 'Studio wählen',
    where: 'Wo trainierst du?',
    which: 'Welches Studio',
    compared:
      'Geräte und Kabelzüge werden mit ihrem eigenen Verlauf im jeweiligen Studio verglichen. Sätze, die du noch nicht gemacht hast, übernehmen die Werte des neuen Studios.',
    manage: 'Studios verwalten',
  },
  startDialog: {
    title: 'Training starten',
    routines: 'Deine Routinen',
    chooseRoutine: 'Routine wählen',
    loading: 'Routinen werden geladen…',
    none: 'Noch keine Routinen. Beende ein Training und speichere es als Routine, um es hier nächstes Mal zu nutzen.',
    settingUp: 'Wird vorbereitet…',
    blank: 'Leeres Training starten',
    dontShow: 'Nicht mehr anzeigen',
    dontShowHint: 'Immer mit leerem Training starten. Änderbar in den Einstellungen.',
    saved: 'Gespeicherte Routinen',
    page: (index: number, total: number) => `Routinenseite ${String(index)} von ${String(total)}`,
    start: (name: string) => `${name} starten`,
    choosePage: 'Routinenseite wählen',
    showPage: (index: number, total: number) =>
      `Routinenseite ${String(index)} von ${String(total)} anzeigen`,
  },
  plates: {
    loaded: (plates: string) => `Eine Stange mit ${plates} auf jeder Seite`,
    empty: (bar: string, unit: string) => `Eine leere ${bar}-${unit}-Stange`,
    bar: (weight: string, unit: string) => `${weight}-${unit}-Stange`,
    lighter: (bar: string) => `Leichter als eine ${bar}`,
    just: (bar: string) => `Nur die ${bar}`,
    eachSide: 'Pro Seite',
  },
  previousSet: {
    seconds: (reps: number) => `${String(reps)} s`,
    reps: (reps: number) => `${String(reps)} Wdh.`,
  },
};
