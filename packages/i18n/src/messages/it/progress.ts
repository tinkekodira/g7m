import type { Messages } from '../en/index.js';

const count = (n: string, value: number, one: string, many: string): string =>
  `${n} ${value === 1 ? one : many}`;

export const progress: Messages['progress'] = {
  title: 'Progressi',
  period: 'Periodo',
  periods: { week: 'Settimanale', month: 'Mensile', all: 'Sempre' },
  label: {
    allTime: 'Da sempre',
    thisWeek: 'Questa settimana',
    lastWeek: 'La settimana scorsa',
    thisMonth: 'Questo mese',
    range: (from: string, to: string) => `${from} – ${to}`,
    monthYear: (month: string, year: number) => `${month} ${String(year)}`,
    dayMonthYear: (dayMonth: string, year: number) => `${dayMonth} ${String(year)}`,
  },
  phrase: {
    this: { week: 'questa settimana', month: 'questo mese', all: 'da sempre' },
    previous: { week: 'la settimana scorsa', month: 'il mese scorso' },
    lastWeek: 'la settimana scorsa',
    in: (label: string) => `a ${label}`,
  },
  metrics: {
    volume: {
      label: 'Peso sollevato',
      description: 'Peso per ripetizioni',
      caption: 'Peso per ripetizioni, su tutte le serie allenanti.',
    },
    sets: {
      label: 'Serie',
      description: 'Serie allenanti, senza riscaldamento',
      caption: 'Serie allenanti, senza riscaldamento.',
    },
    workouts: {
      label: 'Allenamenti',
      description: 'Quanti ne hai completati',
      caption: 'Allenamenti completati.',
    },
    time: {
      label: 'Tempo attivo',
      description: 'Tempo di allenamento, cardio incluso',
      caption: 'Tempo di allenamento, dalla prima all’ultima serie, cardio incluso.',
    },
    cardio: {
      label: 'Tempo di cardio',
      description: 'Minuti sulle macchine',
      caption: 'Tempo sulle macchine cardio.',
    },
    calories: {
      label: 'Calorie',
      description: 'Bruciate col cardio',
      caption: 'Dal cardio: il valore della macchina o la stima.',
    },
  },
  totals: {
    workouts: (n: string, value: number) => count(n, value, 'allenamento', 'allenamenti'),
    sets: (n: string, value: number) => count(n, value, 'serie', 'serie'),
    calories: (n: string) => `≈ ${n} kcal`,
    thousand: (n: string) => `${n}k`,
  },
  summary: {
    byMonth: 'per mese',
    byDay: 'per giorno',
    nothing: (label: string, scope: string, when: string) =>
      `${label} ${scope}, ${when}. Niente registrato.`,
    columns: (label: string, scope: string, when: string, columns: string, total: string) =>
      `${label} ${scope}, ${when}: ${columns}. ${total} in totale.`,
    column: (bucket: string, value: string) => `${bucket} ${value}`,
  },
  work: {
    sets: (n: number) => `${String(n)} serie`,
    bouts: (n: number) => `${String(n)} ${n === 1 ? 'blocco' : 'blocchi'}`,
  },
  comparison: {
    vs: (previous: string) => `vs ${previous}`,
    same: 'Uguale',
    as: (previous: string) => `a ${previous}`,
  },
  average: {
    heading: (time: string) => `Sessione media ${time}`,
    first: 'Dalla prima all’ultima serie spuntata, in ogni allenamento.',
    same: (month: string) => `Più o meno come a ${month}.`,
    longer: (time: string, month: string) => `${time} in più rispetto a ${month}.`,
    shorter: (time: string, month: string) => `${time} in meno rispetto a ${month}.`,
  },
  since: {
    first: 'primo allenamento',
    at: (month: string, year: number) => `${month} ${String(year)}`,
  },
  empty: {
    title: 'Ancora niente qui',
    body: 'Completa un allenamento e comparirà qui. I grafici contano le sessioni completate, quindi quella in corso conta quando tocchi Termina.',
  },
  yourTraining: 'Il tuo allenamento',
  totalWorkouts: 'Allenamenti totali',
  activeTime: 'Tempo attivo',
  chart: 'Grafico',
  chartView: 'Vista grafico',
  lastTwelveMonths: 'negli ultimi 12 mesi',
  allTime: 'da sempre',
  oneColumnMonth: ' Una colonna al mese.',
  oneColumnDay: ' Una colonna al giorno.',
  stepper: {
    previous: (period: 'week' | 'month') =>
      period === 'week' ? 'Settimana precedente' : 'Mese precedente',
    next: (period: 'week' | 'month') =>
      period === 'week' ? 'Settimana successiva' : 'Mese successivo',
    backTo: (period: 'week' | 'month') =>
      period === 'week' ? 'Torna a questa settimana' : 'Torna a questo mese',
  },
  cardio: {
    title: 'Cardio',
    time: 'Tempo',
    distance: 'Distanza',
    calories: 'Calorie',
  },
  loading: 'Caricamento',
  recent: 'Allenamenti recenti',
  showFewer: 'Mostra meno',
  showAll: (count: number) => `Mostra tutti e ${String(count)}`,
  minutes: (minutes: number) => `${String(minutes)} min`,
  notEnoughForLine: 'Non ci sono ancora abbastanza sessioni per tracciare una linea.',
  weightChart: {
    bw: 'PC',
    noWeightData: 'Nessun dato sul carico',
    notLogged: 'Non ancora registrato',
    oneSession: '1 sessione',
    lastSessions: (count: number) => `Ultime ${String(count)} sessioni`,
    point: (date: string, weight: string, kind: 'assisted' | 'added' | null) =>
      `${date}: ${weight}${kind === 'assisted' ? ' di assistenza' : kind === 'added' ? ' di zavorra' : ''}`,
    bodyweight: 'Peso corporeo',
    cardio: 'L’andamento del carico non è disponibile per il cardio.',
    none: 'Nessuno storico del carico. Completa una serie allenante e termina l’allenamento per avviare il grafico.',
    summary: (caption: string, history: string) =>
      `Andamento del carico, ${caption.toLowerCase()}, dal più vecchio al più recente. ${history}.`,
  },
  calendar: {
    monthYear: (month: string, year: number) => `${month} ${String(year)}`,
    dayTitle: (weekday: string, day: number, month: string) => `${weekday} ${String(day)} ${month}`,
    workouts: (n: number) => `${String(n)} ${n === 1 ? 'allenamento' : 'allenamenti'}`,
    noWorkout: 'nessun allenamento',
    today: 'oggi',
    noneThisMonth: 'Ancora nessun allenamento questo mese',
    noneIn: (month: string) => `Nessun allenamento a ${month}`,
  },
  achievements: {
    categories: {
      milestones: { title: 'Tappe', detail: 'Allenamenti, record e tonnellate' },
      strength: {
        title: 'Club della forza',
        detail: 'Dischi sul bilanciere, e il tuo peso corporeo',
      },
      consistency: { title: 'Costanza', detail: 'Esserci, settimana dopo settimana' },
      cardio: { title: 'Cardio e varietà', detail: 'Macchine, distanza e territori nuovi' },
      secret: { title: 'Segreto', detail: 'Ce n’è uno. Ti troverà lui.' },
    },
    units: {
      workouts: ['allenamento', 'allenamenti'],
      records: ['record', 'record'],
      reps: ['ripetizione', 'ripetizioni'],
      weeks: ['settimana', 'settimane'],
      days: ['giorno', 'giorni'],
      machines: ['macchina', 'macchine'],
      exercises: ['esercizio', 'esercizi'],
      groups: ['gruppo muscolare', 'gruppi muscolari'],
    },
    tons: 'tonnellate',
    earned: (date: string) => `Ottenuto il ${date}`,
    nextToday: 'Prossima occasione: oggi',
    nextTomorrow: 'Prossima occasione: domani',
    next: (when: string) => `Prossima occasione: ${when}`,
    quietOne: (earned: string) => `${earned} · tocca per vederlo`,
    quietMany: (count: number) => `${String(count)} traguardi ottenuti`,
    quietManyDetail: 'Da allenamenti registrati prima · tocca per vederli',
  },
};
