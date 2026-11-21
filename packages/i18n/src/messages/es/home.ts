import type { Messages } from '../en/index.js';

type Region = 'legs' | 'arms' | 'shoulders' | 'back' | 'chest' | 'core';

const plural = (count: number, one: string, many: string): string =>
  `${String(count)} ${count === 1 ? one : many}`;

const REGION: Record<Region, string> = {
  legs: 'Piernas',
  arms: 'Brazos',
  shoulders: 'Hombros',
  back: 'Espalda',
  chest: 'Pecho',
  core: 'Core',
};

export const home: Messages['home'] = {
  yourProfile: 'Tu perfil',
  thisMonth: 'Este mes',
  quickAccess: 'Acceso rápido',
  stillOpen: 'Aún abierto',
  inProgress: 'En curso',
  openIt: 'Abrirlo',
  today: {
    label: 'Entrenamiento de hoy',
    noGoalTitle: 'Consigue un plan hecho para ti',
    noGoalBody:
      'Elige un objetivo y cuántos días entrenas. Se tarda unos diez segundos, y cada sesión a partir de ahí se construye con lo que registras.',
    chooseGoal: 'Elegir un objetivo',
    working: 'Preparando la sesión de hoy…',
    minutes: (minutes: number) => `${String(minutes)} min`,
    sets: (sets: number) => `${String(sets)} ${sets === 1 ? 'serie' : 'series'}`,
    doneTitle: 'Listo por hoy',
    trainedToday: (parts: string) => `Entrenado hoy · ${parts}`,
    doneBody:
      'El descanso es donde el trabajo de hoy se convierte en progreso. La sesión de mañana se construye a partir de él.',
    settingUp: 'Preparando…',
    trainAgain: 'Entrenar otra vez',
    weekTitle: 'Has completado la semana',
    weekBody:
      'Todo lo que trabajaría la sesión de hoy ya tuvo sus series en los últimos siete días. Otra sesión ahora cuesta más recuperación de la que aporta.',
    trainAnyway: 'Entrenar igualmente',
    summary: (exercises: number, sets: number) =>
      `${String(exercises)} ejercicios · ${String(sets)} series`,
    about: (minutes: number) => ` · unos ${String(minutes)} min`,
    muscleGroups: 'Grupos musculares',
    start: 'Empezar entrenamiento',
    seePlan: 'Ver el plan',
  },
  tiles: {
    plan: 'Plan de hoy',
    planDetail: 'Lo que sugiere la app',
    continue: 'Continuar el entrenamiento',
    start: 'Empezar un entrenamiento',
    continueDetail: 'Volver a tu sesión',
    startDetail: 'Elige una rutina o empieza en blanco',
    calendar: 'Calendario',
    calendarDetail: 'Los días que entrenaste',
    browse: 'Ver ejercicios',
    browseDetail: 'Toda la biblioteca',
    progress: 'Progreso',
    progressDetail: 'Cómo va tu entrenamiento',
  },
  sync: {
    lost: 'Algunos cambios no llegaron al servidor',
    stopped: 'La sincronización se ha detenido',
    lostDetail: 'Están en este teléfono pero no se sincronizarán.',
    stoppedDetail: 'Todo sigue guardado en este teléfono.',
    see: 'Ver qué pasó',
  },
  cards: {
    records: 'Récords personales',
    workouts: 'Entrenamientos',
    muscles: 'Grupos musculares',
    activity: 'Fuerza y actividad',
    slide: (name: string, position: number, total: number) =>
      `${name}, ${String(position)} de ${String(total)}`,
    workoutsLabel: (total: number, heading: string, detail: string) =>
      `Entrenamientos este mes: ${String(total)} completados. ${heading}. ${detail}`,
    yourWorkouts: 'Tus entrenamientos',
    completed: 'completados',
    workoutsSummary: (total: number, current: string, previous: number, previousName: string) =>
      `${String(total)} entrenamientos en ${current} hasta ahora, frente a ${String(previous)} a estas alturas de ${previousName}.`,
    musclesLabel: (sets: number, groups: number, heading: string, detail: string) =>
      `Grupos musculares este mes: ${String(sets)} ${sets === 1 ? 'serie' : 'series'} en ${String(groups)} ${groups === 1 ? 'grupo' : 'grupos'}. ${heading}. ${detail}`,
    groups: (count: number) => (count === 1 ? 'grupo' : 'grupos'),
    setsWord: (count: number) => (count === 1 ? 'serie' : 'series'),
    noSets: 'Aún no hay series este mes.',
    activityLabel: (
      workouts: number,
      time: string,
      perWeek: string,
      lifted: string,
      range: string,
      heading: string,
      detail: string,
    ) =>
      `Fuerza y actividad este mes: ${String(workouts)} ${workouts === 1 ? 'entrenamiento' : 'entrenamientos'}, ${time} entrenando, ${perWeek} por semana, ${lifted} levantados. Comparado con ${range}. ${heading}. ${detail}`,
    strengthActivity: 'Fuerza y actividad',
    firstMonth: 'Primer mes',
    comparedWith: 'Comparado con',
    range: (month: string, through: number) => `1–${String(through)} de ${month}`,
    statWorkouts: 'Entrenamientos',
    trainingTime: 'Tiempo entrenando',
    perWeek: 'Por semana',
    volumeLifted: 'Volumen levantado',
    recordsLabel: (count: number, heading: string, detail: string) =>
      `Récords personales este mes: ${String(count)} ${count === 1 ? 'nueva marca' : 'nuevas marcas'}. ${heading}. ${detail}`,
    newBests: (count: number) => (count === 1 ? 'nueva marca' : 'nuevas marcas'),
    exercise: 'Ejercicio',
    firstTime: 'Primera vez',
    onYourBest: (weight: string) => `${weight} sobre tu mejor marca`,
    best: (weight: string) => `Mejor ${weight}`,
    sameAsLast: 'Igual que el mes pasado',
    noneLast: 'Ninguno el mes pasado',
    up: 'más',
    down: 'menos',
    yourMonth: 'Tu mes',
    today: 'Hoy',
    monthStart: (month: string) => `1 de ${month}`,
    firstTitle: 'Tu primer entrenamiento empieza la gráfica',
    firstBody:
      'Registra uno y esto se llenará: cada cuánto entrenas, qué músculos trabajas y cuánto levantas, mes a mes.',
    logWorkout: 'Registrar un entrenamiento',
  },
  insights: {
    workouts: {
      start: {
        heading: 'Tu mes empieza con un entrenamiento',
        detail: 'Registra una sesión y esta línea empezará a subir.',
      },
      notYet: {
        heading: 'Aún no hay nada registrado este mes',
        detail: (previous: number) =>
          `El mes pasado hiciste ${plural(previous, 'entrenamiento', 'entrenamientos')}. Hoy es un buen día para empezar.`,
      },
      firstMonth: {
        heading: 'Tu primer mes está en marcha',
        detail: (workouts: number) =>
          `${plural(workouts, 'entrenamiento', 'entrenamientos')} hasta ahora. El mes que viene tendrá que superarlo.`,
      },
      ahead: {
        heading: 'Vas lanzado',
        detail: (by: number) =>
          `${plural(by, 'entrenamiento más', 'entrenamientos más')} que a estas alturas del mes pasado.`,
      },
      level: {
        heading: 'Igual que el mes pasado',
        detail: (workouts: number) =>
          `${plural(workouts, 'entrenamiento', 'entrenamientos')}, los mismos que a estas alturas del mes pasado.`,
      },
      behind: {
        heading: 'Un poco por detrás del mes pasado',
        detail: (by: number) =>
          `${plural(by, 'entrenamiento', 'entrenamientos')} menos que a estas alturas.`,
      },
    },
    muscles: {
      none: {
        heading: 'Aún no hay series registradas este mes',
        detail: 'Cada serie que registres aparecerá aquí, por grupo muscular.',
      },
      early: {
        heading: 'El cuadro se va completando',
        detail: (sets: number) =>
          `${plural(sets, 'serie', 'series')} hasta ahora. Unos cuantos entrenamientos más y se verá el equilibrio.`,
      },
      neglected: {
        atLeast: (region: Region, days: number) =>
          `${REGION[region]}: nada en ${String(days)} días`,
        exactly: (region: Region, days: number) =>
          `${REGION[region]}: sin entrenar en ${String(days)} días`,
        detail: 'Merece un hueco en tu próximo entrenamiento.',
      },
      lopsided: {
        heading: (region: Region, percent: number) =>
          `${REGION[region]}: el ${String(percent)} % de tus series`,
        detail: 'Repartir el trabajo evita que el resto se quede atrás.',
      },
      balanced: {
        heading: 'Bien equilibrado',
        detail: 'Este mes estás entrenando todos los grupos musculares principales.',
      },
      focused: {
        heading: (regions: readonly Region[]) =>
          `Sobre todo ${regions.map((region) => REGION[region].toLowerCase()).join(' y ')} hasta ahora`,
        detail: 'El resto tendrá su turno a lo largo del mes.',
      },
    },
    activity: {
      quiet: {
        heading: 'Tu mes te espera',
        detail: 'El tiempo, el volumen y el ritmo aparecerán tras tu primer entrenamiento.',
      },
      stronger: {
        heading: 'Estás levantando más',
        detail: (percent: number) =>
          `Un ${String(percent)} % más de peso movido que a estas alturas del mes pasado.`,
      },
      consistent: {
        heading: 'Gran constancia',
        detail: (perWeek: string) => `Unos ${perWeek} por semana. Estás apareciendo, y se nota.`,
      },
      catchUp: {
        heading: (by: number) =>
          by === 1
            ? 'Un entrenamiento cierra la brecha'
            : `${String(by)} entrenamientos para ponerte al día`,
        detail: 'Por detrás del ritmo del mes pasado a estas alturas, con tiempo para recuperarlo.',
      },
      steady: {
        heading: 'Un mes constante',
        detail: 'Sigue así y la tendencia se verá aquí.',
      },
    },
    records: {
      oneLift: 'Un ejercicio',
      none: {
        heading: 'Aún no hay ejercicios registrados este mes',
        detail: 'Tus series más pesadas de este mes aparecerán aquí, frente a tu mejor marca.',
      },
      new: {
        heading: (count: number) =>
          count === 1 ? 'Una nueva marca personal' : `${String(count)} nuevas marcas personales`,
        detail: (name: string) => `${name}: más pesado que nunca. Te estás haciendo más fuerte.`,
      },
      first: {
        heading: 'Tus primeras marcas ya están',
        detail: (count: number) =>
          `${String(count)} ${count === 1 ? 'ejercicio' : 'ejercicios'} que superar a partir de aquí. Sube el peso y aparecerán como nuevos récords.`,
      },
      close: {
        heading: (weight: string) => `A ${weight} de tu mejor marca`,
        detail: (name: string) => `${name} está casi. Un buen día y lo tendrás.`,
      },
      holding: {
        heading: 'Tus mejores marcas siguen en pie',
        detail: 'Una serie más pesada en cualquier ejercicio este mes aparecerá aquí.',
      },
    },
  },
};
