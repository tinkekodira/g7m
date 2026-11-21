import type { Messages } from '../en/index.js';

type Stat = 'workouts' | 'lifted' | 'sets' | 'minutes';
type Period = 'week' | 'month';

const STAT: Record<Stat, string> = {
  workouts: 'entrenamientos',
  lifted: 'peso',
  sets: 'series',
  minutes: 'tiempo',
};
const WHEN: Record<Period, string> = { week: 'esta semana', month: 'este mes' };
const summary = (improved: boolean, period: Period): Record<Stat, string> => ({
  workouts: `${improved ? 'Más mejora: ' : 'Más '}${STAT.workouts} ${WHEN[period]}`,
  lifted: `${improved ? 'Más mejora: ' : 'Más '}${STAT.lifted} ${WHEN[period]}`,
  sets: `${improved ? 'Más mejora: ' : 'Más '}${STAT.sets} ${WHEN[period]}`,
  minutes: `${improved ? 'Más mejora: ' : 'Más '}${STAT.minutes} ${WHEN[period]}`,
});

export const friends: Messages['friends'] = {
  title: 'Amigos',
  nameless: 'Tu amigo',
  you: 'Tú',
  unknownExercise: 'Ejercicio desconocido',
  didNotGoThrough: 'No se pudo completar.',
  didNotSave: 'No se guardó. Vuelve a intentarlo.',
  couldNotLoad: 'No se pudo cargar.',
  addFriend: 'Añadir un amigo',
  profileUnavailable: 'Tu perfil no está disponible. Abre tu perfil y vuelve a intentarlo.',
  resultDismissed: 'Este resultado ya se ha descartado.',
  challengeHint: 'Reta a un amigo durante una semana: abre su página y elige una estadística.',
  tabs: {
    friends: 'Amigos',
    leaderboard: 'Clasificación',
    requests: 'Solicitudes',
    waiting: ' pendientes',
  },
  empty: {
    eyebrow: 'Amigos',
    title: 'Entrena con amigos',
    body: 'Comparte tu código con alguien con quien entrenes. Cuando te añada, veréis aquí la semana, las mejores marcas y los entrenamientos del otro.',
  },
  card: {
    levelShort: (level: number) => `Nv ${String(level)}`,
    level: (level: number) => `Nivel ${String(level)}`,
    workingOut: 'Entrenando',
    notSharing: 'No comparte su entrenamiento',
    lastWorkout: 'Último entrenamiento',
    bestLifts: 'Mejores marcas',
    noLifts: 'Aún no hay ejercicios registrados',
    thisWeek: 'Esta semana',
    today: ' (hoy)',
    streak: 'Racha: ',
    notLogged: (label: string, who: string) => `${label}: ${who} no lo ha registrado`,
    youNotLogged: (label: string, who: string, theirs: string) =>
      `${label}: ${who} ${theirs}; tú no lo has registrado`,
    levelWithYou: (label: string, who: string, theirs: string) =>
      `${label}: ${who} ${theirs}, igual que tú`,
    youAhead: (label: string, who: string, theirs: string, gap: string) =>
      `${label}: ${who} ${theirs}, le sacas ${gap}`,
    youBehind: (label: string, who: string, theirs: string, gap: string) =>
      `${label}: ${who} ${theirs}, te faltan ${gap}`,
  },
  status: {
    label: 'Compartir cuándo entreno',
    description: 'Tus amigos verán cuándo estás entrenando.',
  },
  when: {
    justNow: 'Ahora mismo',
    minutesAgo: (minutes: number) => `Hace ${String(minutes)} min`,
    hoursAgo: (hours: number) => `Hace ${String(hours)} h`,
  },
  requests: {
    none: 'No hay solicitudes pendientes. Cuando alguien te añada con tu código o te rete, aparecerá aquí para que aceptes.',
    accept: 'Aceptar',
    decline: 'Rechazar',
    acceptLabel: (name: string) => `Aceptar a ${name}`,
    declineLabel: (name: string) => `Rechazar a ${name}`,
  },
  code: {
    yours: 'Tu código',
    yoursLabel: (spelled: string) => `Tu código: ${spelled}`,
    copy: 'Copiar',
    share: 'Compartir',
    copied: 'Copiado.',
    copiedToPaste: 'Copiado, listo para pegar.',
    couldNotCopy: (code: string) => `No se pudo copiar. Tu código es ${code}.`,
    couldNotShare: (code: string) => `No se pudo compartir. Tu código es ${code}.`,
    shareTitle: 'Código de amigo de g7m',
    shareText: (code: string) => `Añádeme en g7m: mi código de amigo es ${code}`,
    theirs: 'Su código',
    sending: 'Enviando…',
    send: 'Enviar solicitud',
    typeFirst: 'Primero escribe el código de tu amigo.',
    shape: 'Un código de amigo tiene seis letras y números.',
    characters:
      'Los códigos de amigo nunca usan 0, O, 1, I ni L. Revisa el código y vuelve a intentarlo.',
    sent: 'Solicitud enviada.',
    sentTo: (who: string) => `Solicitud enviada a ${who}.`,
    nowFriends: (who: string | null) =>
      who === null
        ? 'Ya te había enviado una solicitud, así que ahora sois amigos.'
        : `${who} ya te había enviado una solicitud, así que ahora sois amigos.`,
    ownCode: 'Ese es tu propio código.',
    unknown: 'Nadie tiene ese código. Revísalo y vuelve a intentarlo.',
    alreadyFriends: (who: string | null) =>
      who === null ? 'Ya sois amigos.' : `Ya eres amigo de ${who}.`,
    alreadyRequested: (who: string | null) =>
      who === null ? 'Ya le enviaste una solicitud.' : `Ya le enviaste una solicitud a ${who}.`,
    tooMany: 'Son muchas solicitudes en una hora. Vuelve a intentarlo más tarde.',
  },
  reference: {
    seconds: (who: string, reps: string) => `${who}: ${reps} s`,
    reps: (who: string, reps: string) => `${who}: ${reps} reps`,
    assisted: (who: string, reps: string, weight: string) =>
      `${who}: ${reps} × ${weight} de asistencia`,
  },
  offline: {
    title: 'Estás sin conexión',
    body: 'Los amigos necesitan conexión. Tu propio entrenamiento sigue aquí, y esto se completará cuando vuelvas a estar en línea.',
  },
  name: {
    missingProfile:
      'Tu perfil aún no ha llegado a este teléfono. Espera un momento y vuelve a intentarlo.',
    title: '¿Cómo quieres que te llamen tus amigos?',
    body: 'Tus amigos ven tu nombre junto a tu entrenamiento. Puedes cambiarlo más tarde en Tu perfil.',
    label: 'Tu nombre',
  },
  page: {
    notSharing: 'No comparte su entrenamiento ahora mismo, o ya no está en tu lista de amigos.',
    headToHead: 'Cara a cara',
    nothingToCompare:
      'Aún no hay nada que comparar. Cuando los dos hayáis registrado el mismo ejercicio, aparecerá aquí.',
    exercise: 'Ejercicio',
    youAhead: (gap: string) => `Le sacas ${gap}`,
    theyAhead: (who: string, gap: string) => `${who} te saca ${gap}`,
    level: 'Empate',
    recent: 'Entrenamientos recientes',
    noRecent: 'Aún no hay entrenamientos terminados.',
    achievementsPending: (name: string) => `Aparecerá cuando ${name} vuelva a abrir la app`,
    noneEarned: 'Ninguno aún',
    earnedOf: (earned: number, total: number) =>
      `${String(earned)} de ${String(total)} conseguidos`,
    training: (name: string) => `Entrenamiento de ${name}`,
    lastWeeks: (weeks: number) => `Las últimas ${String(weeks)} semanas, en su cuerpo.`,
    nothingLogged: (weeks: number) => `Nada registrado en las últimas ${String(weeks)} semanas.`,
    bestsDescription: (name: string) =>
      `Lo más pesado que ha movido ${name} en cada ejercicio. Los ejercicios con peso corporal quedan fuera: su peso es privado.`,
    routines: 'Rutinas',
    noRoutines: 'Aún no hay rutinas guardadas.',
    showFewer: 'Mostrar menos',
    showAll: (count: number) => `Mostrar las ${String(count)}`,
    confirmRemove: (name: string) => `¿Quitar a ${name} de tus amigos? No se le avisará.`,
    moreOptions: 'Más opciones',
    remove: 'Quitar amigo',
    exercises: (count: number) => (count === 1 ? '1 ejercicio' : `${String(count)} ejercicios`),
  },
  session: {
    gone: 'Este entrenamiento ya no se comparte contigo.',
    label: (friend: string) => `Entrenamiento de ${friend}, abrir el perfil de ${friend}`,
    whose: (friend: string) => `Entrenamiento de ${friend}`,
    fromDevice: 'Guardado en este teléfono la última vez que lo abriste.',
    settingUp: 'Preparando…',
    doIt: 'Hacer este entrenamiento',
    finishFirst: 'Termina el entrenamiento que tienes abierto antes de empezar este.',
    openIt: 'Abrirlo',
    explain:
      'Sus ejercicios y series, con tus propios pesos de la última vez. Sus números aparecen junto a cada ejercicio como guía.',
  },
  routine: {
    gone: 'Esta rutina ya no se comparte contigo.',
    label: (name: string) => `Rutina de ${name}, abrir el perfil de ${name}`,
    whose: (name: string) => `Rutina de ${name}`,
    doIt: 'Hacer esta rutina',
    explain:
      'Sus ejercicios, series y rangos de repeticiones, con tus propios pesos de la última vez.',
    empty: 'Aún está vacía.',
    superset: 'Superserie',
  },
  board: {
    label: 'Clasificación',
    rankBy: 'Ordenar por',
    stat: 'Estadística',
    period: 'Periodo',
    done: 'Listo',
    change: 'Cambiar',
    nobody: 'Aún no hay con quién competir',
    nobodyBody: 'Cuando un amigo te añada, verás quién entrenó más esta semana y este mes.',
    stats: { workouts: 'Entrenamientos', lifted: 'Peso', sets: 'Series', minutes: 'Tiempo' },
    rankings: { most: 'Más', improved: 'Más mejora' },
    periods: { week: 'Esta semana', month: 'Este mes' },
    summary: {
      most: { week: summary(false, 'week'), month: summary(false, 'month') },
      improved: { week: summary(true, 'week'), month: summary(true, 'month') },
    },
    workouts: (count: string, n: number) =>
      n === 1 ? '1 entrenamiento' : `${count} entrenamientos`,
    sets: (count: string, n: number) => (n === 1 ? '1 serie' : `${count} series`),
    ofTraining: (time: string) => `${time} de entrenamiento`,
    lifted: (amount: string) => `${amount} levantados`,
    behind: (amount: string, who: string) => `${amount} por detrás de ${who}`,
    levelWith: (who: string) => `Empatado con ${who}`,
    ahead: (amount: string, who: string) => `${amount} por delante de ${who}`,
    ordinal: (rank: number): string => `${String(rank)}.º`,
    lastDay: 'Último día',
    daysLeft: (days: number) => `Quedan ${String(days)} días`,
    crowned: (improved: boolean, period: 'week' | 'month') =>
      `${improved ? 'Más mejora' : 'Ganador'} ${period === 'week' ? 'la semana pasada' : 'el mes pasado'}`,
    nothingYetToMeasure: 'Aún no hay con qué comparar',
    ofUsual: (score: number) => `${String(score)} % de lo habitual`,
    rowNew: (name: string) => `${name}: nuevo`,
    rowNewWhy: (name: string, period: 'week' | 'month') =>
      `${name}: nuevo, nada en las cuatro semanas anteriores a ${period === 'week' ? 'esta semana' : 'este mes'} con qué comparar`,
    rowNothing: (name: string) => `${name}: nada aún`,
    rowPlaced: (place: string, name: string, score: string) => `${place}, ${name}: ${score}`,
    moved: (up: boolean, by: number) =>
      `${up ? 'Sube' : 'Baja'} ${String(by)} ${by === 1 ? 'puesto' : 'puestos'} desde ayer`,
    new: 'Nuevo',
    usualWeek:
      '100 % es una semana habitual: la cuarta parte de lo que hizo cada uno en las cuatro semanas anteriores.',
    usualMonth:
      '100 % es un mes habitual: lo que hizo cada uno en las cuatro semanas anteriores, ajustado a la duración del mes.',
    weightCounts:
      'Peso × repeticiones en las series efectivas. En ejercicios con peso corporal como dominadas y fondos solo cuenta el lastre.',
    oneNotSharing: (name: string) =>
      `${name} no comparte su entrenamiento, así que no está en la clasificación.`,
    manyNotSharing: (count: number) =>
      `${String(count)} amigos no comparten su entrenamiento, así que no están en la clasificación.`,
    noPlace: 'Aún sin puesto',
    yourPlace: (rank: number) => `Vas ${String(rank)}.º`,
  },
  challenge: {
    title: {
      most: {
        workouts: 'Más entrenamientos',
        lifted: 'Más peso levantado',
        sets: 'Más series',
        minutes: 'Más tiempo entrenando',
      },
      improved: {
        workouts: 'Más mejora: entrenamientos',
        lifted: 'Más mejora: peso levantado',
        sets: 'Más mejora: series',
        minutes: 'Más mejora: tiempo entrenando',
      },
    },
    metric: {
      workouts: 'entrenamientos',
      lifted: 'peso levantado',
      sets: 'series',
      minutes: 'tiempo entrenando',
    },
    ofUsual: '% de lo habitual',
    underAnHour: 'Queda menos de una hora',
    hoursLeft: (hours: number) => (hours === 1 ? 'Queda 1 hora' : `Quedan ${String(hours)} horas`),
    daysLeft: (days: number) => `Quedan ${String(days)} días`,
    against: (title: string, name: string) => `${title}, contra ${name}`,
    sent: (when: string) => `Enviado ${when}`,
    ended: (when: string) => `Terminó ${when}`,
    waiting: (name: string) => `Esperando a que ${name} acepte`,
    challengedYou: (name: string) => `${name} te ha retado. Siete días, desde que aceptes.`,
    youWon: 'Has ganado',
    theyWon: (name: string) => `${name} ha ganado`,
    draw: 'Empate',
    unavailable: 'Resultado no disponible',
    finalizing: 'Calculando el resultado',
    sharingOff:
      'Compartir el entrenamiento está desactivado, así que este reto no se puede puntuar.',
    finalizingNote:
      'Damos 24 horas para que se sincronicen los entrenamientos sin conexión. Después, las puntuaciones son definitivas.',
    recovered: 'Resultado recuperado · basado en el entrenamiento disponible',
    excluded:
      'El entrenamiento no estaba disponible al cerrar las puntuaciones. Este resultado no cuenta en tu historial.',
    gotIt: 'Entendido',
    accept: 'Aceptar',
    decline: 'Rechazar',
    acceptLabel: (name: string) => `Aceptar el reto de ${name}`,
    declineLabel: (name: string) => `Rechazar el reto de ${name}`,
    takeBackLabel: (name: string) => `Retirar tu reto a ${name}`,
    takeBack: 'Retirarlo',
    resultUnchanged:
      'El entrenamiento no estaba disponible al cerrar las puntuaciones. Tu historial no cambia.',
    resultOf: (i: number, n: number) => `Resultado ${String(i)} de ${String(n)}`,
    view: 'Ver reto',
    nextResult: 'Siguiente resultado',
    later: 'Más tarde',
    resultAgainst: (title: string, name: string) => `${title} contra ${name}`,
    heading: 'Retos',
    challenge: (name: string) => `Retar a ${name}`,
    fromAccept: (name: string) => `Siete días, desde que ${name} acepte.`,
    explainImproved:
      'Siete días, cada uno contra sus propias últimas cuatro semanas, para que sea justo entrene quien entrene más.',
    explainMost: 'Siete días. Gana quien haga más.',
    send: 'Enviar reto',
    startsWhen: (name: string) => `Empieza cuando ${name} acepte.`,
    problems: {
      already_live: (name: string) => `Ya tienes un reto con ${name}. Uno cada vez.`,
      not_sharing: (name: string) =>
        `${name} no comparte su entrenamiento, así que un reto no se puede puntuar.`,
      you_not_sharing: (_name: string) =>
        'Activa compartir tu entrenamiento en Ajustes para participar en retos.',
      no_usual: (name: string) =>
        `${name} no tiene entrenamientos en las últimas cuatro semanas con qué comparar. Prueba con Más.`,
      you_no_usual: (_name: string) =>
        'No tienes entrenamientos en las últimas cuatro semanas con qué comparar. Prueba con Más.',
      not_friends: (name: string) => `${name} ya no está en tu lista de amigos.`,
      not_found: (_name: string) => 'Ese reto ya no existe.',
      too_many: (_name: string) => 'Demasiados retos enviados. Vuelve a intentarlo más tarde.',
      invalid: (_name: string) => 'Algo falló con ese reto. Vuelve a intentarlo.',
    },
  },
};
