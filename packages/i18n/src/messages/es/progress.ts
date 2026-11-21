import type { Messages } from '../en/index.js';

const count = (n: string, value: number, one: string, many: string): string =>
  `${n} ${value === 1 ? one : many}`;

export const progress: Messages['progress'] = {
  title: 'Progreso',
  period: 'Periodo',
  periods: { week: 'Semanal', month: 'Mensual', all: 'Siempre' },
  label: {
    allTime: 'Desde siempre',
    thisWeek: 'Esta semana',
    lastWeek: 'La semana pasada',
    thisMonth: 'Este mes',
    range: (from: string, to: string) => `${from} – ${to}`,
    monthYear: (month: string, year: number) => `${month} de ${String(year)}`,
    dayMonthYear: (dayMonth: string, year: number) => `${dayMonth} ${String(year)}`,
  },
  phrase: {
    this: { week: 'esta semana', month: 'este mes', all: 'desde siempre' },
    previous: { week: 'la semana pasada', month: 'el mes pasado' },
    lastWeek: 'la semana pasada',
    in: (label: string) => `en ${label}`,
  },
  metrics: {
    volume: {
      label: 'Peso levantado',
      description: 'Peso por repeticiones',
      caption: 'Peso por repeticiones, en todas las series efectivas.',
    },
    sets: {
      label: 'Series',
      description: 'Series efectivas, sin calentamientos',
      caption: 'Series efectivas, sin calentamientos.',
    },
    workouts: {
      label: 'Entrenamientos',
      description: 'Cuántos terminaste',
      caption: 'Entrenamientos terminados.',
    },
    time: {
      label: 'Tiempo activo',
      description: 'Tiempo entrenando, con cardio',
      caption: 'Tiempo entrenando, de la primera serie a la última, con cardio.',
    },
    cardio: {
      label: 'Tiempo de cardio',
      description: 'Minutos en las máquinas',
      caption: 'Tiempo en las máquinas de cardio.',
    },
    calories: {
      label: 'Calorías',
      description: 'Quemadas en cardio',
      caption: 'Del cardio: la cifra de la máquina o la estimación.',
    },
  },
  totals: {
    workouts: (n: string, value: number) => count(n, value, 'entrenamiento', 'entrenamientos'),
    sets: (n: string, value: number) => count(n, value, 'serie', 'series'),
    calories: (n: string) => `≈ ${n} kcal`,
    thousand: (n: string) => `${n} mil`,
  },
  summary: {
    byMonth: 'por mes',
    byDay: 'por día',
    nothing: (label: string, scope: string, when: string) =>
      `${label} ${scope}, ${when}. Nada registrado.`,
    columns: (label: string, scope: string, when: string, columns: string, total: string) =>
      `${label} ${scope}, ${when}: ${columns}. ${total} en total.`,
    column: (bucket: string, value: string) => `${bucket} ${value}`,
  },
  work: {
    sets: (n: number) => `${String(n)} ${n === 1 ? 'serie' : 'series'}`,
    bouts: (n: number) => `${String(n)} ${n === 1 ? 'bloque' : 'bloques'}`,
  },
  comparison: {
    vs: (previous: string) => `frente a ${previous}`,
    same: 'Igual',
    as: (previous: string) => `que ${previous}`,
  },
  average: {
    heading: (time: string) => `Sesión media ${time}`,
    first: 'De la primera serie marcada a la última, en cada entrenamiento.',
    same: (month: string) => `Más o menos igual que en ${month}.`,
    longer: (time: string, month: string) => `${time} más que en ${month}.`,
    shorter: (time: string, month: string) => `${time} menos que en ${month}.`,
  },
  since: {
    first: 'primer entrenamiento',
    at: (month: string, year: number) => `${month} de ${String(year)}`,
  },
  empty: {
    title: 'Aún no hay nada',
    body: 'Termina un entrenamiento y aparecerá aquí. Las gráficas cuentan sesiones terminadas, así que la que tienes a medias cuenta cuando toques Terminar.',
  },
  yourTraining: 'Tu entrenamiento',
  totalWorkouts: 'Entrenamientos totales',
  activeTime: 'Tiempo activo',
  chart: 'Gráfica',
  chartView: 'Vista de gráfica',
  lastTwelveMonths: 'en los últimos 12 meses',
  allTime: 'desde siempre',
  oneColumnMonth: ' Una columna por mes.',
  oneColumnDay: ' Una columna por día.',
  stepper: {
    previous: (period: 'week' | 'month') =>
      period === 'week' ? 'Semana anterior' : 'Mes anterior',
    next: (period: 'week' | 'month') => (period === 'week' ? 'Semana siguiente' : 'Mes siguiente'),
    backTo: (period: 'week' | 'month') =>
      period === 'week' ? 'Volver a esta semana' : 'Volver a este mes',
  },
  cardio: {
    title: 'Cardio',
    time: 'Tiempo',
    distance: 'Distancia',
    calories: 'Calorías',
  },
  loading: 'Cargando',
  recent: 'Entrenamientos recientes',
  showFewer: 'Mostrar menos',
  showAll: (count: number) => `Mostrar los ${String(count)}`,
  minutes: (minutes: number) => `${String(minutes)} min`,
  notEnoughForLine: 'Aún no hay sesiones suficientes para trazar una línea.',
  weightChart: {
    bw: 'PC',
    noWeightData: 'Sin datos de peso',
    notLogged: 'Aún sin registrar',
    oneSession: '1 sesión',
    lastSessions: (count: number) => `Últimas ${String(count)} sesiones`,
    point: (date: string, weight: string, kind: 'assisted' | 'added' | null) =>
      `${date}: ${weight}${kind === 'assisted' ? ' de asistencia' : kind === 'added' ? ' de lastre' : ''}`,
    bodyweight: 'Peso corporal',
    cardio: 'La evolución del peso no está disponible para el cardio.',
    none: 'Sin historial de peso. Completa una serie efectiva y termina el entrenamiento para empezar tu gráfica.',
    summary: (caption: string, history: string) =>
      `Evolución del peso, ${caption.toLowerCase()}, de la más antigua a la más reciente. ${history}.`,
  },
  calendar: {
    monthYear: (month: string, year: number) => `${month} de ${String(year)}`,
    dayTitle: (weekday: string, day: number, month: string) =>
      `${weekday} ${String(day)} de ${month}`,
    workouts: (n: number) => `${String(n)} ${n === 1 ? 'entrenamiento' : 'entrenamientos'}`,
    noWorkout: 'sin entrenamiento',
    today: 'hoy',
    noneThisMonth: 'Aún no hay entrenamientos este mes',
    noneIn: (month: string) => `Sin entrenamientos en ${month}`,
  },
  achievements: {
    categories: {
      milestones: { title: 'Hitos', detail: 'Entrenamientos, récords y toneladas' },
      strength: { title: 'Clubs de fuerza', detail: 'Discos en la barra, y tu propio peso' },
      consistency: { title: 'Constancia', detail: 'Presentarte, semana tras semana' },
      cardio: { title: 'Cardio y variedad', detail: 'Máquinas, distancia y terreno nuevo' },
      secret: { title: 'Secreto', detail: 'Hay uno. Te encuentra.' },
    },
    units: {
      workouts: ['entrenamiento', 'entrenamientos'],
      records: ['récord', 'récords'],
      reps: ['repetición', 'repeticiones'],
      weeks: ['semana', 'semanas'],
      days: ['día', 'días'],
      machines: ['máquina', 'máquinas'],
      exercises: ['ejercicio', 'ejercicios'],
      groups: ['grupo muscular', 'grupos musculares'],
    },
    tons: 'toneladas',
    earned: (date: string) => `Conseguido el ${date}`,
    nextToday: 'Próxima oportunidad: hoy',
    nextTomorrow: 'Próxima oportunidad: mañana',
    next: (when: string) => `Próxima oportunidad: ${when}`,
    quietOne: (earned: string) => `${earned} · toca para verlo`,
    quietMany: (count: number) => `${String(count)} logros conseguidos`,
    quietManyDetail: 'De entrenamientos que registraste antes · toca para verlos',
  },
};
