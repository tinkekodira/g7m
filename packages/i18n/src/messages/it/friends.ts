import type { Messages } from '../en/index.js';

type Stat = 'workouts' | 'lifted' | 'sets' | 'minutes';
type Period = 'week' | 'month';

const STAT: Record<Stat, string> = {
  workouts: 'allenamenti',
  lifted: 'peso',
  sets: 'serie',
  minutes: 'tempo',
};
const WHEN: Record<Period, string> = { week: 'questa settimana', month: 'questo mese' };
const summary = (improved: boolean, period: Period): Record<Stat, string> => ({
  workouts: `${improved ? 'Più migliorati: ' : 'Più '}${STAT.workouts} ${WHEN[period]}`,
  lifted: `${improved ? 'Più migliorati: ' : 'Più '}${STAT.lifted} ${WHEN[period]}`,
  sets: `${improved ? 'Più migliorati: ' : 'Più '}${STAT.sets} ${WHEN[period]}`,
  minutes: `${improved ? 'Più migliorati: ' : 'Più '}${STAT.minutes} ${WHEN[period]}`,
});

export const friends: Messages['friends'] = {
  title: 'Amici',
  nameless: 'Il tuo amico',
  you: 'Tu',
  unknownExercise: 'Esercizio sconosciuto',
  didNotGoThrough: 'Non è andato a buon fine.',
  didNotSave: 'Non è stato salvato. Riprova.',
  couldNotLoad: 'Impossibile caricarlo.',
  addFriend: 'Aggiungi un amico',
  profileUnavailable: 'Il tuo profilo non è disponibile. Apri il tuo profilo e riprova.',
  resultDismissed: 'Questo risultato è già stato chiuso.',
  challengeHint: 'Sfida un amico per una settimana: apri la sua pagina e scegli una statistica.',
  tabs: {
    friends: 'Amici',
    leaderboard: 'Classifica',
    requests: 'Richieste',
    waiting: ' in attesa',
  },
  empty: {
    eyebrow: 'Amici',
    title: 'Allenati con gli amici',
    body: 'Condividi il tuo codice con chi si allena con te. Quando ti aggiunge, vedrete qui la settimana, i record e gli allenamenti l’uno dell’altro.',
  },
  card: {
    levelShort: (level: number) => `Liv ${String(level)}`,
    level: (level: number) => `Livello ${String(level)}`,
    workingOut: 'Si sta allenando',
    notSharing: 'Non condivide il suo allenamento',
    lastWorkout: 'Ultimo allenamento',
    bestLifts: 'Migliori carichi',
    noLifts: 'Ancora nessun esercizio registrato',
    thisWeek: 'Questa settimana',
    today: ' (oggi)',
    streak: 'Serie consecutiva: ',
    notLogged: (label: string, who: string) => `${label}: ${who} non l’ha registrato`,
    youNotLogged: (label: string, who: string, theirs: string) =>
      `${label}: ${who} ${theirs}; tu non l’hai registrato`,
    levelWithYou: (label: string, who: string, theirs: string) =>
      `${label}: ${who} ${theirs}, alla pari con te`,
    youAhead: (label: string, who: string, theirs: string, gap: string) =>
      `${label}: ${who} ${theirs}, sei avanti di ${gap}`,
    youBehind: (label: string, who: string, theirs: string, gap: string) =>
      `${label}: ${who} ${theirs}, sei indietro di ${gap}`,
  },
  status: {
    label: 'Condividi quando mi alleno',
    description: 'Gli amici vedono quando ti stai allenando.',
  },
  when: {
    justNow: 'Proprio ora',
    minutesAgo: (minutes: number) => `${String(minutes)} min fa`,
    hoursAgo: (hours: number) => `${String(hours)} h fa`,
  },
  requests: {
    none: 'Nessuna richiesta in attesa. Quando qualcuno ti aggiunge con il tuo codice o ti sfida, compare qui per farti accettare.',
    accept: 'Accetta',
    decline: 'Rifiuta',
    acceptLabel: (name: string) => `Accetta ${name}`,
    declineLabel: (name: string) => `Rifiuta ${name}`,
  },
  code: {
    yours: 'Il tuo codice',
    yoursLabel: (spelled: string) => `Il tuo codice: ${spelled}`,
    copy: 'Copia',
    share: 'Condividi',
    copied: 'Copiato.',
    copiedToPaste: 'Copiato, pronto da incollare.',
    couldNotCopy: (code: string) => `Impossibile copiare. Il tuo codice è ${code}.`,
    couldNotShare: (code: string) => `Impossibile condividere. Il tuo codice è ${code}.`,
    shareTitle: 'Codice amico g7m',
    shareText: (code: string) => `Aggiungimi su g7m: il mio codice amico è ${code}`,
    theirs: 'Il suo codice',
    sending: 'Invio…',
    send: 'Invia richiesta',
    typeFirst: 'Inserisci prima il codice del tuo amico.',
    shape: 'Un codice amico è composto da sei lettere e numeri.',
    characters: 'I codici amico non usano mai 0, O, 1, I o L. Controlla il codice e riprova.',
    sent: 'Richiesta inviata.',
    sentTo: (who: string) => `Richiesta inviata a ${who}.`,
    nowFriends: (who: string | null) =>
      who === null
        ? 'Ti aveva già chiesto l’amicizia, quindi ora siete amici.'
        : `${who} ti aveva già chiesto l’amicizia, quindi ora siete amici.`,
    ownCode: 'Questo è il tuo codice.',
    unknown: 'Nessuno ha questo codice. Controllalo e riprova.',
    alreadyFriends: (who: string | null) =>
      who === null ? 'Siete già amici.' : `Sei già amico di ${who}.`,
    alreadyRequested: (who: string | null) =>
      who === null ? 'Hai già inviato una richiesta.' : `Hai già inviato una richiesta a ${who}.`,
    tooMany: 'Sono tante richieste in un’ora. Riprova più tardi.',
  },
  reference: {
    seconds: (who: string, reps: string) => `${who}: ${reps} s`,
    reps: (who: string, reps: string) => `${who}: ${reps} rip.`,
    assisted: (who: string, reps: string, weight: string) =>
      `${who}: ${reps} × ${weight} di assistenza`,
  },
  offline: {
    title: 'Sei offline',
    body: 'Gli amici richiedono una connessione. Il tuo allenamento è tutto qui, e questa sezione si completerà quando tornerai online.',
  },
  name: {
    missingProfile:
      'Il tuo profilo non è ancora arrivato su questo telefono. Aspetta un attimo e riprova.',
    title: 'Come devono chiamarti gli amici?',
    body: 'Gli amici vedono il tuo nome accanto al tuo allenamento. Puoi cambiarlo più tardi in Il tuo profilo.',
    label: 'Il tuo nome',
  },
  page: {
    notSharing:
      'Non sta condividendo il suo allenamento in questo momento, o non è più nella tua lista di amici.',
    headToHead: 'Testa a testa',
    nothingToCompare:
      'Ancora niente da confrontare. Quando avrete registrato entrambi lo stesso esercizio, comparirà qui.',
    exercise: 'Esercizio',
    youAhead: (gap: string) => `Sei avanti di ${gap}`,
    theyAhead: (who: string, gap: string) => `${who} è avanti di ${gap}`,
    level: 'Pari',
    recent: 'Allenamenti recenti',
    noRecent: 'Ancora nessun allenamento completato.',
    achievementsPending: (name: string) => `Comparirà quando ${name} riaprirà l’app`,
    noneEarned: 'Ancora nessuno',
    earnedOf: (earned: number, total: number) => `${String(earned)} di ${String(total)} ottenuti`,
    training: (name: string) => `Allenamento di ${name}`,
    lastWeeks: (weeks: number) => `Le ultime ${String(weeks)} settimane, sul suo corpo.`,
    nothingLogged: (weeks: number) => `Niente registrato nelle ultime ${String(weeks)} settimane.`,
    bestsDescription: (name: string) =>
      `Il carico più pesante che ${name} ha spostato in ogni esercizio. Gli esercizi a corpo libero sono esclusi: il peso corporeo resta privato.`,
    routines: 'Routine',
    noRoutines: 'Ancora nessuna routine salvata.',
    showFewer: 'Mostra meno',
    showAll: (count: number) => `Mostra tutte e ${String(count)}`,
    confirmRemove: (name: string) => `Rimuovere ${name} dai tuoi amici? Non verrà avvisato.`,
    moreOptions: 'Altre opzioni',
    remove: 'Rimuovi amico',
    exercises: (count: number) => (count === 1 ? '1 esercizio' : `${String(count)} esercizi`),
  },
  session: {
    gone: 'Questo allenamento non è più condiviso con te.',
    label: (friend: string) => `Allenamento di ${friend}, apri il profilo di ${friend}`,
    whose: (friend: string) => `Allenamento di ${friend}`,
    fromDevice: 'Salvato su questo telefono dall’ultima volta che l’hai aperto.',
    settingUp: 'Preparazione…',
    doIt: 'Fai questo allenamento',
    finishFirst: 'Termina l’allenamento aperto prima di iniziarne uno nuovo.',
    openIt: 'Aprilo',
    explain:
      'I suoi esercizi e le sue serie, con i tuoi carichi dell’ultima volta. I suoi numeri sono mostrati accanto a ogni esercizio come riferimento.',
  },
  routine: {
    gone: 'Questa routine non è più condivisa con te.',
    label: (name: string) => `Routine di ${name}, apri il profilo di ${name}`,
    whose: (name: string) => `Routine di ${name}`,
    doIt: 'Fai questa routine',
    explain:
      'I suoi esercizi, serie e intervalli di ripetizioni, con i tuoi carichi dell’ultima volta.',
    empty: 'Ancora vuota.',
    superset: 'Superserie',
  },
  board: {
    label: 'Classifica',
    rankBy: 'Ordina per',
    stat: 'Statistica',
    period: 'Periodo',
    done: 'Fatto',
    change: 'Cambia',
    nobody: 'Ancora nessuno da sfidare',
    nobodyBody:
      'Quando un amico ti aggiunge, vedrai chi si è allenato di più questa settimana e questo mese.',
    stats: { workouts: 'Allenamenti', lifted: 'Peso', sets: 'Serie', minutes: 'Tempo' },
    rankings: { most: 'Di più', improved: 'Più migliorati' },
    periods: { week: 'Questa settimana', month: 'Questo mese' },
    summary: {
      most: { week: summary(false, 'week'), month: summary(false, 'month') },
      improved: { week: summary(true, 'week'), month: summary(true, 'month') },
    },
    workouts: (count: string, n: number) => (n === 1 ? '1 allenamento' : `${count} allenamenti`),
    sets: (count: string, _n: number) => `${count} serie`,
    ofTraining: (time: string) => `${time} di allenamento`,
    lifted: (amount: string) => `${amount} sollevati`,
    behind: (amount: string, who: string) => `${amount} dietro ${who}`,
    levelWith: (who: string) => `Alla pari con ${who}`,
    ahead: (amount: string, who: string) => `${amount} davanti a ${who}`,
    ordinal: (rank: number): string => `${String(rank)}º`,
    lastDay: 'Ultimo giorno',
    daysLeft: (days: number) => `Mancano ${String(days)} giorni`,
    crowned: (improved: boolean, period: 'week' | 'month') =>
      `${improved ? 'Più migliorato' : 'Vincitore'} ${period === 'week' ? 'la settimana scorsa' : 'il mese scorso'}`,
    nothingYetToMeasure: 'Ancora niente da confrontare',
    ofUsual: (score: number) => `${String(score)}% del solito`,
    rowNew: (name: string) => `${name}: nuovo`,
    rowNewWhy: (name: string, period: 'week' | 'month') =>
      `${name}: nuovo, niente nelle quattro settimane prima di ${period === 'week' ? 'questa settimana' : 'questo mese'} da confrontare`,
    rowNothing: (name: string) => `${name}: ancora niente`,
    rowPlaced: (place: string, name: string, score: string) => `${place}, ${name}: ${score}`,
    moved: (up: boolean, by: number) =>
      `${up ? 'Su' : 'Giù'} di ${String(by)} ${by === 1 ? 'posizione' : 'posizioni'} da ieri`,
    new: 'Nuovo',
    usualWeek:
      '100% è una settimana tipica: un quarto di ciò che ognuno ha fatto nelle quattro settimane precedenti.',
    usualMonth:
      '100% è un mese tipico: ciò che ognuno ha fatto nelle quattro settimane precedenti, esteso alla durata del mese.',
    weightCounts:
      'Peso × ripetizioni sulle serie allenanti. Negli esercizi a corpo libero come trazioni e dip conta solo la zavorra.',
    oneNotSharing: (name: string) =>
      `${name} non condivide il suo allenamento, quindi non è in classifica.`,
    manyNotSharing: (count: number) =>
      `${String(count)} amici non condividono il loro allenamento, quindi non sono in classifica.`,
    noPlace: 'Ancora nessuna posizione',
    yourPlace: (rank: number) => `Sei ${String(rank)}º`,
  },
  challenge: {
    title: {
      most: {
        workouts: 'Più allenamenti',
        lifted: 'Più peso sollevato',
        sets: 'Più serie',
        minutes: 'Più tempo di allenamento',
      },
      improved: {
        workouts: 'Più migliorati: allenamenti',
        lifted: 'Più migliorati: peso sollevato',
        sets: 'Più migliorati: serie',
        minutes: 'Più migliorati: tempo di allenamento',
      },
    },
    metric: {
      workouts: 'allenamenti',
      lifted: 'peso sollevato',
      sets: 'serie',
      minutes: 'tempo di allenamento',
    },
    ofUsual: '% del solito',
    underAnHour: 'Meno di un’ora rimasta',
    hoursLeft: (hours: number) => (hours === 1 ? 'Manca 1 ora' : `Mancano ${String(hours)} ore`),
    daysLeft: (days: number) => `Mancano ${String(days)} giorni`,
    against: (title: string, name: string) => `${title}, contro ${name}`,
    sent: (when: string) => `Inviata ${when}`,
    ended: (when: string) => `Terminata ${when}`,
    waiting: (name: string) => `In attesa che ${name} accetti`,
    challengedYou: (name: string) => `${name} ti ha sfidato. Sette giorni, da quando accetti.`,
    youWon: 'Hai vinto',
    theyWon: (name: string) => `Ha vinto ${name}`,
    draw: 'Pareggio',
    unavailable: 'Risultato non disponibile',
    finalizing: 'Risultato in definizione',
    sharingOff:
      'La condivisione dell’allenamento è disattivata, quindi questa sfida non può essere conteggiata.',
    finalizingNote:
      'Concediamo 24 ore perché gli allenamenti offline si sincronizzino. Poi i punteggi sono definitivi.',
    recovered: 'Risultato recuperato · basato sull’allenamento disponibile',
    excluded:
      'L’allenamento non era disponibile quando i punteggi sono stati bloccati. Questo risultato è escluso dal tuo bilancio.',
    gotIt: 'Ho capito',
    accept: 'Accetta',
    decline: 'Rifiuta',
    acceptLabel: (name: string) => `Accetta la sfida di ${name}`,
    declineLabel: (name: string) => `Rifiuta la sfida di ${name}`,
    takeBackLabel: (name: string) => `Ritira la tua sfida a ${name}`,
    takeBack: 'Ritirala',
    resultUnchanged:
      'L’allenamento non era disponibile quando i punteggi sono stati bloccati. Il tuo bilancio non cambia.',
    resultOf: (i: number, n: number) => `Risultato ${String(i)} di ${String(n)}`,
    view: 'Vedi sfida',
    nextResult: 'Risultato successivo',
    later: 'Più tardi',
    resultAgainst: (title: string, name: string) => `${title} contro ${name}`,
    heading: 'Sfide',
    challenge: (name: string) => `Sfida ${name}`,
    fromAccept: (name: string) => `Sette giorni, da quando ${name} accetta.`,
    explainImproved:
      'Sette giorni, ognuno contro le proprie ultime quattro settimane, così è giusto chiunque si alleni di più.',
    explainMost: 'Sette giorni. Vince chi fa di più.',
    send: 'Invia sfida',
    startsWhen: (name: string) => `Inizia quando ${name} accetta.`,
    problems: {
      already_live: (name: string) => `Hai già una sfida con ${name}. Una alla volta.`,
      not_sharing: (name: string) =>
        `${name} non condivide il suo allenamento, quindi una sfida non può essere conteggiata.`,
      you_not_sharing: (_name: string) =>
        'Attiva la condivisione del tuo allenamento nelle Impostazioni per partecipare alle sfide.',
      no_usual: (name: string) =>
        `${name} non ha allenamenti nelle ultime quattro settimane da confrontare. Prova con Di più.`,
      you_no_usual: (_name: string) =>
        'Non hai allenamenti nelle ultime quattro settimane da confrontare. Prova con Di più.',
      not_friends: (name: string) => `${name} non è più nella tua lista di amici.`,
      not_found: (_name: string) => 'Quella sfida non esiste più.',
      too_many: (_name: string) => 'Troppe sfide inviate. Riprova più tardi.',
      invalid: (_name: string) => 'Qualcosa non andava con quella sfida. Riprova.',
    },
  },
};
