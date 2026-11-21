import type { Messages } from '../en/index.js';

export const auth: Messages['auth'] = {
  tagline: 'Lo storico dei tuoi allenamenti si sincronizza su ogni dispositivo su cui accedi.',
  language: 'Lingua',
  resetIntro:
    'Inserisci l’email con cui ti sei registrato e ti invieremo un link per impostare una nuova password.',
  modes: 'Accedi o crea un account',
  signIn: 'Accedi',
  createAccount: 'Crea account',
  email: 'Email',
  password: 'Password',
  passwordHint: 'Almeno 8 caratteri.',
  createAnAccount: 'Crea un account',
  resetMyPassword: 'Reimposta la password',
  working: 'Un momento…',
  sendResetLink: 'Invia il link',
  backToSignIn: 'Torna all’accesso',
  or: 'oppure',
  google: 'Continua con Google',
  forgot: 'Password dimenticata?',
  newPassword: {
    title: 'Scegli una nuova password',
    accountOpen: 'Il tuo account è aperto.',
    signedInAs: (email: string) => `Accesso effettuato come ${email}.`,
    explain:
      'Questo link ha aperto il tuo account. Imposta ora una password: sarà quella che userai d’ora in poi.',
    label: 'Nuova password',
    minimum: (length: number) => `Almeno ${String(length)} caratteri.`,
    again: 'Scrivila di nuovo',
    mismatch: 'Non coincidono.',
    set: 'Imposta password',
    keep: 'Salta e tieni la password attuale',
  },
  notices: {
    confirm: 'Account creato. Confermalo con il link ricevuto via email, poi accedi.',
    googleFailed: 'Impossibile aprire la pagina di accesso.',
    unsent: (count: number) =>
      `${String(count)} modifiche non avevano ancora raggiunto il server, quindi su questo dispositivo non è stato cancellato nulla. Accedi di nuovo con una connessione per salvarle.`,
    resetSent: 'Se quell’email ha un account, il link è in arrivo. Scade tra un’ora.',
  },
  errors: {
    credentials:
      'Email e password non corrispondono. Controllale entrambe, oppure crea un account se non ne hai ancora uno.',
    registered: 'Quell’email ha già un account. Accedi.',
    short: 'La password deve avere almeno 8 caratteri.',
    rateLimit: 'Troppi tentativi. Aspetta un minuto e riprova.',
    network: 'Impossibile raggiungere il server. Controlla la connessione.',
    samePassword: 'È già la tua password. Scegline un’altra.',
    otherBrowser:
      'Apri il link nello stesso browser da cui hai chiesto il ripristino, poi riprova.',
  },
};
