import type { Messages } from '../en/index.js';

const count = (n: string, value: number, one: string, many: string): string =>
  `${n} ${value === 1 ? one : many}`;

export const progress: Messages['progress'] = {
  title: 'Progrès',
  period: 'Période',
  periods: { week: 'Semaine', month: 'Mois', all: 'Depuis le début' },
  label: {
    allTime: 'Depuis le début',
    thisWeek: 'Cette semaine',
    lastWeek: 'La semaine dernière',
    thisMonth: 'Ce mois-ci',
    range: (from: string, to: string) => `${from} – ${to}`,
    monthYear: (month: string, year: number) => `${month} ${String(year)}`,
    dayMonthYear: (dayMonth: string, year: number) => `${dayMonth} ${String(year)}`,
  },
  phrase: {
    this: { week: 'cette semaine', month: 'ce mois-ci', all: 'depuis le début' },
    previous: { week: 'la semaine dernière', month: 'le mois dernier' },
    lastWeek: 'la semaine dernière',
    in: (label: string) => `en ${label}`,
  },
  metrics: {
    volume: {
      label: 'Poids soulevé',
      description: 'Charge fois répétitions',
      caption: 'Charge fois répétitions, sur toutes les séries de travail.',
    },
    sets: {
      label: 'Séries',
      description: 'Séries de travail, hors échauffement',
      caption: 'Séries de travail, hors échauffement.',
    },
    workouts: {
      label: 'Séances',
      description: 'Combien tu en as terminé',
      caption: 'Séances terminées.',
    },
    time: {
      label: 'Temps actif',
      description: 'Temps d’entraînement, cardio compris',
      caption: 'Temps d’entraînement, de la première à la dernière série, cardio compris.',
    },
    cardio: {
      label: 'Temps de cardio',
      description: 'Minutes sur les machines',
      caption: 'Temps sur les machines de cardio.',
    },
    calories: {
      label: 'Calories',
      description: 'Brûlées en cardio',
      caption: 'Du cardio : le chiffre de la machine ou l’estimation.',
    },
  },
  totals: {
    workouts: (n: string, value: number) => count(n, value, 'séance', 'séances'),
    sets: (n: string, value: number) => count(n, value, 'série', 'séries'),
    calories: (n: string) => `≈ ${n} kcal`,
    thousand: (n: string) => `${n} k`,
  },
  summary: {
    byMonth: 'par mois',
    byDay: 'par jour',
    nothing: (label: string, scope: string, when: string) =>
      `${label} ${scope}, ${when}. Rien d’enregistré.`,
    columns: (label: string, scope: string, when: string, columns: string, total: string) =>
      `${label} ${scope}, ${when} : ${columns}. ${total} au total.`,
    column: (bucket: string, value: string) => `${bucket} ${value}`,
  },
  work: {
    sets: (n: number) => `${String(n)} ${n === 1 ? 'série' : 'séries'}`,
    bouts: (n: number) => `${String(n)} ${n === 1 ? 'bloc' : 'blocs'}`,
  },
  comparison: {
    vs: (previous: string) => `vs ${previous}`,
    same: 'Pareil',
    as: (previous: string) => `que ${previous}`,
  },
  average: {
    heading: (time: string) => `Séance moyenne ${time}`,
    first: 'De la première à la dernière série cochée, dans chaque séance.',
    same: (month: string) => `À peu près pareil qu’en ${month}.`,
    longer: (time: string, month: string) => `${time} de plus qu’en ${month}.`,
    shorter: (time: string, month: string) => `${time} de moins qu’en ${month}.`,
  },
  since: {
    first: 'première séance',
    at: (month: string, year: number) => `${month} ${String(year)}`,
  },
  empty: {
    title: 'Rien pour l’instant',
    body: 'Termine une séance et elle apparaîtra ici. Les graphiques comptent les séances terminées : celle en cours compte dès que tu touches Terminer.',
  },
  yourTraining: 'Ton entraînement',
  totalWorkouts: 'Total des séances',
  activeTime: 'Temps actif',
  chart: 'Graphique',
  chartView: 'Vue du graphique',
  lastTwelveMonths: 'sur les 12 derniers mois',
  allTime: 'depuis le début',
  oneColumnMonth: ' Une colonne par mois.',
  oneColumnDay: ' Une colonne par jour.',
  stepper: {
    previous: (period: 'week' | 'month') =>
      period === 'week' ? 'Semaine précédente' : 'Mois précédent',
    next: (period: 'week' | 'month') => (period === 'week' ? 'Semaine suivante' : 'Mois suivant'),
    backTo: (period: 'week' | 'month') =>
      period === 'week' ? 'Revenir à cette semaine' : 'Revenir à ce mois-ci',
  },
  cardio: {
    title: 'Cardio',
    time: 'Temps',
    distance: 'Distance',
    calories: 'Calories',
  },
  loading: 'Chargement',
  recent: 'Séances récentes',
  showFewer: 'Afficher moins',
  showAll: (count: number) => `Tout afficher (${String(count)})`,
  minutes: (minutes: number) => `${String(minutes)} min`,
  notEnoughForLine: 'Pas encore assez de séances pour tracer une courbe.',
  weightChart: {
    bw: 'PdC',
    noWeightData: 'Aucune donnée de charge',
    notLogged: 'Pas encore enregistré',
    oneSession: '1 séance',
    lastSessions: (count: number) => `${String(count)} dernières séances`,
    point: (date: string, weight: string, kind: 'assisted' | 'added' | null) =>
      `${date} : ${weight}${kind === 'assisted' ? ' d’assistance' : kind === 'added' ? ' de lest' : ''}`,
    bodyweight: 'Poids de corps',
    cardio: 'L’évolution de la charge n’est pas disponible pour le cardio.',
    none: 'Aucun historique de charge. Termine une série de travail et la séance pour lancer ton graphique.',
    summary: (caption: string, history: string) =>
      `Évolution de la charge, ${caption.toLowerCase()}, de la plus ancienne à la plus récente. ${history}.`,
  },
  calendar: {
    monthYear: (month: string, year: number) => `${month} ${String(year)}`,
    dayTitle: (weekday: string, day: number, month: string) => `${weekday} ${String(day)} ${month}`,
    workouts: (n: number) => `${String(n)} ${n === 1 ? 'séance' : 'séances'}`,
    noWorkout: 'pas de séance',
    today: 'aujourd’hui',
    noneThisMonth: 'Aucune séance ce mois-ci pour l’instant',
    noneIn: (month: string) => `Aucune séance en ${month}`,
  },
  achievements: {
    categories: {
      milestones: { title: 'Étapes', detail: 'Séances, records et tonnes' },
      strength: {
        title: 'Clubs de force',
        detail: 'Des disques sur la barre, et ton propre poids',
      },
      consistency: { title: 'Régularité', detail: 'Être là, semaine après semaine' },
      cardio: { title: 'Cardio et variété', detail: 'Machines, distance et nouveaux terrains' },
      secret: { title: 'Secret', detail: 'Il y en a un. Il te trouvera.' },
    },
    units: {
      workouts: ['séance', 'séances'],
      records: ['record', 'records'],
      reps: ['répétition', 'répétitions'],
      weeks: ['semaine', 'semaines'],
      days: ['jour', 'jours'],
      machines: ['machine', 'machines'],
      exercises: ['exercice', 'exercices'],
      groups: ['groupe musculaire', 'groupes musculaires'],
    },
    tons: 'tonnes',
    earned: (date: string) => `Obtenu le ${date}`,
    nextToday: 'Prochaine occasion : aujourd’hui',
    nextTomorrow: 'Prochaine occasion : demain',
    next: (when: string) => `Prochaine occasion : ${when}`,
    quietOne: (earned: string) => `${earned} · touche pour le voir`,
    quietMany: (count: number) => `${String(count)} succès obtenus`,
    quietManyDetail: 'Grâce aux séances enregistrées avant · touche pour les voir',
  },
};
