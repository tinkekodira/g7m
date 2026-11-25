import type { Messages } from '../en/index.js';

export const library: Messages['library'] = {
  addExercise: 'Añadir un ejercicio',
  exercises: 'Ejercicios',
  superset: 'Superserie',
  supersetOn: 'Elige en el orden del entrenamiento.',
  supersetOff: 'Uno tras otro, y luego descanso.',
  search: 'Buscar',
  searchPlaceholder: 'Sentadilla, banca, remo…',
  equipment: 'Material',
  selected: (count: number) => ` · ${String(count)} seleccionados`,
  equipmentHint:
    'Sin selección se muestra todo. Si eliges algunos, solo verás lo que puedes hacer con exactamente eso: cada pieza que necesita un ejercicio tiene que estar marcada.',
  count: (count: number) => (count === 1 ? '1 ejercicio' : `${String(count)} ejercicios`),
  bestMatches: 'Mejores coincidencias primero',
  mostUsed: 'Más usados primero · Últimos 90 días',
  chartKey:
    'Peso por entrenamiento · Últimas 6 sesiones. Mejor serie efectiva; + lastre, − asistencia, PC peso corporal.',
  confirm: (count: number) => `Confirmar (${String(count)})`,
  cardio: 'Cardio',
  compound: 'Compuesto',
  isolation: 'Aislamiento',
  recommended: 'Recomendado',
  noneOnDevice:
    'Aún no hay ejercicios en este dispositivo. Llegan con la primera sincronización: abre la app una vez con conexión y se quedan para siempre.',
  noMatch: 'Nada coincide con todos esos filtros.',
  clearFilters: 'Quitar filtros',
  muscleFilters: 'Filtros de músculos',
  all: 'Todos',
  favourite: 'Favorito',
  favouriteMark: '(favorito)',
  kit: {
    label: 'Con qué entrenas',
    bodyweight: 'Peso corporal',
    both: 'Todo',
    gym: 'Gimnasio',
  },
  stepper: {
    decrease: (label: string) => `Reducir ${label}`,
    increase: (label: string) => `Aumentar ${label}`,
  },
  detail: {
    missing: (slug: string) =>
      `No hay ningún ejercicio llamado ${slug} en este dispositivo. Puede que se haya renombrado o que aún no se haya sincronizado.`,
    unknownMuscle: 'Músculo desconocido',
    roles: { primary: 'Motor principal', secondary: 'Ayuda', stabilizer: 'Estabiliza' },
    alsoCalled: (aliases: string) => `También llamado ${aliases}`,
    difficulty: { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' },
    oneSide: 'Un lado cada vez',
    timed: 'Se mantiene por tiempo',
    startingPoint: 'Punto de partida',
    seconds: ' s',
    suggestedHold: 'Tiempo sugerido',
    suggestedReps: 'Repeticiones sugeridas',
    rest: 'Descanso entre series',
    restCompound: 'Más largo: es un compuesto',
    restIsolation: 'Más corto: es un aislamiento',
    restMinutes: (minutes: number) => `${String(minutes)} min`,
    restSeconds: (seconds: number) => `${String(seconds)} s`,
    cues: 'Claves',
    muscles: 'Músculos trabajados',
    cardioMuscles:
      'El cardio trabaja el corazón y los pulmones más que cualquier músculo, así que no cuenta en el mapa del cuerpo: veinte minutos en una máquina no son veinte series de nada.',
    notRecorded: 'No registrado para este ejercicio.',
    howTo: 'Cómo se hace',
    mistakes: 'Errores comunes',
    recentWeights: 'Tus pesos recientes',
    equipment: 'Material',
    noEquipment: 'Nada en absoluto.',
    whatYouLog: 'Qué registras',
    logged: (fields: string) =>
      `${fields} Las calorías se estiman a partir de eso y de tu peso corporal, o puedes escribir la cifra de la máquina.`,
    itsTime: 'su tiempo',
    eachBout: (fields: readonly string[]) => {
      const spoken =
        fields.length === 1
          ? fields[0]
          : `${fields.slice(0, -1).join(', ')} y ${fields.at(-1) ?? ''}`;
      return `Cada bloque registra ${spoken ?? ''}.`;
    },
    video: 'Vídeo',
    videoNeedsConnection: 'Necesita conexión. Todo lo que hay por encima de esta línea, no.',
    oneRepMax: 'Tu 1RM estimado',
    on: (set: string, date: string) => `${set} el ${date}`,
    nothingRecent: (weeks: number, source: string) =>
      `Nada en las últimas ${String(weeks)} semanas, así que esta es tu mejor marca de siempre, de ${source}.`,
    from: (source: string) => `De ${source}.`,
    bodyweightIncluded: ' Incluye tu peso corporal.',
    bestEver: (estimate: string, source: string) => `Mejor de siempre: ${estimate}, de ${source}.`,
    epley:
      'Calculado con la fórmula de Epley a partir de tu mejor serie de 12 repeticiones o menos. Una estimación para elegir pesos de trabajo, no un número para ir a probar.',
    seeTrend: 'Ver la evolución',
    playDemo: 'Reproducir demostración',
    pauseDemo: 'Pausar demostración',
    musclesLabel: (muscles: string) =>
      `Músculos trabajados: ${muscles}. Vistas frontal y posterior.`,
    front: 'Frente',
    back: 'Espalda',
  },
  learn: {
    title: 'Aprender',
    modes: { explore: 'Explorar', heatmap: 'Lo que he entrenado' },
    heatmapIntro: (weeks: number) => `Lo que has entrenado en ${String(weeks)} semanas.`,
    exploreIntro: 'Toca un músculo para ver qué lo entrena.',
    plates: 'Discos',
    noMuscles:
      'Aún no hay músculos en este dispositivo, así que no se puede tocar nada del modelo. Llegan con la primera sincronización: abre la app una vez con conexión y se quedan para siempre.',
    bodyView: 'Vista del cuerpo',
    hint: 'Arrastra para girar. Toca un músculo.',
    chooseMuscle: 'Elige un músculo',
    muscleExercises: 'Ejercicios del músculo',
    explore: 'Explorar músculos',
    exploreHint: 'Toca el cuerpo o elige un músculo para encontrar ejercicios.',
    browseAll: 'Ver todos los ejercicios',
    worthAdding: 'Merece la pena añadir',
    lastWeeks: (weeks: number) => `Últimas ${String(weeks)} semanas`,
    worthAddingHint:
      'Los grupos más alejados de su objetivo semanal, y un ejercicio que trabaja cada uno.',
    behind: (group: string, sets: number) => `${group} · faltan ${String(sets)} series`,
    working: 'Calculando lo que has entrenado…',
    heatNote:
      'El color es el volumen relativo a tu músculo más trabajado: lo que más entrenaste, no si entrenaste lo suficiente.',
    heatEmpty:
      'Aún no hay nada registrado en las últimas cuatro semanas. Termina un entrenamiento y aparecerá aquí.',
    placeholderModel:
      'La figura se genera a partir de orígenes e inserciones: el modelo anatómico con licencia no está en esta versión. Todo lo demás de esta pantalla es real.',
    sculptedModel: 'Un cuerpo esculpido, dividido entre los músculos que llegan a la piel.',
    notInCatalogue: 'Ese músculo aún no está en el catálogo de este dispositivo.',
    clear: 'Borrar',
    nothingTrains: 'Nada del catálogo lo entrena todavía.',
    alsoWorked: 'También trabajado',
    alsoWorkedHint: 'Aquí trabaja como músculo de apoyo, no como el principal.',
  },
  plates: {
    title: 'Calculadora de discos',
    intro: 'Qué va en cada lado, en los tamaños que reconoces.',
    weightOnBar: 'Peso en la barra',
    ezWeighs: 'La barra Z de este gimnasio pesa',
    hidden: (count: number) =>
      `${count === 1 ? 'Un disco está oculto' : `${String(count)} discos están ocultos`} porque tu gimnasio no ${count === 1 ? 'lo' : 'los'} tiene.`,
    bar: 'Barra',
    ezBar: 'Barra Z',
    tooMuch:
      'Eso es más disco del que cabe en el manguito de esta barra. Prueba con menos discos, menos peso o una barra más larga.',
    justBar: (weight: string, unit: string) => `Solo la barra: ${weight} ${unit}, sin nada.`,
    lighter: (weight: string, unit: string) =>
      `Menos que la barra sola, que pesa ${weight} ${unit}.`,
    eachEnd: 'Cada lado',
    onBar: (weight: string, unit: string) => `en una barra de ${weight} ${unit}`,
    closest: (total: string, short: string, unit: string) =>
      `: lo más cercano con estos discos es ${total} ${unit}, faltan ${short} ${unit}`,
    colours: 'Los colores',
    coloursHint: 'Qué disco es cuál, en la barra y en el soporte.',
    available: 'Discos disponibles',
    availableHint:
      'Qué discos tiene este gimnasio. Un disco desmarcado queda fuera de la barra, del cálculo y de los colores de arriba.',
  },
};
