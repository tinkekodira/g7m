import type { Messages } from '../en/index.js';

export const app: Messages['app'] = {
  accountReady: {
    title: 'Preparando tu cuenta',
    notArrived:
      'Tu perfil aún no ha llegado a este dispositivo. Revisa tu conexión y vuelve a intentarlo.',
  },
  update: {
    ready: 'Hay una nueva versión de g7m lista.',
  },
  tabs: {
    main: 'Principal',
    learn: 'Aprender',
    friends: 'Amigos',
    home: 'Inicio',
    profile: 'Perfil',
    settings: 'Ajustes',
    needsAttention: '(requiere atención)',
  },
  loadingStates: {
    account: 'Cargando tu cuenta…',
    train: 'Entrenar',
    workout: 'Cargando entrenamiento…',
    yourProfile: 'Tu perfil',
    exercises: 'Ejercicios',
    profile: 'Cargando tu perfil…',
    exerciseList: 'Cargando ejercicios…',
    bodyView: 'Cargando la vista del cuerpo…',
    leaderboard: 'Cargando clasificación…',
    requests: 'Cargando solicitudes…',
    friends: 'Cargando amigos…',
    numbers: 'Cargando tus datos…',
    thisMonth: 'Cargando este mes…',
  },
  crash: {
    updatedTitle: 'g7m se ha actualizado',
    updatedDetail:
      'Llegó una nueva versión mientras esta pantalla estaba abierta y una parte ya no está donde la versión anterior la espera. Recarga para terminar la actualización. No se pierde nada de lo que registraste.',
    bugTitle: 'Algo ha fallado en esta pantalla',
    bugDetailInWorkout:
      'Tu entrenamiento está a salvo. Cada serie se guarda en este dispositivo en cuanto la marcas, así que puedes volver a abrir el entrenamiento desde Inicio y seguir donde lo dejaste.',
    bugDetail:
      'Todo lo que registraste está guardado en este dispositivo, así que no se pierde nada. Vuelve a intentarlo o regresa a Inicio.',
    goToHome: 'Ir a Inicio',
    reloadApp: 'Recargar la app',
    reportDetails: 'Detalles para un informe de error',
    reportSafe: 'Nada de esto te identifica, así que puedes pegarlo en un mensaje sin problema.',
    copied: 'Copiado',
    copyDetails: 'Copiar detalles',
    copyFailed:
      'Este navegador no permite copiarlo. Mantén pulsado el texto de arriba para seleccionarlo.',
  },
  serverErrors: {
    clockSkew:
      'El reloj de este dispositivo va por delante del servidor, así que el token de inicio de sesión parece venir del futuro. Activa Ajustes → General → Fecha y hora → Ajuste automático y vuelve a abrir la app.',
    sessionExpired: 'Tu sesión ha caducado. Cierra sesión y vuelve a entrar.',
    offline:
      'No se puede conectar con el servidor. Tus entrenamientos están guardados en este dispositivo y se sincronizarán cuando vuelvas a tener conexión.',
    noAccess:
      'No tienes acceso a eso. Si acabas de iniciar sesión, prueba a volver a abrir la app.',
    gone: 'Ese registro ya no existe.',
  },
};
