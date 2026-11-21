import type { Messages } from '../en/index.js';

const changes = (count: number): string =>
  `${String(count)} ${count === 1 ? 'modifica' : 'modifiche'}`;

export const settings: Messages['settings'] = {
  title: 'Impostazioni',
  groups: { gym: 'In palestra', app: 'App', account: 'Account' },
  gyms: 'Palestre',
  tour: { title: 'Orientati nell’app', body: 'Rivedi l’introduzione in cinque tappe quando vuoi.' },
  disclaimer:
    'Contenuto informativo, non un parere medico. Consulta un professionista prima di iniziare un programma.',
  language: {
    title: 'Lingua',
    label: 'Lingua dell’app',
    hint: 'Tutta l’app, esercizi inclusi. Viene salvata nel tuo account, così gli altri dispositivi la seguono.',
  },
  appearance: {
    title: 'Aspetto',
    dark: 'Modalità scura',
    darkOn: 'Disattivala per il tema chiaro, più leggibile alla luce del giorno.',
    darkOff: 'Disattivata: l’app usa il tema chiaro.',
  },
  training: {
    title: 'Allenamento',
    recommendations: 'Consigli di allenamento',
    recommendationsOn: 'Ricevi l’allenamento di oggi e suggerimenti di esercizi.',
    recommendationsOff: 'Disattivati: scegli tu esercizi, allenamenti e routine.',
    startOptions: 'Mostra le opzioni di avvio',
    startOptionsOn: 'Scegli una routine o parti da zero su questo dispositivo.',
    startOptionsOff: 'Disattivate: su questo dispositivo parti sempre da un allenamento vuoto.',
  },
  units: {
    title: 'Unità',
    weight: 'Peso',
    weightDetail: 'Per ogni peso nell’app.',
    weightUnit: 'Unità di peso',
    kilograms: 'Chilogrammi',
    pounds: 'Libbre',
    note: 'Tutto è salvato in chilogrammi e solo mostrato in libbre, quindi passare dall’una all’altra non cambia mai un numero che hai registrato.',
  },
  plates: {
    title: 'Dischi disponibili',
    yours: 'I dischi della tua palestra',
    detail: 'La stessa lista di Impara → Dischi. Una modifica qui compare anche lì.',
    keepOne: 'Lascia selezionato almeno un disco.',
  },
  rest: {
    title: 'Timer di recupero',
    own: 'Imposta i miei tempi di recupero',
    ownOn: 'Un tempo per i multiarticolari, un altro per l’isolamento.',
    ownOff: 'Disattivato: ogni esercizio usa il recupero consigliato.',
    compound: 'Multiarticolari',
    compoundHint: 'Squat, distensioni, rematori, stacchi, trazioni.',
    isolation: 'Isolamento',
    isolationHint: 'Curl, alzate, estensioni, croci.',
    step: 'Meno e più',
    stepHint: 'Quanto tolgono e aggiungono i tasti − e + del timer.',
    stepGroup: 'Passo del timer',
    smaller: 'Passo più piccolo',
    bigger: 'Passo più grande',
    sound: 'Suono a fine recupero',
    soundOn: 'Un segnale di tre secondi oltre alla vibrazione, con l’app aperta.',
    soundOff: 'Disattivato: la fine del recupero vibra soltanto.',
    group: (label: string) => `Recupero ${label.toLowerCase()}`,
    shorter: (label: string) => `Recupero più breve: ${label.toLowerCase()}`,
    longer: (label: string) => `Recupero più lungo: ${label.toLowerCase()}`,
  },
  friends: {
    title: 'Amici',
    didNotSave: 'Non è stato salvato.',
    share: 'Condividi il mio allenamento con gli amici',
    shareOff: 'Disattivato: gli amici vedono il tuo nome e che non condividi.',
    shareOn: 'I tuoi allenamenti, record, settimana e quando sei stato online l’ultima volta.',
    needConnection: 'Per cambiarlo serve una connessione.',
  },
  feedback: {
    title: 'Invia un feedback',
    intro:
      'Segnala un bug, suggerisci qualcosa o di’ semplicemente cosa pensi: arriva direttamente allo sviluppatore.',
    category: 'Categoria',
    bug: 'Bug',
    idea: 'Idea',
    other: 'Altro',
    message: 'Messaggio',
    tooLong: (length: number, max: number) => `${String(length)}/${String(max)}: troppo lungo`,
    count: (length: number, max: number) => `${String(length)}/${String(max)}`,
    needConnection: 'Per inviare un feedback serve una connessione.',
    thanks: 'Grazie, è arrivato allo sviluppatore.',
    sending: 'Invio…',
    send: 'Invia feedback',
    sentWith: 'Inviato con l’email del tuo account, la versione dell’app e la piattaforma.',
  },
  account: {
    title: 'Il tuo account',
    noProfile: 'Per questo account non esiste una riga del profilo.',
    signedIn: 'Accesso effettuato',
    exercises: 'Esercizi disponibili',
    muscles: 'Muscoli sul modello',
  },
  sync: {
    title: 'Sincronizzazione',
    working: ' · in corso…',
    status: 'Stato',
    connected: 'Connesso',
    connecting: 'Connessione',
    notSetUp: 'Non configurata',
    offline: 'Offline',
    exercises: 'Esercizi sul dispositivo',
    muscles: 'Muscoli sul dispositivo',
    equipment: 'Attrezzatura sul dispositivo',
    profiles: 'Righe del tuo profilo',
    workouts: 'Allenamenti registrati',
    sets: 'Serie registrate',
    phase: {
      unconfigured:
        'La sincronizzazione non è configurata. I tuoi allenamenti sono salvati solo su questo dispositivo.',
      idle: 'Non avviata.',
      connecting: 'Connessione…',
      synced: 'Aggiornato con il server.',
      offline:
        'Offline. I tuoi allenamenti sono salvati qui e si sincronizzeranno quando ti riconnetti.',
      offlineSince: (time: string) =>
        `Offline dalle ${time}. Tutto è salvato qui e si sincronizzerà quando ti riconnetti.`,
    },
    lost: (count: number, detail: string) =>
      `${changes(count)} su questo dispositivo non ${count === 1 ? 'è stata salvata' : 'sono state salvate'} sul server. ${detail}`,
    refusedBug: 'Il server le ha rifiutate. È un bug, per favore segnalalo.',
    rejected: 'Sono state rifiutate come non valide e non verranno ritentate.',
    jwks: 'Il servizio di sincronizzazione ha rifiutato l’accesso di questo dispositivo. Il suo Client Auth ha bisogno dell’URL JWKS di Supabase per verificare il token. Tutto è ancora salvato qui.',
    refusedAccount:
      'Il servizio di sincronizzazione ha rifiutato questo account. Tutto è ancora salvato su questo dispositivo.',
    notFound: 'Il servizio di sincronizzazione non è stato trovato all’indirizzo configurato.',
    noRules: 'Il servizio di sincronizzazione non ha regole di sincronizzazione utilizzabili.',
    couldNotConnect: (message: string) =>
      `La sincronizzazione non è riuscita a connettersi: ${message}`,
    uploadLost: (count: number, tables: string) =>
      `${changes(count)} non ${count === 1 ? 'è stata salvata' : 'sono state salvate'} sul server (${tables}) e ${count === 1 ? 'è stata saltata' : 'sono state saltate'}. Tutto il resto è sincronizzato.`,
    nothingToSync: 'Niente da sincronizzare.',
    synced: (count: number) =>
      `${changes(count)} ${count === 1 ? 'sincronizzata' : 'sincronizzate'}.`,
  },
  storage: {
    title: 'Archiviazione offline',
    checking: 'Verifica…',
    persistent: 'Persistente',
    granted: 'Concessa',
    refused: 'Rifiutata',
    unsupported: 'Non supportata',
    unknown: 'Sconosciuta',
    space: 'Spazio disponibile',
    used: 'Usato',
    unknownSize: 'sconosciuto',
    grantedDetail: 'I tuoi allenamenti sono archiviati in modo permanente su questo dispositivo.',
    deniedDetail:
      'Questo dispositivo potrebbe cancellare i dati offline se lo spazio scarseggia o se non apri l’app per un po’. L’accesso resta disponibile, quindi non si perde nulla di già sincronizzato.',
    unsupportedDetail: 'Questo browser non può garantire l’archiviazione offline.',
    errorDetail: 'Impossibile verificare l’archiviazione offline su questo dispositivo.',
  },
  device: {
    title: 'Dove sta girando',
    shell: 'Contenitore',
    platform: 'Piattaforma',
    pointer: 'Puntatore',
    fine: 'Preciso: hover disponibile',
    coarse: 'Touch: solo tocco',
    web: 'Browser web',
  },
  data: {
    title: 'I tuoi dati',
    intro:
      'Tutto ciò che hai registrato (allenamenti, serie, record, pesate, obiettivi e il tuo profilo) in un unico file da tenere o aprire in un’altra app. Viene creato su questo telefono, quindi funziona offline.',
    failed: 'Impossibile creare il file. Non è cambiato nulla: riprova tra un momento.',
    preparing: 'Preparazione del file…',
    download: 'Scarica i tuoi dati',
    empty:
      'Non è ancora registrato nulla, quindi il file contiene il tuo profilo e le risposte alle domande di benvenuto.',
    holds: (parts: string) => `Contiene ${parts}.`,
    workouts: (count: string, n: number) => `${count} ${n === 1 ? 'allenamento' : 'allenamenti'}`,
    sets: (count: string, _n: number) => `${count} serie`,
    weighIns: (count: string, n: number) => `${count} ${n === 1 ? 'pesata' : 'pesate'}`,
    notSynced:
      'Questo dispositivo non ha ancora finito di scaricare il tuo storico, quindi potrebbero mancare allenamenti più vecchi. Connettiti, aspetta la fine della sincronizzazione e scarica di nuovo.',
    noFriends:
      'Il tuo codice amico e la lista amici richiedono una connessione, quindi sono stati esclusi.',
  },
  deletion: {
    title: 'Elimina il tuo account',
    intro:
      'Elimina il tuo account e tutto ciò che contiene (ogni allenamento, serie, record, pesata e obiettivo) dal server e da questo telefono. Non si può annullare. Se vuoi una copia, scarica prima i tuoi dati.',
    open: 'Elimina il mio account…',
    word: 'ELIMINA',
    typeToConfirm: (word: string) => `Scrivi ${word} per confermare`,
    needConnection:
      'Serve una connessione. Il tuo account viene eliminato sul server, non solo su questo telefono.',
    deleting: 'Eliminazione…',
    confirm: 'Elimina il mio account per sempre',
    keep: 'Tieni il mio account',
    unreachable:
      'Impossibile raggiungere il server, quindi non è stato eliminato nulla. Il tuo account va eliminato lì, non solo su questo dispositivo: riprova con una connessione.',
    expired:
      'La sessione è scaduta, quindi non è stato eliminato nulla. Esci, accedi di nuovo e riprova.',
    failed: (message: string) => `Non è stato eliminato nulla: ${message}`,
    deleted:
      'Il tuo account è stato eliminato, insieme a tutto ciò che conteneva, dal server e da questo dispositivo.',
  },
  gymSettings: {
    multiple: 'Mi alleno in più di una palestra',
    multipleOn: 'Ogni allenamento viene salvato con la palestra in cui è stato fatto.',
    multipleOff: 'Disattivato: gli allenamenti non sono legati a una palestra.',
    first: 'La palestra in cui ti sei allenato finora',
    firstHint: 'Ogni allenamento già registrato viene salvato come fatto in questa palestra.',
    saveGym: 'Salva palestra',
    yours: 'Le tue palestre',
    add: 'Aggiungi una palestra',
    addHint:
      'Aggiungi l’altra palestra che frequenti. Quando inizi un allenamento ti verrà chiesto in quale.',
    addAction: 'Aggiungi palestra',
    rename: (name: string) => `Rinomina ${name}`,
    remove: (name: string) => `Rimuovi ${name}`,
    confirmRemove: (name: string) =>
      `Rimuovere ${name}? Gli allenamenti fatti lì mantengono il nome, e non verrà più proposta quando ne inizi uno.`,
    tooLong: (max: number) => `Il nome può avere al massimo ${String(max)} caratteri.`,
  },
};
