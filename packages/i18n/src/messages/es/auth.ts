import type { Messages } from '../en/index.js';

export const auth: Messages['auth'] = {
  tagline:
    'Tu historial de entrenamiento se sincroniza en todos los dispositivos donde inicies sesión.',
  language: 'Idioma',
  resetIntro:
    'Escribe el correo con el que te registraste y te enviaremos un enlace para crear una contraseña nueva.',
  modes: 'Inicia sesión o crea una cuenta',
  signIn: 'Iniciar sesión',
  createAccount: 'Crear cuenta',
  email: 'Correo electrónico',
  password: 'Contraseña',
  passwordHint: 'Al menos 8 caracteres.',
  createAnAccount: 'Crear una cuenta',
  resetMyPassword: 'Restablecer mi contraseña',
  working: 'Un momento…',
  sendResetLink: 'Enviar enlace',
  backToSignIn: 'Volver a iniciar sesión',
  or: 'o',
  google: 'Continuar con Google',
  forgot: '¿Olvidaste tu contraseña?',
  newPassword: {
    title: 'Elige una contraseña nueva',
    accountOpen: 'Tu cuenta está abierta.',
    signedInAs: (email: string) => `Sesión iniciada como ${email}.`,
    explain:
      'Este enlace ha abierto tu cuenta. Crea ahora una contraseña: será la que uses a partir de ahora.',
    label: 'Contraseña nueva',
    minimum: (length: number) => `Al menos ${String(length)} caracteres.`,
    again: 'Escríbela otra vez',
    mismatch: 'No coinciden.',
    set: 'Guardar contraseña',
    keep: 'Omitir y mantener mi contraseña actual',
  },
  notices: {
    confirm:
      'Cuenta creada. Revisa tu correo para confirmarla con el enlace y luego inicia sesión.',
    googleFailed: 'No se pudo abrir la página de inicio de sesión.',
    unsent: (count: number) =>
      `${String(count)} cambios no habían llegado al servidor, así que no se borró nada de este dispositivo. Vuelve a iniciar sesión con conexión para guardarlos.`,
    resetSent: 'Si ese correo tiene una cuenta, el enlace ya va de camino. Caduca en una hora.',
  },
  errors: {
    credentials:
      'El correo y la contraseña no coinciden. Revisa ambos, o crea una cuenta si aún no la tienes.',
    registered: 'Ese correo ya tiene una cuenta. Inicia sesión.',
    short: 'La contraseña necesita al menos 8 caracteres.',
    rateLimit: 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.',
    network: 'No se puede conectar con el servidor. Revisa tu conexión.',
    samePassword: 'Esa ya es tu contraseña. Elige otra distinta.',
    otherBrowser:
      'Abre el enlace en el mismo navegador desde el que pediste el restablecimiento y vuelve a intentarlo.',
  },
};
