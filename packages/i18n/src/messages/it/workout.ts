import type { Messages } from '../en/index.js';

const plural = (count: number, one: string, many: string): string =>
  `${String(count)} ${count === 1 ? one : many}`;

const lower = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

export const workout: Messages['workout'] = {
  notOnDevice: 'Questo allenamento non è su questo dispositivo.',
  progress: 'Progressi',
  editingClosed: 'Modifica chiusa',
  editWindow: 'Gli allenamenti si possono modificare per 2 ore dopo la fine.',
  details: 'Dettagli allenamento',
  boutRemoved: 'Blocco rimosso.',
  titleEdit: 'Modifica allenamento',
  titlePast: 'Allenamento passato',
  title: 'Allenamento',
  elapsed: 'trascorso',
  lifted: (weight: string) => `${weight} sollevati`,
  calendar: 'Calendario',
  editingHint:
    'Salva ogni serie modificata con Salva o con la spunta. La modifica si chiude 2 ore dopo la fine.',
  uncounted: (sets: number) =>
    `${sets === 1 ? 'Una serie non viene contata' : `${String(sets)} serie non vengono contate`} nel totale: serve un peso corporeo come riferimento.`,
  addExercise: '+ Aggiungi un esercizio',
  doneEditing: 'Fine modifica',
  finish: 'Termina allenamento',
  confirmDiscard: 'Scartare questo allenamento e tutto ciò che è stato registrato?',
  discard: 'Scarta',
  removeTitle: (name: string | null) => `Rimuovere ${name ?? 'questo esercizio'}?`,
  exercise: 'Esercizio',
  removal: {
    nothing: 'Non c’è ancora niente registrato.',
    one: (bout: boolean) =>
      `${bout ? 'Il blocco registrato se ne va' : 'La serie registrata se ne va'} con lui.`,
    many: (count: number, bout: boolean) =>
      `${bout ? 'I' : 'Le'} ${String(count)} ${bout ? 'blocchi registrati' : 'serie registrate'} se ne vanno con lui.`,
  },
  removed: {
    drop: 'Drop rimosso.',
    set: 'Serie rimossa.',
    setWithDrops: (drops: number) =>
      `Serie rimossa, con ${String(drops)} ${drops === 1 ? 'drop' : 'drop'}.`,
    exercise: (name: string) => `${name} rimosso.`,
    exerciseWithSets: (name: string, sets: number) => `${name} rimosso, con ${String(sets)} serie.`,
  },
  superset: {
    label: 'Superserie',
    heading: (count: number) => `Superserie · ${String(count)} esercizi`,
    ungroup: 'Separa',
    addRound: 'Aggiungi giro',
  },
  summary: {
    label: 'Riepilogo allenamento',
    elapsed: (hours: number, minutes: number, seconds: number) =>
      `${String(hours)} ${hours === 1 ? 'ora' : 'ore'} ${String(minutes)} minuti ${String(seconds)} secondi trascorsi`,
    completedSets: 'Serie allenanti completate: ',
    sets: (count: number) => `${String(count)} serie`,
  },
  start: {
    title: 'Allenati',
    nothing:
      'Niente in corso. Inizia un allenamento e aggiungi gli esercizi strada facendo: tutto viene salvato su questo telefono appena tocchi, che ci sia campo o no.',
    button: 'Inizia un allenamento',
  },
  bodyweight: {
    title: 'Quanto pesi?',
    body: 'Una trazione significa spostare il tuo peso corporeo. Senza questo numero quelle serie si possono registrare ma non misurare, quindi non conterebbero per niente.',
    label: (unit: string) => `Peso corporeo (${unit})`,
  },
  unknownExercise: 'Esercizio sconosciuto',
  thatLift: 'quell’esercizio',
  elsewhere: (gym: string | null, set: string) =>
    `Prima volta su questa macchina qui. L’ultima volta ${gym === null ? 'altrove' : `a ${gym}`}: ${set}.`,
  noSets: 'Ancora nessuna serie.',
  advice: (reps: number, weight: string, next: string) =>
    `${String(reps)} rip. con ${weight}: la prossima volta prova ${next}`,
  warmUp: 'Riscaldamento',
  addSet: 'Aggiungi serie',
  ramp: (count: number, from: string, to: string) =>
    `Aggiunge ${String(count)} serie da ${from} fino a ${to}`,
  effort: {
    question: 'In quell’ultima serie, quante ne avresti potute fare in più?',
    none: 'Nessuna',
  },
  set: {
    deleteRow: (title: string) => `Elimina ${lower(title)}`,
    dropAfter: (title: string) => `Drop dopo ${lower(title)}`,
    drop: 'Drop',
    last: (set: string) => `Ultima: ${set}`,
    load: (title: string) => `Carico ${lower(title)}`,
    bodyweight: 'Peso corporeo',
    addedWeight: 'Zavorra',
    durationFormat: (title: string) => `Formato durata ${lower(title)}`,
    seconds: 'Secondi',
    minSec: 'Min + s',
    minutes: 'Minuti',
    reps: 'Rip.',
    saveRow: (title: string) => `Salva ${lower(title)}`,
    markSkipped: 'Segna come saltata',
  },
  rows: {
    warmup: (number: number) => `Riscaldamento ${String(number)}`,
    set: (number: number) => `Serie ${String(number)}`,
    drop: 'Drop',
    dropNumbered: (number: number) => `Drop ${String(number)}`,
    tickWarmup: (done: boolean, number: number) =>
      `${done ? 'Annulla' : 'Completa'} riscaldamento ${String(number)}`,
    tickDrop: (done: boolean, number: number, parent: number) =>
      `${done ? 'Annulla' : 'Completa'} drop ${String(number)} della serie ${String(parent)}`,
    tickSet: (done: boolean, number: number) =>
      `${done ? 'Annulla' : 'Completa'} serie ${String(number)}`,
  },
  stillTraining: {
    title: 'Ti stai ancora allenando?',
    idle: (minutes: number) =>
      `Niente spuntato da ${String(minutes)} ${minutes === 1 ? 'minuto' : 'minuti'}.`,
    keepGoing: 'Continua',
    finish: 'Termina',
  },
  rest: {
    over: 'Recupero finito',
    resting: 'Recupero',
    less: (label: string) => `${label} di recupero in meno`,
    more: (label: string) => `${label} di recupero in più`,
    dismiss: 'Ignora',
  },
  record: {
    badge: 'PR',
    heaviestShort: 'La più pesante',
    heaviest: (name: string) => `${name}: la tua serie più pesante`,
    heaviestDetail: (now: string, gain: string, unit: string) =>
      `${now} ${unit}: ${gain} ${unit} oltre il tuo vecchio record.`,
    bestShort: 'La tua serie migliore',
    best: (name: string) => `${name}: la tua serie migliore`,
    bestDetail: (now: string, before: string, unit: string, beforeUnit: string) =>
      `Massimale stimato ${now} ${unit}, prima ${before} ${beforeUnit}.`,
  },
  open: {
    past: 'Finisci di registrare il tuo allenamento passato',
    stale: 'Hai lasciato un allenamento aperto',
    continue: 'Continua l’allenamento',
    exercises: (count: number) => plural(count, 'esercizio', 'esercizi'),
    setsDone: (count: number) => plural(count, 'serie fatta', 'serie fatte'),
    justStarted: 'appena iniziato',
    openFor: (hours: number) => `aperto da ${plural(hours, 'ora', 'ore')}`,
    minutesIn: (minutes: number) => `da ${String(minutes)} min`,
    hoursIn: (hours: number, minutes: number) => `da ${String(hours)} h ${String(minutes)} min`,
  },
  autoFinish: {
    title: 'Abbiamo terminato il tuo allenamento',
    closed: (when: string) =>
      `Non hai spuntato niente per un po’, quindi il tuo allenamento di ${when} è stato chiuso per te.`,
    closedAt: (when: string, at: string) =>
      `Non hai spuntato niente per un po’, quindi il tuo allenamento di ${when} è stato chiuso alla tua ultima serie, alle ${at}.`,
    allSaved: 'Tutto ciò che hai registrato è salvato.',
    saved: (parts: string) => `Salvato: ${parts}.`,
    exercises: (count: number) => plural(count, 'esercizio', 'esercizi'),
    sets: (count: number) => `${String(count)} serie`,
    bouts: (count: number) => plural(count, 'blocco', 'blocchi'),
    minutes: (minutes: number) => `${String(minutes)} min`,
    okay: 'Ok',
    see: 'Vedi',
  },
  cardio: {
    label: 'Cardio',
    needsBodyweight:
      'Per le calorie serve il tuo peso corporeo. Aggiungilo in Il tuo profilo e verranno calcolate.',
    noBouts: 'Ancora nessun blocco. Aggiungine uno quando sali sulla macchina.',
    addBout: 'Aggiungi blocco',
    timeFormat: 'Il tempo è in minuti, o minuti:secondi come 25:30.',
    notANumber: (field: string) => `${field} non è un numero.`,
    bout: (number: number) => `Blocco ${String(number)}`,
    boutLabel: (number: number) => `blocco ${String(number)}`,
    time: 'Tempo',
    start: 'Avvia',
    stop: 'Ferma',
    calories: 'Calorie',
    fromMachine: 'Dalla macchina. Cancellalo per usare la stima.',
    addTime: 'Aggiungi il tempo per stimarle, oppure scrivi ciò che indica la macchina.',
    estimate: (calories: string, source: string) =>
      `${calories}. ${source} Scrivi il valore della macchina per usarlo al suo posto.`,
    undo: (label: string) => `Annulla ${label}`,
    complete: (label: string) => `Completa ${label}`,
    saveWithoutTicking: 'Salva senza spuntare',
    fields: {
      distance: (unit: string) => `Distanza (${unit})`,
      speed: (unit: string) => `Velocità (${unit})`,
      incline: 'Pendenza (%)',
      level: 'Livello',
      watts: 'Watt medi',
      floors: 'Piani',
    },
    sources: {
      machine: 'Dalla macchina.',
      treadmill: 'Stimate da velocità e pendenza.',
      power: 'Stimate dai watt.',
      pace: 'Stimate dal tuo ritmo.',
      stairs: 'Stimate dai piani saliti.',
      met: (better: string) => `Una stima approssimativa dal solo tempo. ${better}`,
    },
    better: {
      treadmill: 'Aggiungi la velocità per una stima migliore.',
      bike: 'Aggiungi i watt per una stima migliore.',
      rower: 'Aggiungi distanza o watt per una stima migliore.',
      ski_erg: 'Aggiungi distanza o watt per una stima migliore.',
      stair_climber: 'Aggiungi i piani per una stima migliore.',
    },
    floors: (count: number) => `${String(count)} piani`,
    nothing: 'Niente registrato',
  },
  gym: {
    change: (name: string | null) => `${name ?? 'Nessuna palestra scelta'}, cambia palestra`,
    choose: 'Scegli una palestra',
    where: 'Dove ti stai allenando?',
    which: 'Quale palestra',
    compared:
      'Macchine e cavi vengono confrontati con il loro storico in ciascuna palestra. Le serie che non hai ancora fatto passano ai numeri della nuova palestra.',
    manage: 'Gestisci palestre',
  },
  startDialog: {
    title: 'Inizia un allenamento',
    routines: 'Le tue routine',
    chooseRoutine: 'Scegli una routine',
    loading: 'Caricamento routine…',
    none: 'Ancora nessuna routine. Termina un allenamento e salvalo come routine per usarlo qui la prossima volta.',
    settingUp: 'Preparazione…',
    blank: 'Inizia un allenamento vuoto',
    dontShow: 'Non mostrare più',
    dontShowHint: 'Parti sempre da un allenamento vuoto. Puoi cambiarlo nelle Impostazioni.',
    saved: 'Routine salvate',
    page: (index: number, total: number) => `Pagina routine ${String(index)} di ${String(total)}`,
    start: (name: string) => `Inizia ${name}`,
    choosePage: 'Scegli la pagina delle routine',
    showPage: (index: number, total: number) =>
      `Mostra la pagina routine ${String(index)} di ${String(total)}`,
  },
  plates: {
    loaded: (plates: string) => `Un bilanciere caricato con ${plates} per lato`,
    empty: (bar: string, unit: string) => `Un bilanciere vuoto da ${bar} ${unit}`,
    bar: (weight: string, unit: string) => `Bilanciere da ${weight} ${unit}`,
    lighter: (bar: string) => `Più leggero di un ${lower(bar)}`,
    just: (bar: string) => `Solo il ${lower(bar)}`,
    eachSide: 'Per lato',
  },
  previousSet: {
    seconds: (reps: number) => `${String(reps)} s`,
    reps: (reps: number) => `${String(reps)} rip.`,
  },
};
