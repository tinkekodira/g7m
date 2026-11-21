import type { Messages } from '../en/index.js';

const count = (n: string, value: number, one: string, many: string): string =>
  `${n} ${value === 1 ? one : many}`;

export const progress: Messages['progress'] = {
  title: 'Progresso',
  period: 'Período',
  periods: { week: 'Semanal', month: 'Mensal', all: 'Desde sempre' },
  label: {
    allTime: 'Desde sempre',
    thisWeek: 'Esta semana',
    lastWeek: 'Semana passada',
    thisMonth: 'Este mês',
    range: (from: string, to: string) => `${from} – ${to}`,
    monthYear: (month: string, year: number) => `${month} de ${String(year)}`,
    dayMonthYear: (dayMonth: string, year: number) => `${dayMonth} de ${String(year)}`,
  },
  phrase: {
    this: { week: 'esta semana', month: 'este mês', all: 'desde sempre' },
    previous: { week: 'na semana passada', month: 'no mês passado' },
    lastWeek: 'semana passada',
    in: (label: string) => `em ${label}`,
  },
  metrics: {
    volume: {
      label: 'Peso levantado',
      description: 'Peso vezes repetições',
      caption: 'Peso vezes repetições, em todas as séries válidas.',
    },
    sets: {
      label: 'Séries',
      description: 'Séries válidas, sem aquecimento',
      caption: 'Séries válidas, sem aquecimento.',
    },
    workouts: {
      label: 'Treinos',
      description: 'Quantos você concluiu',
      caption: 'Treinos concluídos.',
    },
    time: {
      label: 'Tempo ativo',
      description: 'Tempo de treino, com cardio',
      caption: 'Tempo de treino, da primeira à última série, com cardio.',
    },
    cardio: {
      label: 'Tempo de cardio',
      description: 'Minutos nas máquinas',
      caption: 'Tempo nas máquinas de cardio.',
    },
    calories: {
      label: 'Calorias',
      description: 'Queimadas no cardio',
      caption: 'Do cardio: o número da máquina ou a estimativa.',
    },
  },
  totals: {
    workouts: (n: string, value: number) => count(n, value, 'treino', 'treinos'),
    sets: (n: string, value: number) => count(n, value, 'série', 'séries'),
    calories: (n: string) => `≈ ${n} kcal`,
    thousand: (n: string) => `${n} mil`,
  },
  summary: {
    byMonth: 'por mês',
    byDay: 'por dia',
    nothing: (label: string, scope: string, when: string) =>
      `${label} ${scope}, ${when}. Nada registrado.`,
    columns: (label: string, scope: string, when: string, columns: string, total: string) =>
      `${label} ${scope}, ${when}: ${columns}. ${total} no total.`,
    column: (bucket: string, value: string) => `${bucket} ${value}`,
  },
  work: {
    sets: (n: number) => `${String(n)} ${n === 1 ? 'série' : 'séries'}`,
    bouts: (n: number) => `${String(n)} ${n === 1 ? 'bloco' : 'blocos'}`,
  },
  comparison: {
    vs: (previous: string) => `vs. ${previous}`,
    same: 'Igual',
    as: (previous: string) => `a ${previous}`,
  },
  average: {
    heading: (time: string) => `Sessão média ${time}`,
    first: 'Da primeira à última série marcada, em cada treino.',
    same: (month: string) => `Mais ou menos igual a ${month}.`,
    longer: (time: string, month: string) => `${time} a mais que em ${month}.`,
    shorter: (time: string, month: string) => `${time} a menos que em ${month}.`,
  },
  since: {
    first: 'primeiro treino',
    at: (month: string, year: number) => `${month} de ${String(year)}`,
  },
  empty: {
    title: 'Nada por aqui ainda',
    body: 'Conclua um treino e ele aparece aqui. Os gráficos contam sessões concluídas, então a que está em andamento conta quando você tocar em Concluir.',
  },
  yourTraining: 'Seu treino',
  totalWorkouts: 'Total de treinos',
  activeTime: 'Tempo ativo',
  chart: 'Gráfico',
  chartView: 'Visualização do gráfico',
  lastTwelveMonths: 'nos últimos 12 meses',
  allTime: 'desde sempre',
  oneColumnMonth: ' Uma coluna por mês.',
  oneColumnDay: ' Uma coluna por dia.',
  stepper: {
    previous: (period: 'week' | 'month') =>
      period === 'week' ? 'Semana anterior' : 'Mês anterior',
    next: (period: 'week' | 'month') => (period === 'week' ? 'Próxima semana' : 'Próximo mês'),
    backTo: (period: 'week' | 'month') =>
      period === 'week' ? 'Voltar para esta semana' : 'Voltar para este mês',
  },
  cardio: {
    title: 'Cardio',
    time: 'Tempo',
    distance: 'Distância',
    calories: 'Calorias',
  },
  loading: 'Carregando',
  recent: 'Treinos recentes',
  showFewer: 'Mostrar menos',
  showAll: (count: number) => `Mostrar todos os ${String(count)}`,
  minutes: (minutes: number) => `${String(minutes)} min`,
  notEnoughForLine: 'Ainda não há sessões suficientes para traçar uma linha.',
  weightChart: {
    bw: 'PC',
    noWeightData: 'Sem dados de peso',
    notLogged: 'Ainda não registrado',
    oneSession: '1 sessão',
    lastSessions: (count: number) => `Últimas ${String(count)} sessões`,
    point: (date: string, weight: string, kind: 'assisted' | 'added' | null) =>
      `${date}: ${weight}${kind === 'assisted' ? ' de assistência' : kind === 'added' ? ' adicional' : ''}`,
    bodyweight: 'Peso corporal',
    cardio: 'A evolução de carga não está disponível para cardio.',
    none: 'Sem histórico de carga. Conclua uma série válida e finalize o treino para começar seu gráfico.',
    summary: (caption: string, history: string) =>
      `Evolução da carga, ${caption.toLowerCase()}, da mais antiga à mais recente. ${history}.`,
  },
  calendar: {
    monthYear: (month: string, year: number) => `${month} de ${String(year)}`,
    dayTitle: (weekday: string, day: number, month: string) =>
      `${weekday}, ${String(day)} de ${month}`,
    workouts: (n: number) => `${String(n)} ${n === 1 ? 'treino' : 'treinos'}`,
    noWorkout: 'sem treino',
    today: 'hoje',
    noneThisMonth: 'Nenhum treino ainda este mês',
    noneIn: (month: string) => `Nenhum treino em ${month}`,
  },
  achievements: {
    categories: {
      milestones: { title: 'Marcos', detail: 'Treinos, recordes e toneladas' },
      strength: { title: 'Clubes de força', detail: 'Anilhas na barra, e o seu próprio peso' },
      consistency: { title: 'Constância', detail: 'Aparecer, semana após semana' },
      cardio: { title: 'Cardio e variedade', detail: 'Máquinas, distância e terreno novo' },
      secret: { title: 'Secreta', detail: 'Existe uma. Ela encontra você.' },
    },
    units: {
      workouts: ['treino', 'treinos'],
      records: ['recorde', 'recordes'],
      reps: ['repetição', 'repetições'],
      weeks: ['semana', 'semanas'],
      days: ['dia', 'dias'],
      machines: ['máquina', 'máquinas'],
      exercises: ['exercício', 'exercícios'],
      groups: ['grupo muscular', 'grupos musculares'],
    },
    tons: 'toneladas',
    earned: (date: string) => `Obtida em ${date}`,
    nextToday: 'Próxima chance: hoje',
    nextTomorrow: 'Próxima chance: amanhã',
    next: (when: string) => `Próxima chance: ${when}`,
    quietOne: (earned: string) => `${earned} · toque para ver`,
    quietMany: (count: number) => `${String(count)} conquistas obtidas`,
    quietManyDetail: 'De treinos que você registrou antes · toque para ver',
  },
};
