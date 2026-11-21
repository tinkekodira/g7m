import type { Messages } from '../en/index.js';

const changes = (count: number): string => `${String(count)} ${count === 1 ? 'cambio' : 'cambios'}`;

export const settings: Messages['settings'] = {
  title: 'Ajustes',
  groups: { gym: 'En el gimnasio', app: 'App', account: 'Cuenta' },
  gyms: 'Gimnasios',
  tour: {
    title: 'Orientarte en la app',
    body: 'Vuelve a ver la introducción de cinco paradas cuando quieras.',
  },
  disclaimer:
    'Contenido informativo, no consejo médico. Consulta a un profesional antes de empezar un programa.',
  language: {
    title: 'Idioma',
    label: 'Idioma de la app',
    hint: 'Toda la app, ejercicios incluidos. Se guarda en tu cuenta, así que tus otros dispositivos lo siguen.',
  },
  appearance: {
    title: 'Apariencia',
    dark: 'Modo oscuro',
    darkOn: 'Desactívalo para el tema claro, más fácil de leer con luz de día.',
    darkOff: 'Desactivado: la app está en su tema claro.',
  },
  training: {
    title: 'Entrenamiento',
    recommendations: 'Recomendaciones de entrenamiento',
    recommendationsOn: 'Recibe el entrenamiento de hoy y sugerencias de ejercicios.',
    recommendationsOff: 'Desactivado: elige tus propios ejercicios, entrenamientos y rutinas.',
    startOptions: 'Mostrar opciones al empezar',
    startOptionsOn: 'Elige una rutina o empieza en blanco en este dispositivo.',
    startOptionsOff: 'Desactivado: empieza siempre entrenamientos en blanco en este dispositivo.',
  },
  units: {
    title: 'Unidades',
    weight: 'Peso',
    weightDetail: 'Para todos los pesos de la app.',
    weightUnit: 'Unidad de peso',
    kilograms: 'Kilogramos',
    pounds: 'Libras',
    note: 'Todo se guarda en kilogramos y solo se muestra en libras, así que cambiar de una a otra nunca altera un número que hayas registrado.',
  },
  plates: {
    title: 'Discos disponibles',
    yours: 'Los discos de tu gimnasio',
    detail: 'La misma lista que en Aprender → Discos. Un cambio aquí también se ve allí.',
    keepOne: 'Deja al menos un disco seleccionado.',
  },
  rest: {
    title: 'Temporizador de descanso',
    own: 'Fijar mis propios descansos',
    ownOn: 'Un tiempo para los compuestos y otro para los de aislamiento.',
    ownOff: 'Desactivado: cada ejercicio usa su descanso sugerido.',
    compound: 'Compuestos',
    compoundHint: 'Sentadillas, presses, remos, pesos muertos, dominadas.',
    isolation: 'Aislamiento',
    isolationHint: 'Curls, elevaciones, extensiones, aperturas.',
    step: 'Menos y más',
    stepHint: 'Lo que quitan y añaden los botones − y + del temporizador.',
    stepGroup: 'Paso del temporizador',
    smaller: 'Paso más pequeño',
    bigger: 'Paso más grande',
    sound: 'Sonido al terminar el descanso',
    soundOn:
      'Un aviso sonoro de tres segundos además de la vibración, mientras la app está abierta.',
    soundOff: 'Desactivado: el final del descanso solo vibra.',
    group: (label: string) => `Descanso en ${label.toLowerCase()}`,
    shorter: (label: string) => `Menos descanso en ${label.toLowerCase()}`,
    longer: (label: string) => `Más descanso en ${label.toLowerCase()}`,
  },
  friends: {
    title: 'Amigos',
    didNotSave: 'No se guardó.',
    share: 'Compartir mi entrenamiento con amigos',
    shareOff: 'Desactivado: tus amigos ven tu nombre y que no compartes.',
    shareOn:
      'Tus entrenamientos, mejores marcas, semana y cuándo estuviste en línea por última vez.',
    needConnection: 'Necesitas conexión para cambiar esto.',
  },
  feedback: {
    title: 'Enviar comentarios',
    intro:
      'Informa de un error, sugiere algo o simplemente di lo que piensas: llega directamente al desarrollador.',
    category: 'Categoría',
    bug: 'Error',
    idea: 'Idea',
    other: 'Otro',
    message: 'Mensaje',
    tooLong: (length: number, max: number) => `${String(length)}/${String(max)}: demasiado largo`,
    count: (length: number, max: number) => `${String(length)}/${String(max)}`,
    needConnection: 'Necesitas conexión para enviar comentarios.',
    thanks: 'Gracias, le ha llegado al desarrollador.',
    sending: 'Enviando…',
    send: 'Enviar comentarios',
    sentWith: 'Se envía con el correo de tu cuenta, la versión de la app y la plataforma.',
  },
  account: {
    title: 'Tu cuenta',
    noProfile: 'No existe ninguna fila de perfil para esta cuenta.',
    signedIn: 'Sesión iniciada',
    exercises: 'Ejercicios disponibles',
    muscles: 'Músculos en el modelo',
  },
  sync: {
    title: 'Sincronización',
    working: ' · trabajando…',
    status: 'Estado',
    connected: 'Conectado',
    connecting: 'Conectando',
    notSetUp: 'Sin configurar',
    offline: 'Sin conexión',
    exercises: 'Ejercicios en el dispositivo',
    muscles: 'Músculos en el dispositivo',
    equipment: 'Material en el dispositivo',
    profiles: 'Filas de tu perfil',
    workouts: 'Entrenamientos registrados',
    sets: 'Series registradas',
    phase: {
      unconfigured:
        'La sincronización no está configurada. Tus entrenamientos se guardan solo en este dispositivo.',
      idle: 'Sin empezar.',
      connecting: 'Conectando…',
      synced: 'Al día con el servidor.',
      offline:
        'Trabajando sin conexión. Tus entrenamientos se guardan aquí y se sincronizarán al reconectar.',
      offlineSince: (time: string) =>
        `Sin conexión desde las ${time}. Todo está guardado aquí y se sincronizará al reconectar.`,
    },
    lost: (count: number, detail: string) =>
      `${changes(count)} de este dispositivo no se ${count === 1 ? 'pudo' : 'pudieron'} guardar en el servidor. ${detail}`,
    refusedBug: 'El servidor los rechazó. Es un error: por favor, infórmalo.',
    rejected: 'Se rechazaron por no ser válidos y no se volverán a intentar.',
    jwks: 'El servicio de sincronización rechazó el inicio de sesión de este dispositivo. Su Client Auth necesita la URL de JWKS de Supabase para verificar el token. Todo sigue guardado aquí.',
    refusedAccount:
      'El servicio de sincronización rechazó esta cuenta. Todo sigue guardado en este dispositivo.',
    notFound: 'No se encontró el servicio de sincronización en la dirección configurada.',
    noRules: 'El servicio de sincronización no tiene reglas de sincronización utilizables.',
    couldNotConnect: (message: string) => `La sincronización no pudo conectar: ${message}`,
    uploadLost: (count: number, tables: string) =>
      `${changes(count)} no se ${count === 1 ? 'pudo' : 'pudieron'} guardar en el servidor (${tables}) y se ${count === 1 ? 'omitió' : 'omitieron'}. Todo lo demás se sincronizó.`,
    nothingToSync: 'Nada que sincronizar.',
    synced: (count: number) =>
      `${changes(count)} ${count === 1 ? 'sincronizado' : 'sincronizados'}.`,
  },
  storage: {
    title: 'Almacenamiento sin conexión',
    checking: 'Comprobando…',
    persistent: 'Persistente',
    granted: 'Concedido',
    refused: 'Denegado',
    unsupported: 'No compatible',
    unknown: 'Desconocido',
    space: 'Espacio disponible',
    used: 'Usado',
    unknownSize: 'desconocido',
    grantedDetail: 'Tus entrenamientos se guardan de forma permanente en este dispositivo.',
    deniedDetail:
      'Este dispositivo puede borrar tus datos sin conexión si se queda sin espacio o si no abres la app durante un tiempo. El inicio de sesión sigue disponible, así que no se pierde nada ya sincronizado.',
    unsupportedDetail: 'Este navegador no puede garantizar el almacenamiento sin conexión.',
    errorDetail: 'No se pudo comprobar el almacenamiento sin conexión de este dispositivo.',
  },
  device: {
    title: 'Dónde se está ejecutando',
    shell: 'Contenedor',
    platform: 'Plataforma',
    pointer: 'Puntero',
    fine: 'Preciso: con hover',
    coarse: 'Táctil: solo toques',
    web: 'Navegador web',
  },
  data: {
    title: 'Tus datos',
    intro:
      'Todo lo que has registrado (entrenamientos, series, récords, pesajes, objetivos y tu perfil) en un solo archivo que puedes guardar o abrir en otra app. Se crea en este teléfono, así que funciona sin conexión.',
    failed:
      'No se pudo crear el archivo. No se ha cambiado nada; inténtalo de nuevo en un momento.',
    preparing: 'Preparando tu archivo…',
    download: 'Descargar tus datos',
    empty:
      'Aún no hay nada registrado, así que el archivo contiene tu perfil y tus respuestas a las preguntas de bienvenida.',
    holds: (parts: string) => `Contiene ${parts}.`,
    workouts: (count: string, n: number) =>
      `${count} ${n === 1 ? 'entrenamiento' : 'entrenamientos'}`,
    sets: (count: string, n: number) => `${count} ${n === 1 ? 'serie' : 'series'}`,
    weighIns: (count: string, n: number) => `${count} ${n === 1 ? 'pesaje' : 'pesajes'}`,
    notSynced:
      'Este dispositivo aún no ha terminado de descargar tu historial, así que pueden faltar entrenamientos antiguos. Conéctate, espera a que termine la sincronización y vuelve a descargar.',
    noFriends:
      'Tu código de amigo y tu lista de amigos necesitan conexión, así que se han dejado fuera.',
  },
  deletion: {
    title: 'Eliminar tu cuenta',
    intro:
      'Elimina tu cuenta y todo lo que contiene (cada entrenamiento, serie, récord, pesaje y objetivo) del servidor y de este teléfono. No se puede deshacer. Si quieres una copia, descarga antes tus datos.',
    open: 'Eliminar mi cuenta…',
    word: 'ELIMINAR',
    typeToConfirm: (word: string) => `Escribe ${word} para confirmar`,
    needConnection:
      'Necesitas conexión. Tu cuenta se elimina en el servidor, no solo en este teléfono.',
    deleting: 'Eliminando…',
    confirm: 'Eliminar mi cuenta para siempre',
    keep: 'Conservar mi cuenta',
    unreachable:
      'No se pudo conectar con el servidor, así que no se eliminó nada. Tu cuenta tiene que eliminarse allí, no solo en este dispositivo; vuelve a intentarlo con conexión.',
    expired:
      'Tu sesión ha caducado, así que no se eliminó nada. Cierra sesión, vuelve a entrar e inténtalo de nuevo.',
    failed: (message: string) => `No se eliminó nada: ${message}`,
    deleted:
      'Tu cuenta se ha eliminado, junto con todo lo que contenía, del servidor y de este dispositivo.',
  },
  gymSettings: {
    multiple: 'Entreno en más de un gimnasio',
    multipleOn: 'Cada entrenamiento se guarda con el gimnasio donde se hizo.',
    multipleOff: 'Desactivado: los entrenamientos no se vinculan a un gimnasio.',
    first: 'El gimnasio donde has entrenado hasta ahora',
    firstHint: 'Cada entrenamiento que ya registraste se guarda en este gimnasio.',
    saveGym: 'Guardar gimnasio',
    yours: 'Tus gimnasios',
    add: 'Añadir un gimnasio',
    addHint:
      'Añade el otro gimnasio al que vas. Al empezar un entrenamiento se te preguntará en cuál.',
    addAction: 'Añadir gimnasio',
    rename: (name: string) => `Cambiar el nombre de ${name}`,
    remove: (name: string) => `Quitar ${name}`,
    confirmRemove: (name: string) =>
      `¿Quitar ${name}? Los entrenamientos que hiciste allí conservan su nombre, y deja de ofrecerse al empezar uno.`,
    tooLong: (max: number) => `El nombre debe tener como máximo ${String(max)} caracteres.`,
  },
};
