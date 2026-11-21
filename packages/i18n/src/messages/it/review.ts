import type { Messages } from '../en/index.js';

const GROUPS: Record<string, string> = {
  chest: 'petto',
  back: 'schiena',
  shoulders: 'spalle',
  biceps: 'bicipiti',
  triceps: 'tricipiti',
  quads: 'quadricipiti',
  hamstrings: 'femorali',
  glutes: 'glutei',
  calves: 'polpacci',
  core: 'core',
};

const group = (slug: string): string => GROUPS[slug] ?? slug;

const lower = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

export const review: Messages['review'] = {
  card: {
    eyebrow: 'Dal tuo registro',
    title: 'Come sta andando',
    intro: 'Letto da ciò che hai registrato, che l’abbia scritto il piano o tu.',
  },
  mark: {
    seconds: (reps: number) => `${String(reps)} s`,
    reps: (reps: number) => `${String(reps)} rip.`,
    forSeconds: (reps: number) => ` per ${String(reps)} s`,
    times: (reps: number) => ` × ${String(reps)}`,
    help: (count: string, weight: string) => `${count} con ${weight} di aiuto`,
  },
  ago: (days: number) =>
    days < 14
      ? `${String(days)} ${days === 1 ? 'giorno' : 'giorni'} fa`
      : `${String(Math.round(days / 7))} settimane fa`,
  consistency: {
    heading: 'Ti alleni meno di quanto avevi previsto',
    detail: (perWeek: number, weeks: number, target: number) =>
      `Circa ${String(perWeek)} sessioni a settimana nelle ultime ${String(weeks)}, contro le ${String(target)} che hai impostato. Il piano è costruito per ${String(target)}; se non è la settimana che hai, conviene cambiare il numero.`,
  },
  groupShort: {
    heading: (slug: string) => `Poco lavoro per ${group(slug)}`,
    detail: (perWeek: number, target: number) =>
      `${String(perWeek)} serie a settimana contro un obiettivo di ${String(target)}. È la cosa più indietro di tutto ciò che alleni, quindi è la prima da aggiungere.`,
  },
  groupOver: {
    heading: (slug: string) => `Molto lavoro per ${group(slug)}`,
    detail: (perWeek: number, target: number) =>
      `${String(perWeek)} serie a settimana contro un obiettivo di ${String(target)}. Non fa male, ma oltre un certo punto le serie in più smettono di ripagare il recupero che costano.`,
  },
  climbing: {
    heading: (name: string) => `${name}: sta salendo`,
    detail: (from: string, to: string, sessions: number) =>
      `Da ${from} a ${to} in ${String(sessions)} sessioni. Vuol dire che funziona.`,
  },
  stalled: {
    heading: (name: string) => `${name}: è fermo`,
    detail: (best: string, ago: string, sessionsSince: number, advice: string) =>
      `Il tuo miglior risultato recente è ancora ${best}, di ${ago}, e ${
        sessionsSince === 1
          ? 'la sessione successiva non l’ha superato'
          : `le ${String(sessionsSince)} sessioni successive non l’hanno superato`
      }. ${advice}`,
    backOff:
      'Uno stallo di solito si sblocca scendendo di circa il dieci per cento e ripartendo, cosa che il piano fa per te dopo tre sessioni sotto tono di fila.',
    yours: (timed: boolean) =>
      `${timed ? 'Un esercizio isometrico' : 'Un esercizio a corpo libero'} di solito riparte con una serie in più o con ripetizioni più lente e dure. Il piano non adatta ${timed ? 'gli isometrici' : 'questi esercizi'} per te, quindi tocca a te.`,
  },
  tooSoon: {
    heading: 'Non ci sono ancora abbastanza dati',
    detail: (sessions: number, needed: number) =>
      `${String(sessions)} sessioni registrate su ${String(needed)}. Quando ce ne saranno alcune, qui vedrai come sta andando davvero.`,
  },
  notEnoughWeeks: {
    heading: 'Abbastanza sessioni, troppe poche settimane',
    detail: (sessions: number, days: number, wait: number) =>
      `${String(sessions)} sessioni in ${String(days)} ${days === 1 ? 'giorno' : 'giorni'}. Un andamento settimanale ha bisogno di circa due settimane per dire qualcosa, quindi ricontrolla ${wait === 1 ? 'domani' : `tra ${String(wait)} giorni`}.`,
  },
  pace: {
    onTrack: {
      heading: 'Il tuo peso fa quello che gli hai chiesto',
      detail: (rate: string, goal: string) =>
        `${rate} a settimana, dentro l’intervallo per «${lower(goal)}». Niente da cambiare.`,
    },
    fast: {
      heading: 'Il tuo peso cambia più in fretta di quanto vuole l’obiettivo',
      detail: (rate: string, goal: string) =>
        `${rate} a settimana. Più veloce dell’intervallo per «${lower(goal)}», il che di solito vuol dire perdere forza per strada, mentre l’allenamento qui serve a mantenerla.`,
    },
    slow: {
      heading: 'Il tuo peso si muove appena',
      detail: (rate: string, goal: string) =>
        `${rate} a settimana, sotto l’intervallo per «${lower(goal)}». Non è l’allenamento a cambiare questo.`,
    },
    wrongWay: {
      heading: 'Il tuo peso va nella direzione opposta',
      detail: (rate: string, down: boolean, goal: string) =>
        `${rate} a settimana in ${down ? 'meno' : 'più'}, e hai scelto «${lower(goal)}». O è cambiato l’obiettivo o è cambiata la settimana: vale la pena guardare entrambi.`,
    },
  },
  links: {
    rate: (perWeek: string) => `${perWeek} a settimana`,
    attendance: {
      heading: (name: string) => `${name} è fermo, e dipende dalle sessioni`,
      detail: (rate: string, target: number) =>
        `Ti sei allenato ${rate} contro le ${String(target)} che hai impostato. Un esercizio deve tornare abbastanza spesso per progredire: non è ancora un problema di programmazione.`,
    },
    deficit: {
      heading: (name: string) => `${name} è fermo, e il tuo peso lo spiega`,
      detail: (best: string, losing: string) =>
        `Il tuo miglior risultato recente è ancora ${best}, mentre perdi ${losing} a settimana. In deficit la forza di solito si ferma: mantenerla è già una vittoria, quindi meglio lasciare così che rifare il piano.`,
    },
    programming: {
      heading: (name: string) => `${name} è fermo, e nient’altro lo spiega`,
      detail: (best: string, sessions: number, advice: string) =>
        `Il tuo miglior risultato recente è ancora ${best} dopo altre ${String(sessions)} ${sessions === 1 ? 'sessione' : 'sessioni'}, con gli allenamenti fatti e il peso dove volevi. Resta l’allenamento: ${advice}`,
      backOff:
        'scendi di circa il dieci per cento e riparti, cosa che il piano fa per te dopo tre sessioni sotto tono.',
      yours:
        'aggiungi una serie o rallenta ogni ripetizione. Il piano non le adatta per te, quindi il cambiamento spetta a te.',
    },
    shortfall: {
      heading: (slug: string) => `Poco lavoro per ${group(slug)} perché mancano le sessioni`,
      detail: (rate: string, target: number) =>
        `Ti alleni ${rate} contro le ${String(target)} che hai impostato. Aggiungere volume a un piano che non riesci a seguire non lo risolve: prima viene la costanza.`,
    },
    confirmed: {
      heading: 'Funziona',
      detail: (name: string, from: string, to: string, pace: string) =>
        `${name}: da ${from} a ${to}, e il tuo peso cambia di ${pace} a settimana, dove volevi. Qui non c’è niente da cambiare.`,
    },
  },
};
