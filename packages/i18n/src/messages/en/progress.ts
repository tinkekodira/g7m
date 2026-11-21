/** Progress: the charts, the calendar's words, and achievements' progress. */
type Period = 'week' | 'month' | 'all';
type Metric = 'volume' | 'sets' | 'workouts' | 'time' | 'cardio' | 'calories';

const count = (n: string, value: number, one: string, many: string): string =>
  `${n} ${value === 1 ? one : many}`;

export const progress = {
  title: 'Progress',
  period: 'Period',
  periods: { week: 'Weekly', month: 'Monthly', all: 'All time' },
  label: {
    allTime: 'All time',
    thisWeek: 'This week',
    lastWeek: 'Last week',
    thisMonth: 'This month',
    range: (from: string, to: string) => `${from} – ${to}`,
    monthYear: (month: string, year: number) => `${month} ${String(year)}`,
    dayMonthYear: (dayMonth: string, year: number) => `${dayMonth} ${String(year)}`,
  },
  /** Mid-sentence: "this week", "last week", "in August". */
  phrase: {
    this: { week: 'this week', month: 'this month', all: 'all time' } as Record<Period, string>,
    previous: { week: 'last week', month: 'last month' } as Record<string, string>,
    lastWeek: 'last week',
    in: (label: string) => `in ${label}`,
  },
  metrics: {
    volume: {
      label: 'Weight lifted',
      description: 'Weight times reps',
      caption: 'Weight times reps, over every working set.',
    },
    sets: {
      label: 'Sets',
      description: 'Working sets, warm-ups left out',
      caption: 'Working sets, warm-ups left out.',
    },
    workouts: {
      label: 'Workouts',
      description: 'How many you finished',
      caption: 'Workouts finished.',
    },
    time: {
      label: 'Active time',
      description: 'Training time, cardio included',
      caption: 'Time training, first set to last, cardio included.',
    },
    cardio: {
      label: 'Cardio time',
      description: 'Minutes on the machines',
      caption: 'Time on the cardio machines.',
    },
    calories: {
      label: 'Calories',
      description: 'Burned on cardio',
      caption: 'From cardio: the machine’s figure, or the estimate.',
    },
  } as Record<Metric, { label: string; description: string; caption: string }>,
  totals: {
    workouts: (n: string, value: number) => count(n, value, 'workout', 'workouts'),
    sets: (n: string, value: number) => count(n, value, 'set', 'sets'),
    calories: (n: string) => `≈ ${n} kcal`,
    thousand: (n: string) => `${n}k`,
  },
  summary: {
    byMonth: 'by month',
    byDay: 'by day',
    nothing: (label: string, scope: string, when: string) =>
      `${label} ${scope}, ${when}. Nothing logged.`,
    columns: (label: string, scope: string, when: string, columns: string, total: string) =>
      `${label} ${scope}, ${when}: ${columns}. ${total} in total.`,
    column: (bucket: string, value: string) => `${bucket} ${value}`,
  },
  work: {
    sets: (n: number) => `${String(n)} ${n === 1 ? 'set' : 'sets'}`,
    bouts: (n: number) => `${String(n)} ${n === 1 ? 'bout' : 'bouts'}`,
  },
  comparison: {
    vs: (previous: string) => `vs ${previous}`,
    same: 'Same',
    as: (previous: string) => `as ${previous}`,
  },
  average: {
    heading: (time: string) => `Average session ${time}`,
    first: 'From your first ticked set to your last, in each workout.',
    same: (month: string) => `About the same as in ${month}.`,
    longer: (time: string, month: string) => `${time} longer than in ${month}.`,
    shorter: (time: string, month: string) => `${time} shorter than in ${month}.`,
  },
  since: {
    first: 'first workout',
    at: (month: string, year: number) => `${month} ${String(year)}`,
  },
  empty: {
    title: 'Nothing here yet',
    body: 'Finish a workout and it shows up here. The charts count completed sessions, so the one you are part-way through counts once you tap Finish.',
  },
  yourTraining: 'Your training',
  totalWorkouts: 'Total workouts',
  activeTime: 'Active time',
  chart: 'Chart',
  chartView: 'Chart view',
  lastTwelveMonths: 'in the last 12 months',
  allTime: 'all time',
  oneColumnMonth: ' One column a month.',
  oneColumnDay: ' One column a day.',
  stepper: {
    previous: (period: 'week' | 'month') => `Previous ${period}`,
    next: (period: 'week' | 'month') => `Next ${period}`,
    backTo: (period: 'week' | 'month') => `Back to this ${period}`,
  },
  cardio: {
    title: 'Cardio',
    time: 'Time',
    distance: 'Distance',
    calories: 'Calories',
  },
  loading: 'Loading',
  recent: 'Recent workouts',
  showFewer: 'Show fewer',
  showAll: (count: number) => `Show all ${String(count)}`,
  minutes: (minutes: number) => `${String(minutes)} min`,
  notEnoughForLine: 'Not enough sessions yet to draw a line.',
  weightChart: {
    bw: 'BW',
    noWeightData: 'No weight data',
    notLogged: 'Not logged yet',
    oneSession: '1 session',
    lastSessions: (count: number) => `Last ${String(count)} sessions`,
    point: (date: string, weight: string, kind: 'assisted' | 'added' | null) =>
      `${date}: ${weight}${kind === 'assisted' ? ' assistance' : kind === 'added' ? ' added' : ''}`,
    bodyweight: 'Bodyweight',
    cardio: 'Weight progress is not available for cardio.',
    none: 'No weight history. Complete a working set and finish the workout to start your chart.',
    summary: (caption: string, history: string) =>
      `Weight progress, ${caption.toLowerCase()}, oldest to newest. ${history}.`,
  },
  calendar: {
    monthYear: (month: string, year: number) => `${month} ${String(year)}`,
    dayTitle: (weekday: string, day: number, month: string) => `${weekday} ${String(day)} ${month}`,
    workouts: (n: number) => `${String(n)} ${n === 1 ? 'workout' : 'workouts'}`,
    noWorkout: 'no workout',
    today: 'today',
    noneThisMonth: 'No workouts yet this month',
    noneIn: (month: string) => `No workouts in ${month}`,
  },
  achievements: {
    categories: {
      milestones: { title: 'Milestones', detail: 'Workouts, records and tonnes' },
      strength: { title: 'Strength clubs', detail: 'Plates on the bar, and your own bodyweight' },
      consistency: { title: 'Consistency', detail: 'Showing up, week after week' },
      cardio: { title: 'Cardio & variety', detail: 'Machines, distance and new ground' },
      secret: { title: 'Secret', detail: 'There is one. It finds you.' },
    },
    units: {
      workouts: ['workout', 'workouts'],
      records: ['record', 'records'],
      reps: ['rep', 'reps'],
      weeks: ['week', 'weeks'],
      days: ['day', 'days'],
      machines: ['machine', 'machines'],
      exercises: ['exercise', 'exercises'],
      groups: ['muscle group', 'muscle groups'],
    } as Record<string, readonly [string, string]>,
    tons: 'tons',
    earned: (date: string) => `Earned ${date}`,
    nextToday: 'Next chance: today',
    nextTomorrow: 'Next chance: tomorrow',
    next: (when: string) => `Next chance: ${when}`,
    quietOne: (earned: string) => `${earned} · tap to see it`,
    quietMany: (count: number) => `${String(count)} achievements earned`,
    quietManyDetail: 'From workouts you logged before · tap to see them',
  },
};
