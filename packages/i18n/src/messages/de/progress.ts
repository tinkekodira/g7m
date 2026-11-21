import type { Messages } from '../en/index.js';

const count = (n: string, value: number, one: string, many: string): string =>
  `${n} ${value === 1 ? one : many}`;

export const progress: Messages['progress'] = {
  title: 'Fortschritt',
  period: 'Zeitraum',
  periods: { week: 'Wöchentlich', month: 'Monatlich', all: 'Gesamt' },
  label: {
    allTime: 'Gesamt',
    thisWeek: 'Diese Woche',
    lastWeek: 'Letzte Woche',
    thisMonth: 'Dieser Monat',
    range: (from: string, to: string) => `${from} – ${to}`,
    monthYear: (month: string, year: number) => `${month} ${String(year)}`,
    dayMonthYear: (dayMonth: string, year: number) => `${dayMonth} ${String(year)}`,
  },
  phrase: {
    this: { week: 'diese Woche', month: 'diesen Monat', all: 'insgesamt' },
    previous: { week: 'letzte Woche', month: 'letzten Monat' },
    lastWeek: 'letzte Woche',
    in: (label: string) => `im ${label}`,
  },
  metrics: {
    volume: {
      label: 'Bewegtes Gewicht',
      description: 'Gewicht mal Wiederholungen',
      caption: 'Gewicht mal Wiederholungen, über alle Arbeitssätze.',
    },
    sets: {
      label: 'Sätze',
      description: 'Arbeitssätze, ohne Aufwärmsätze',
      caption: 'Arbeitssätze, ohne Aufwärmsätze.',
    },
    workouts: {
      label: 'Trainings',
      description: 'Wie viele du abgeschlossen hast',
      caption: 'Abgeschlossene Trainings.',
    },
    time: {
      label: 'Aktive Zeit',
      description: 'Trainingszeit inklusive Cardio',
      caption: 'Trainingszeit vom ersten bis zum letzten Satz, inklusive Cardio.',
    },
    cardio: {
      label: 'Cardiozeit',
      description: 'Minuten an den Geräten',
      caption: 'Zeit an den Cardiogeräten.',
    },
    calories: {
      label: 'Kalorien',
      description: 'Beim Cardio verbrannt',
      caption: 'Aus dem Cardio: der Wert des Geräts oder die Schätzung.',
    },
  },
  totals: {
    workouts: (n: string, value: number) => count(n, value, 'Training', 'Trainings'),
    sets: (n: string, value: number) => count(n, value, 'Satz', 'Sätze'),
    calories: (n: string) => `≈ ${n} kcal`,
    thousand: (n: string) => `${n} Tsd.`,
  },
  summary: {
    byMonth: 'nach Monat',
    byDay: 'nach Tag',
    nothing: (label: string, scope: string, when: string) =>
      `${label} ${scope}, ${when}. Nichts eingetragen.`,
    columns: (label: string, scope: string, when: string, columns: string, total: string) =>
      `${label} ${scope}, ${when}: ${columns}. Insgesamt ${total}.`,
    column: (bucket: string, value: string) => `${bucket} ${value}`,
  },
  work: {
    sets: (n: number) => `${String(n)} ${n === 1 ? 'Satz' : 'Sätze'}`,
    bouts: (n: number) => `${String(n)} ${n === 1 ? 'Einheit' : 'Einheiten'}`,
  },
  comparison: {
    vs: (previous: string) => `ggü. ${previous}`,
    same: 'Gleich',
    as: (previous: string) => `wie ${previous}`,
  },
  average: {
    heading: (time: string) => `Durchschnittliches Training ${time}`,
    first: 'Vom ersten bis zum letzten abgehakten Satz, in jedem Training.',
    same: (month: string) => `Etwa gleich wie im ${month}.`,
    longer: (time: string, month: string) => `${time} länger als im ${month}.`,
    shorter: (time: string, month: string) => `${time} kürzer als im ${month}.`,
  },
  since: {
    first: 'erstes Training',
    at: (month: string, year: number) => `${month} ${String(year)}`,
  },
  empty: {
    title: 'Hier ist noch nichts',
    body: 'Schließe ein Training ab, dann erscheint es hier. Die Diagramme zählen abgeschlossene Trainings – das laufende zählt, sobald du auf „Beenden“ tippst.',
  },
  yourTraining: 'Dein Training',
  totalWorkouts: 'Trainings gesamt',
  activeTime: 'Aktive Zeit',
  chart: 'Diagramm',
  chartView: 'Diagrammansicht',
  lastTwelveMonths: 'in den letzten 12 Monaten',
  allTime: 'insgesamt',
  oneColumnMonth: ' Eine Säule pro Monat.',
  oneColumnDay: ' Eine Säule pro Tag.',
  stepper: {
    previous: (period: 'week' | 'month') =>
      period === 'week' ? 'Vorherige Woche' : 'Vorheriger Monat',
    next: (period: 'week' | 'month') => (period === 'week' ? 'Nächste Woche' : 'Nächster Monat'),
    backTo: (period: 'week' | 'month') =>
      period === 'week' ? 'Zurück zu dieser Woche' : 'Zurück zu diesem Monat',
  },
  cardio: {
    title: 'Cardio',
    time: 'Zeit',
    distance: 'Strecke',
    calories: 'Kalorien',
  },
  loading: 'Wird geladen',
  recent: 'Letzte Trainings',
  showFewer: 'Weniger anzeigen',
  showAll: (count: number) => `Alle ${String(count)} anzeigen`,
  minutes: (minutes: number) => `${String(minutes)} Min.`,
  notEnoughForLine: 'Noch nicht genug Trainings für eine Linie.',
  weightChart: {
    bw: 'KG',
    noWeightData: 'Keine Gewichtsdaten',
    notLogged: 'Noch nicht eingetragen',
    oneSession: '1 Training',
    lastSessions: (count: number) => `Letzte ${String(count)} Trainings`,
    point: (date: string, weight: string, kind: 'assisted' | 'added' | null) =>
      `${date}: ${weight}${kind === 'assisted' ? ' Unterstützung' : kind === 'added' ? ' Zusatz' : ''}`,
    bodyweight: 'Körpergewicht',
    cardio: 'Für Cardio gibt es keinen Gewichtsverlauf.',
    none: 'Kein Gewichtsverlauf. Schließe einen Arbeitssatz ab und beende das Training, um dein Diagramm zu starten.',
    summary: (caption: string, history: string) =>
      `Gewichtsverlauf, ${caption}, vom ältesten zum neuesten. ${history}.`,
  },
  calendar: {
    monthYear: (month: string, year: number) => `${month} ${String(year)}`,
    dayTitle: (weekday: string, day: number, month: string) =>
      `${weekday}, ${String(day)}. ${month}`,
    workouts: (n: number) => `${String(n)} ${n === 1 ? 'Training' : 'Trainings'}`,
    noWorkout: 'kein Training',
    today: 'heute',
    noneThisMonth: 'Diesen Monat noch keine Trainings',
    noneIn: (month: string) => `Keine Trainings im ${month}`,
  },
  achievements: {
    categories: {
      milestones: { title: 'Meilensteine', detail: 'Trainings, Rekorde und Tonnen' },
      strength: {
        title: 'Kraft-Clubs',
        detail: 'Scheiben auf der Stange und dein eigenes Gewicht',
      },
      consistency: { title: 'Beständigkeit', detail: 'Dranbleiben, Woche für Woche' },
      cardio: { title: 'Cardio & Vielfalt', detail: 'Geräte, Strecke und Neuland' },
      secret: { title: 'Geheim', detail: 'Es gibt einen. Er findet dich.' },
    },
    units: {
      workouts: ['Training', 'Trainings'],
      records: ['Rekord', 'Rekorde'],
      reps: ['Wiederholung', 'Wiederholungen'],
      weeks: ['Woche', 'Wochen'],
      days: ['Tag', 'Tage'],
      machines: ['Gerät', 'Geräte'],
      exercises: ['Übung', 'Übungen'],
      groups: ['Muskelgruppe', 'Muskelgruppen'],
    },
    tons: 'Tonnen',
    earned: (date: string) => `Verdient am ${date}`,
    nextToday: 'Nächste Chance: heute',
    nextTomorrow: 'Nächste Chance: morgen',
    next: (when: string) => `Nächste Chance: ${when}`,
    quietOne: (earned: string) => `${earned} · tippen zum Ansehen`,
    quietMany: (count: number) => `${String(count)} Erfolge verdient`,
    quietManyDetail: 'Aus Trainings, die du vorher eingetragen hast · tippen zum Ansehen',
  },
};
