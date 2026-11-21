import type { Messages } from '../en/index.js';

type Region = 'legs' | 'arms' | 'shoulders' | 'back' | 'chest' | 'core';

const plural = (count: number, one: string, many: string): string =>
  `${String(count)} ${count === 1 ? one : many}`;

const REGION: Record<Region, string> = {
  legs: 'Beine',
  arms: 'Arme',
  shoulders: 'Schultern',
  back: 'Rücken',
  chest: 'Brust',
  core: 'Rumpf',
};

export const home: Messages['home'] = {
  yourProfile: 'Dein Profil',
  thisMonth: 'Dieser Monat',
  quickAccess: 'Schnellzugriff',
  stillOpen: 'Noch offen',
  inProgress: 'Läuft',
  openIt: 'Öffnen',
  today: {
    label: 'Heutiges Training',
    noGoalTitle: 'Lass dir einen Plan erstellen',
    noGoalBody:
      'Wähle ein Ziel und wie viele Tage du trainierst. Das dauert etwa zehn Sekunden, und jede Einheit danach baut auf dem auf, was du einträgst.',
    chooseGoal: 'Ziel wählen',
    working: 'Das heutige Training wird erstellt…',
    minutes: (minutes: number) => `${String(minutes)} Min.`,
    sets: (sets: number) => `${String(sets)} ${sets === 1 ? 'Satz' : 'Sätze'}`,
    doneTitle: 'Für heute erledigt',
    trainedToday: (parts: string) => `Heute trainiert · ${parts}`,
    doneBody:
      'In der Pause wird aus der heutigen Arbeit Fortschritt. Das Training von morgen baut darauf auf.',
    settingUp: 'Wird vorbereitet…',
    trainAgain: 'Nochmal trainieren',
    weekTitle: 'Deine Woche ist geschafft',
    weekBody:
      'Alles, was das heutige Training fordern würde, hat seine Sätze in den letzten sieben Tagen bekommen. Eine weitere Einheit kostet jetzt mehr Erholung, als sie bringt.',
    trainAnyway: 'Trotzdem trainieren',
    summary: (exercises: number, sets: number) =>
      `${String(exercises)} Übungen · ${String(sets)} Sätze`,
    about: (minutes: number) => ` · etwa ${String(minutes)} Min.`,
    muscleGroups: 'Muskelgruppen',
    start: 'Training starten',
    seePlan: 'Plan ansehen',
  },
  tiles: {
    plan: 'Heutiger Plan',
    planDetail: 'Was die App vorschlägt',
    continue: 'Training fortsetzen',
    start: 'Training starten',
    continueDetail: 'Zurück zu deiner Einheit',
    startDetail: 'Routine wählen oder leer starten',
    calendar: 'Kalender',
    calendarDetail: 'Die Tage, an denen du trainiert hast',
    browse: 'Übungen durchsuchen',
    browseDetail: 'Die ganze Bibliothek',
    progress: 'Fortschritt',
    progressDetail: 'Wie dein Training läuft',
  },
  sync: {
    lost: 'Einige Änderungen haben den Server nicht erreicht',
    stopped: 'Die Synchronisierung ist angehalten',
    lostDetail: 'Sie sind auf diesem Handy, werden aber nicht synchronisiert.',
    stoppedDetail: 'Alles ist weiterhin auf diesem Handy gespeichert.',
    see: 'Ansehen, was passiert ist',
  },
  cards: {
    records: 'Persönliche Rekorde',
    workouts: 'Trainings',
    muscles: 'Muskelgruppen',
    activity: 'Kraft und Aktivität',
    slide: (name: string, position: number, total: number) =>
      `${name}, ${String(position)} von ${String(total)}`,
    workoutsLabel: (total: number, heading: string, detail: string) =>
      `Trainings diesen Monat: ${String(total)} abgeschlossen. ${heading}. ${detail}`,
    yourWorkouts: 'Deine Trainings',
    completed: 'abgeschlossen',
    workoutsSummary: (total: number, current: string, previous: number, previousName: string) =>
      `${String(total)} Trainings im ${current} bisher, gegenüber ${String(previous)} bis zu diesem Tag im ${previousName}.`,
    musclesLabel: (sets: number, groups: number, heading: string, detail: string) =>
      `Muskelgruppen diesen Monat: ${String(sets)} ${sets === 1 ? 'Satz' : 'Sätze'} in ${String(groups)} ${groups === 1 ? 'Gruppe' : 'Gruppen'}. ${heading}. ${detail}`,
    groups: (count: number) => (count === 1 ? 'Gruppe' : 'Gruppen'),
    setsWord: (count: number) => (count === 1 ? 'Satz' : 'Sätze'),
    noSets: 'Diesen Monat noch keine Sätze.',
    activityLabel: (
      workouts: number,
      time: string,
      perWeek: string,
      lifted: string,
      range: string,
      heading: string,
      detail: string,
    ) =>
      `Kraft und Aktivität diesen Monat: ${String(workouts)} ${workouts === 1 ? 'Training' : 'Trainings'}, ${time} Training, ${perWeek} pro Woche, ${lifted} bewegt. Im Vergleich zu ${range}. ${heading}. ${detail}`,
    strengthActivity: 'Kraft & Aktivität',
    firstMonth: 'Erster Monat',
    comparedWith: 'Im Vergleich zu',
    range: (month: string, through: number) => `1.–${String(through)}. ${month}`,
    statWorkouts: 'Trainings',
    trainingTime: 'Trainingszeit',
    perWeek: 'Pro Woche',
    volumeLifted: 'Bewegtes Volumen',
    recordsLabel: (count: number, heading: string, detail: string) =>
      `Persönliche Rekorde diesen Monat: ${String(count)} ${count === 1 ? 'neuer Bestwert' : 'neue Bestwerte'}. ${heading}. ${detail}`,
    newBests: (count: number) => (count === 1 ? 'neuer Bestwert' : 'neue Bestwerte'),
    exercise: 'Übung',
    firstTime: 'Erstes Mal',
    onYourBest: (weight: string) => `${weight} über deinem Bestwert`,
    best: (weight: string) => `Bestwert ${weight}`,
    sameAsLast: 'Wie letzten Monat',
    noneLast: 'Letzten Monat keine',
    up: 'mehr',
    down: 'weniger',
    yourMonth: 'Dein Monat',
    today: 'Heute',
    monthStart: (month: string) => `1. ${month}`,
    firstTitle: 'Dein erstes Training startet das Diagramm',
    firstBody:
      'Trag eins ein, dann füllt sich das hier: wie oft du trainierst, welche Muskeln du forderst und wie viel du bewegst, Monat für Monat.',
    logWorkout: 'Training eintragen',
  },
  insights: {
    workouts: {
      start: {
        heading: 'Dein Monat beginnt mit einem Training',
        detail: 'Trag eine Einheit ein, und diese Linie steigt.',
      },
      notYet: {
        heading: 'Diesen Monat noch nichts eingetragen',
        detail: (previous: number) =>
          `Letzten Monat waren es ${plural(previous, 'Training', 'Trainings')}. Heute ist ein guter Tag zum Anfangen.`,
      },
      firstMonth: {
        heading: 'Dein erster Monat läuft',
        detail: (workouts: number) =>
          `Bisher ${plural(workouts, 'Training', 'Trainings')}. Der nächste Monat muss diesen schlagen.`,
      },
      ahead: {
        heading: 'Du bist gut dabei',
        detail: (by: number) =>
          `${plural(by, 'Training', 'Trainings')} mehr als zum selben Zeitpunkt letzten Monat.`,
      },
      level: {
        heading: 'Gleichauf mit letztem Monat',
        detail: (workouts: number) =>
          `${plural(workouts, 'Training', 'Trainings')}, genauso viele wie bis zu diesem Tag letzten Monat.`,
      },
      behind: {
        heading: 'Etwas hinter letztem Monat',
        detail: (by: number) =>
          `${plural(by, 'Training', 'Trainings')} weniger als bis zu diesem Tag.`,
      },
    },
    muscles: {
      none: {
        heading: 'Diesen Monat noch keine Sätze eingetragen',
        detail: 'Jeder Satz, den du einträgst, erscheint hier, nach Muskelgruppe.',
      },
      early: {
        heading: 'Das Bild füllt sich',
        detail: (sets: number) =>
          `Bisher ${plural(sets, 'Satz', 'Sätze')}. Noch ein paar Trainings, dann zeigt sich die Balance.`,
      },
      neglected: {
        atLeast: (region: Region, days: number) =>
          `${REGION[region]}: seit ${String(days)} Tagen nichts`,
        exactly: (region: Region, days: number) =>
          `${REGION[region]}: seit ${String(days)} Tagen nicht trainiert`,
        detail: 'Verdient einen Platz in deinem nächsten Training.',
      },
      lopsided: {
        heading: (region: Region, percent: number) =>
          `${REGION[region]}: ${String(percent)} % deiner Sätze`,
        detail: 'Wenn du die Arbeit verteilst, fällt der Rest nicht zurück.',
      },
      balanced: {
        heading: 'Gut ausgewogen',
        detail: 'Du trainierst diesen Monat jede große Muskelgruppe.',
      },
      focused: {
        heading: (regions: readonly Region[]) =>
          `Bisher vor allem ${regions.map((region) => REGION[region]).join(' und ')}`,
        detail: 'Der Rest kommt im Lauf des Monats dran.',
      },
    },
    activity: {
      quiet: {
        heading: 'Dein Monat wartet',
        detail: 'Zeit, Volumen und Tempo erscheinen nach deinem ersten Training.',
      },
      stronger: {
        heading: 'Du bewegst mehr',
        detail: (percent: number) =>
          `${String(percent)} % mehr Gewicht bewegt als zum selben Zeitpunkt letzten Monat.`,
      },
      consistent: {
        heading: 'Starke Regelmäßigkeit',
        detail: (perWeek: string) =>
          `Etwa ${perWeek} pro Woche. Du bleibst dran, und das zeigt sich.`,
      },
      catchUp: {
        heading: (by: number) =>
          by === 1 ? 'Ein Training schließt die Lücke' : `${String(by)} Trainings zum Aufholen`,
        detail: 'Bis zu diesem Tag hinter dem Tempo des letzten Monats, mit Zeit zum Aufholen.',
      },
      steady: {
        heading: 'Ein gleichmäßiger Monat',
        detail: 'Bleib dran, dann zeigt sich hier der Trend.',
      },
    },
    records: {
      oneLift: 'Eine Übung',
      none: {
        heading: 'Diesen Monat noch keine Übungen eingetragen',
        detail:
          'Deine schwersten Sätze diesen Monat erscheinen hier, im Vergleich zu deinem Bestwert.',
      },
      new: {
        heading: (count: number) =>
          count === 1
            ? 'Ein neuer persönlicher Rekord'
            : `${String(count)} neue persönliche Rekorde`,
        detail: (name: string) => `${name} ist schwerer als je zuvor. Du wirst stärker.`,
      },
      first: {
        heading: 'Deine ersten Bestwerte stehen',
        detail: (count: number) =>
          `${String(count)} ${count === 1 ? 'Übung' : 'Übungen'} zum Schlagen. Geh schwerer, dann erscheinen sie als neue Rekorde.`,
      },
      close: {
        heading: (weight: string) => `${weight} unter deinem Bestwert`,
        detail: (name: string) => `${name} ist fast da. Ein guter Tag, und es steht auf der Tafel.`,
      },
      holding: {
        heading: 'Deine Bestwerte stehen noch',
        detail: 'Ein schwererer Satz bei irgendeiner Übung diesen Monat erscheint hier.',
      },
    },
  },
};
