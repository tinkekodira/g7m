import type { Messages } from '../en/index.js';

const plural = (count: number, one: string, many: string): string =>
  `${String(count)} ${count === 1 ? one : many}`;

const lower = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

export const workout: Messages['workout'] = {
  notOnDevice: 'Ese entrenamiento no está en este dispositivo.',
  progress: 'Progreso',
  editingClosed: 'Edición cerrada',
  editWindow: 'Los entrenamientos se pueden editar durante 2 horas después de terminarlos.',
  details: 'Detalles del entrenamiento',
  boutRemoved: 'Bloque eliminado.',
  titleEdit: 'Editar entrenamiento',
  titlePast: 'Entrenamiento pasado',
  title: 'Entrenamiento',
  elapsed: 'transcurrido',
  lifted: (weight: string) => `${weight} levantados`,
  calendar: 'Calendario',
  editingHint:
    'Guarda cada serie cambiada con Guardar o con el check. La edición se cierra 2 horas después de terminar.',
  uncounted: (sets: number) =>
    `${sets === 1 ? 'Una serie no cuenta' : `${String(sets)} series no cuentan`} en el total: necesitan un peso corporal con el que medirse.`,
  addExercise: '+ Añadir un ejercicio',
  doneEditing: 'Terminar edición',
  finish: 'Terminar entrenamiento',
  confirmDiscard: '¿Descartar este entrenamiento y todo lo registrado en él?',
  discard: 'Descartar',
  removeTitle: (name: string | null) => `¿Quitar ${name ?? 'este ejercicio'}?`,
  exercise: 'Ejercicio',
  removal: {
    nothing: 'Aún no hay nada registrado en él.',
    one: (bout: boolean) => `${bout ? 'El bloque' : 'La serie'} que registraste se va con él.`,
    many: (count: number, bout: boolean) =>
      `${bout ? 'Los' : 'Las'} ${String(count)} ${bout ? 'bloques' : 'series'} que registraste se van con él.`,
  },
  removed: {
    drop: 'Drop eliminado.',
    set: 'Serie eliminada.',
    setWithDrops: (drops: number) =>
      `Serie eliminada, con ${String(drops)} ${drops === 1 ? 'drop' : 'drops'}.`,
    exercise: (name: string) => `${name} eliminado.`,
    exerciseWithSets: (name: string, sets: number) =>
      `${name} eliminado, con ${String(sets)} ${sets === 1 ? 'serie' : 'series'}.`,
  },
  superset: {
    label: 'Superserie',
    heading: (count: number) => `Superserie · ${String(count)} ejercicios`,
    ungroup: 'Desagrupar',
    addRound: 'Añadir ronda',
  },
  summary: {
    label: 'Resumen del entrenamiento',
    elapsed: (hours: number, minutes: number, seconds: number) =>
      `${String(hours)} ${hours === 1 ? 'hora' : 'horas'} ${String(minutes)} minutos ${String(seconds)} segundos transcurridos`,
    completedSets: 'Series efectivas completadas: ',
    sets: (count: number) => `${String(count)} ${count === 1 ? 'serie' : 'series'}`,
  },
  start: {
    title: 'Entrenar',
    nothing:
      'Nada en curso. Empieza un entrenamiento y añade ejercicios sobre la marcha: todo se guarda en este teléfono en cuanto tocas, haya cobertura o no.',
    button: 'Empezar un entrenamiento',
  },
  bodyweight: {
    title: '¿Cuánto pesas?',
    body: 'Una dominada es mover tu propio peso corporal. Sin este número, esas series se pueden registrar pero no medir, así que no contarían para nada.',
    label: (unit: string) => `Peso corporal (${unit})`,
  },
  unknownExercise: 'Ejercicio desconocido',
  thatLift: 'ese ejercicio',
  elsewhere: (gym: string | null, set: string) =>
    `Primera vez en esta máquina aquí. La última vez ${gym === null ? 'en otro sitio' : `en ${gym}`}: ${set}.`,
  noSets: 'Aún no hay series.',
  advice: (reps: number, weight: string, next: string) =>
    `${String(reps)} reps con ${weight}: prueba ${next} la próxima vez`,
  warmUp: 'Calentamiento',
  addSet: 'Añadir serie',
  ramp: (count: number, from: string, to: string) =>
    `Añade ${String(count)} ${count === 1 ? 'serie' : 'series'} de ${from} hasta ${to}`,
  effort: {
    question: 'En esa última serie, ¿cuántas más podrías haber hecho?',
    none: 'Ninguna',
  },
  set: {
    deleteRow: (title: string) => `Eliminar ${lower(title)}`,
    dropAfter: (title: string) => `Drop tras ${lower(title)}`,
    drop: 'Drop',
    last: (set: string) => `Última: ${set}`,
    load: (title: string) => `Carga de ${lower(title)}`,
    bodyweight: 'Peso corporal',
    addedWeight: 'Lastre',
    durationFormat: (title: string) => `Formato de duración de ${lower(title)}`,
    seconds: 'Segundos',
    minSec: 'Min + s',
    minutes: 'Minutos',
    reps: 'Reps',
    saveRow: (title: string) => `Guardar ${lower(title)}`,
    markSkipped: 'Marcar como omitida',
  },
  rows: {
    warmup: (number: number) => `Calentamiento ${String(number)}`,
    set: (number: number) => `Serie ${String(number)}`,
    drop: 'Drop',
    dropNumbered: (number: number) => `Drop ${String(number)}`,
    tickWarmup: (done: boolean, number: number) =>
      `${done ? 'Deshacer' : 'Completar'} calentamiento ${String(number)}`,
    tickDrop: (done: boolean, number: number, parent: number) =>
      `${done ? 'Deshacer' : 'Completar'} drop ${String(number)} de la serie ${String(parent)}`,
    tickSet: (done: boolean, number: number) =>
      `${done ? 'Deshacer' : 'Completar'} serie ${String(number)}`,
  },
  stillTraining: {
    title: '¿Sigues entrenando?',
    idle: (minutes: number) =>
      `Nada marcado en ${String(minutes)} ${minutes === 1 ? 'minuto' : 'minutos'}.`,
    keepGoing: 'Seguir',
    finish: 'Terminar',
  },
  rest: {
    over: 'Descanso terminado',
    resting: 'Descansando',
    less: (label: string) => `${label} menos de descanso`,
    more: (label: string) => `${label} más de descanso`,
    dismiss: 'Descartar',
  },
  record: {
    badge: 'PR',
    heaviestShort: 'La más pesada',
    heaviest: (name: string) => `${name}: tu serie más pesada`,
    heaviestDetail: (now: string, gain: string, unit: string) =>
      `${now} ${unit}: ${gain} ${unit} más que tu mejor marca anterior.`,
    bestShort: 'Tu mejor serie',
    best: (name: string) => `${name}: tu mejor serie`,
    bestDetail: (now: string, before: string, unit: string, beforeUnit: string) =>
      `Máximo estimado ${now} ${unit}, antes ${before} ${beforeUnit}.`,
  },
  open: {
    past: 'Termina de registrar tu entrenamiento pasado',
    stale: 'Dejaste un entrenamiento abierto',
    continue: 'Continuar tu entrenamiento',
    exercises: (count: number) => plural(count, 'ejercicio', 'ejercicios'),
    setsDone: (count: number) => `${plural(count, 'serie hecha', 'series hechas')}`,
    justStarted: 'recién empezado',
    openFor: (hours: number) => `abierto desde hace ${plural(hours, 'hora', 'horas')}`,
    minutesIn: (minutes: number) => `${String(minutes)} min dentro`,
    hoursIn: (hours: number, minutes: number) => `${String(hours)} h ${String(minutes)} min dentro`,
  },
  autoFinish: {
    title: 'Hemos terminado tu entrenamiento',
    closed: (when: string) =>
      `No marcaste nada en un rato, así que cerramos por ti tu entrenamiento de ${when}.`,
    closedAt: (when: string, at: string) =>
      `No marcaste nada en un rato, así que tu entrenamiento de ${when} se cerró en tu última serie, a las ${at}.`,
    allSaved: 'Todo lo que registraste está guardado.',
    saved: (parts: string) => `Guardado: ${parts}.`,
    exercises: (count: number) => plural(count, 'ejercicio', 'ejercicios'),
    sets: (count: number) => plural(count, 'serie', 'series'),
    bouts: (count: number) => plural(count, 'bloque', 'bloques'),
    minutes: (minutes: number) => `${String(minutes)} min`,
    okay: 'Vale',
    see: 'Verlo',
  },
  cardio: {
    label: 'Cardio',
    needsBodyweight:
      'Las calorías necesitan tu peso corporal. Añádelo en Tu perfil y se calcularán.',
    noBouts: 'Aún no hay bloques. Añade uno cuando te subas.',
    addBout: 'Añadir bloque',
    timeFormat: 'El tiempo va en minutos, o minutos:segundos como 25:30.',
    notANumber: (field: string) => `${field} no es un número.`,
    bout: (number: number) => `Bloque ${String(number)}`,
    boutLabel: (number: number) => `bloque ${String(number)}`,
    time: 'Tiempo',
    start: 'Iniciar',
    stop: 'Parar',
    calories: 'Calorías',
    fromMachine: 'De la máquina. Bórralo para usar la estimación.',
    addTime: 'Añade el tiempo para estimarlas, o escribe lo que marca la máquina.',
    estimate: (calories: string, source: string) =>
      `${calories}. ${source} Escribe la cifra de la máquina para usarla en su lugar.`,
    undo: (label: string) => `Deshacer ${label}`,
    complete: (label: string) => `Completar ${label}`,
    saveWithoutTicking: 'Guardar sin marcar',
    fields: {
      distance: (unit: string) => `Distancia (${unit})`,
      speed: (unit: string) => `Velocidad (${unit})`,
      incline: 'Inclinación (%)',
      level: 'Nivel',
      watts: 'Vatios medios',
      floors: 'Pisos',
    },
    sources: {
      machine: 'De la máquina.',
      treadmill: 'Estimado a partir de la velocidad y la inclinación.',
      power: 'Estimado a partir de los vatios.',
      pace: 'Estimado a partir de tu ritmo.',
      stairs: 'Estimado a partir de los pisos subidos.',
      met: (better: string) => `Una estimación aproximada solo con el tiempo. ${better}`,
    },
    better: {
      treadmill: 'Añade la velocidad para una mejor.',
      bike: 'Añade los vatios para una mejor.',
      rower: 'Añade la distancia o los vatios para una mejor.',
      ski_erg: 'Añade la distancia o los vatios para una mejor.',
      stair_climber: 'Añade los pisos para una mejor.',
    },
    floors: (count: number) => `${String(count)} pisos`,
    nothing: 'Nada registrado',
  },
  gym: {
    change: (name: string | null) => `${name ?? 'Ningún gimnasio elegido'}, cambiar gimnasio`,
    choose: 'Elige un gimnasio',
    where: '¿Dónde entrenas?',
    which: 'Qué gimnasio',
    compared:
      'Las máquinas y poleas se comparan con su propio historial en cada gimnasio. Las series que aún no has hecho pasan a los números del nuevo gimnasio.',
    manage: 'Gestionar gimnasios',
  },
  startDialog: {
    title: 'Empezar un entrenamiento',
    routines: 'Tus rutinas',
    chooseRoutine: 'Elige una rutina',
    loading: 'Cargando rutinas…',
    none: 'Aún no hay rutinas. Termina un entrenamiento y guárdalo como rutina para usarlo aquí la próxima vez.',
    settingUp: 'Preparando…',
    blank: 'Empezar un entrenamiento en blanco',
    dontShow: 'No volver a mostrar',
    dontShowHint: 'Empezar siempre en blanco. Puedes cambiarlo en Ajustes.',
    saved: 'Rutinas guardadas',
    page: (index: number, total: number) =>
      `Página de rutinas ${String(index)} de ${String(total)}`,
    start: (name: string) => `Empezar ${name}`,
    choosePage: 'Elegir página de rutinas',
    showPage: (index: number, total: number) =>
      `Mostrar página de rutinas ${String(index)} de ${String(total)}`,
  },
  plates: {
    loaded: (plates: string) => `Una barra cargada con ${plates} en cada lado`,
    empty: (bar: string, unit: string) => `Una barra vacía de ${bar} ${unit}`,
    bar: (weight: string, unit: string) => `Barra de ${weight} ${unit}`,
    lighter: (bar: string) => `Menos que una ${lower(bar)}`,
    just: (bar: string) => `Solo la ${lower(bar)}`,
    eachSide: 'Cada lado',
  },
  previousSet: {
    seconds: (reps: number) => `${String(reps)} s`,
    reps: (reps: number) => `${String(reps)} ${reps === 1 ? 'rep.' : 'reps.'}`,
  },
};
