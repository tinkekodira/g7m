import type { Messages } from '../en/index.js';

type Region = 'legs' | 'arms' | 'shoulders' | 'back' | 'chest' | 'core';

const plural = (count: number, one: string, many: string): string =>
  `${String(count)} ${count === 1 ? one : many}`;

const REGION: Record<Region, string> = {
  legs: 'Gambe',
  arms: 'Braccia',
  shoulders: 'Spalle',
  back: 'Schiena',
  chest: 'Petto',
  core: 'Core',
};

export const home: Messages['home'] = {
  yourProfile: 'Il tuo profilo',
  thisMonth: 'Questo mese',
  quickAccess: 'Accesso rapido',
  stillOpen: 'Ancora aperto',
  inProgress: 'In corso',
  openIt: 'Aprilo',
  today: {
    label: 'Allenamento di oggi',
    noGoalTitle: 'Ricevi un piano fatto per te',
    noGoalBody:
      'Scegli un obiettivo e quanti giorni ti alleni. Ci vogliono circa dieci secondi, e ogni sessione successiva viene costruita da ciò che registri.',
    chooseGoal: 'Scegli un obiettivo',
    working: 'Sto preparando la sessione di oggi…',
    minutes: (minutes: number) => `${String(minutes)} min`,
    sets: (sets: number) => `${String(sets)} serie`,
    doneTitle: 'Finito per oggi',
    trainedToday: (parts: string) => `Allenato oggi · ${parts}`,
    doneBody:
      'È nel recupero che il lavoro di oggi diventa progresso. La sessione di domani si costruisce da lì.',
    settingUp: 'Preparazione…',
    trainAgain: 'Allenati di nuovo',
    weekTitle: 'Hai completato la settimana',
    weekBody:
      'Tutto ciò che la sessione di oggi allenerebbe ha già avuto le sue serie negli ultimi sette giorni. Un’altra sessione ora costa più recupero di quanto renda.',
    trainAnyway: 'Allenati comunque',
    summary: (exercises: number, sets: number) =>
      `${String(exercises)} esercizi · ${String(sets)} serie`,
    about: (minutes: number) => ` · circa ${String(minutes)} min`,
    muscleGroups: 'Gruppi muscolari',
    start: 'Inizia allenamento',
    seePlan: 'Vedi il piano',
  },
  tiles: {
    plan: 'Piano di oggi',
    planDetail: 'Cosa suggerisce l’app',
    continue: 'Continua l’allenamento',
    start: 'Inizia un allenamento',
    continueDetail: 'Torna alla tua sessione',
    startDetail: 'Scegli una routine o parti da zero',
    calendar: 'Calendario',
    calendarDetail: 'I giorni in cui ti sei allenato',
    browse: 'Sfoglia esercizi',
    browseDetail: 'L’intera libreria',
    progress: 'Progressi',
    progressDetail: 'Come sta andando il tuo allenamento',
  },
  sync: {
    lost: 'Alcune modifiche non hanno raggiunto il server',
    stopped: 'La sincronizzazione si è fermata',
    lostDetail: 'Sono su questo telefono ma non verranno sincronizzate.',
    stoppedDetail: 'Tutto è ancora salvato su questo telefono.',
    see: 'Vedi cosa è successo',
  },
  cards: {
    records: 'Record personali',
    workouts: 'Allenamenti',
    muscles: 'Gruppi muscolari',
    activity: 'Forza e attività',
    slide: (name: string, position: number, total: number) =>
      `${name}, ${String(position)} di ${String(total)}`,
    workoutsLabel: (total: number, heading: string, detail: string) =>
      `Allenamenti questo mese: ${String(total)} completati. ${heading}. ${detail}`,
    yourWorkouts: 'I tuoi allenamenti',
    completed: 'completati',
    workoutsSummary: (total: number, current: string, previous: number, previousName: string) =>
      `${String(total)} allenamenti a ${current} finora, contro ${String(previous)} a questo punto di ${previousName}.`,
    musclesLabel: (sets: number, groups: number, heading: string, detail: string) =>
      `Gruppi muscolari questo mese: ${String(sets)} serie su ${String(groups)} ${groups === 1 ? 'gruppo' : 'gruppi'}. ${heading}. ${detail}`,
    groups: (count: number) => (count === 1 ? 'gruppo' : 'gruppi'),
    setsWord: (_count: number) => 'serie',
    noSets: 'Ancora nessuna serie questo mese.',
    activityLabel: (
      workouts: number,
      time: string,
      perWeek: string,
      lifted: string,
      range: string,
      heading: string,
      detail: string,
    ) =>
      `Forza e attività questo mese: ${String(workouts)} ${workouts === 1 ? 'allenamento' : 'allenamenti'}, ${time} di allenamento, ${perWeek} a settimana, ${lifted} sollevati. Rispetto a ${range}. ${heading}. ${detail}`,
    strengthActivity: 'Forza e attività',
    firstMonth: 'Primo mese',
    comparedWith: 'Rispetto a',
    range: (month: string, through: number) => `1–${String(through)} ${month}`,
    statWorkouts: 'Allenamenti',
    trainingTime: 'Tempo di allenamento',
    perWeek: 'A settimana',
    volumeLifted: 'Volume sollevato',
    recordsLabel: (count: number, heading: string, detail: string) =>
      `Record personali questo mese: ${String(count)} ${count === 1 ? 'nuovo record' : 'nuovi record'}. ${heading}. ${detail}`,
    newBests: (count: number) => (count === 1 ? 'nuovo record' : 'nuovi record'),
    exercise: 'Esercizio',
    firstTime: 'Prima volta',
    onYourBest: (weight: string) => `${weight} oltre il tuo record`,
    best: (weight: string) => `Record ${weight}`,
    sameAsLast: 'Come il mese scorso',
    noneLast: 'Nessuno il mese scorso',
    up: 'in più',
    down: 'in meno',
    yourMonth: 'Il tuo mese',
    today: 'Oggi',
    monthStart: (month: string) => `1 ${month}`,
    firstTitle: 'Il tuo primo allenamento avvia il grafico',
    firstBody:
      'Registrane uno e tutto si riempie: quanto spesso ti alleni, quali muscoli lavori e quanto sollevi, mese dopo mese.',
    logWorkout: 'Registra un allenamento',
  },
  insights: {
    workouts: {
      start: {
        heading: 'Il tuo mese inizia con un allenamento',
        detail: 'Registra una sessione e questa linea comincerà a salire.',
      },
      notYet: {
        heading: 'Ancora niente registrato questo mese',
        detail: (previous: number) =>
          `Il mese scorso hai fatto ${plural(previous, 'allenamento', 'allenamenti')}. Oggi è un buon giorno per iniziare.`,
      },
      firstMonth: {
        heading: 'Il tuo primo mese è iniziato',
        detail: (workouts: number) =>
          `${plural(workouts, 'allenamento', 'allenamenti')} finora. Il prossimo mese dovrà battere questo.`,
      },
      ahead: {
        heading: 'Sei lanciato',
        detail: (by: number) =>
          `${plural(by, 'allenamento', 'allenamenti')} in più rispetto a questo punto del mese scorso.`,
      },
      level: {
        heading: 'Alla pari con il mese scorso',
        detail: (workouts: number) =>
          `${plural(workouts, 'allenamento', 'allenamenti')}, come a questo punto del mese scorso.`,
      },
      behind: {
        heading: 'Un po’ indietro rispetto al mese scorso',
        detail: (by: number) =>
          `${plural(by, 'allenamento', 'allenamenti')} in meno rispetto a questo punto.`,
      },
    },
    muscles: {
      none: {
        heading: 'Ancora nessuna serie registrata questo mese',
        detail: 'Ogni serie che registri compare qui, per gruppo muscolare.',
      },
      early: {
        heading: 'Il quadro si sta riempiendo',
        detail: (sets: number) =>
          `${String(sets)} serie finora. Ancora qualche allenamento e si vedrà l’equilibrio.`,
      },
      neglected: {
        atLeast: (region: Region, days: number) =>
          `${REGION[region]}: niente da ${String(days)} giorni`,
        exactly: (region: Region, days: number) =>
          `${REGION[region]}: non allenato da ${String(days)} giorni`,
        detail: 'Merita un posto nel tuo prossimo allenamento.',
      },
      lopsided: {
        heading: (region: Region, percent: number) =>
          `${REGION[region]}: il ${String(percent)}% delle tue serie`,
        detail: 'Distribuire il lavoro evita che il resto resti indietro.',
      },
      balanced: {
        heading: 'Ben bilanciato',
        detail: 'Questo mese stai allenando tutti i principali gruppi muscolari.',
      },
      focused: {
        heading: (regions: readonly Region[]) =>
          `Soprattutto ${regions.map((region) => REGION[region].toLowerCase()).join(' e ')} finora`,
        detail: 'Il resto avrà il suo turno nel corso del mese.',
      },
    },
    activity: {
      quiet: {
        heading: 'Il tuo mese ti aspetta',
        detail: 'Tempo, volume e ritmo compariranno dopo il tuo primo allenamento.',
      },
      stronger: {
        heading: 'Stai sollevando di più',
        detail: (percent: number) =>
          `Il ${String(percent)}% di peso in più rispetto a questo punto del mese scorso.`,
      },
      consistent: {
        heading: 'Ottima costanza',
        detail: (perWeek: string) => `Circa ${perWeek} a settimana. Ci sei, e si vede.`,
      },
      catchUp: {
        heading: (by: number) =>
          by === 1 ? 'Un allenamento chiude il divario' : `${String(by)} allenamenti da recuperare`,
        detail:
          'Indietro rispetto al ritmo del mese scorso a questo punto, con il tempo per recuperare.',
      },
      steady: {
        heading: 'Un mese regolare',
        detail: 'Continua così e qui si vedrà l’andamento.',
      },
    },
    records: {
      oneLift: 'Un esercizio',
      none: {
        heading: 'Ancora nessun esercizio registrato questo mese',
        detail: 'Le tue serie più pesanti del mese compaiono qui, rispetto al tuo record.',
      },
      new: {
        heading: (count: number) =>
          count === 1 ? 'Un nuovo record personale' : `${String(count)} nuovi record personali`,
        detail: (name: string) => `${name}: più pesante che mai. Stai diventando più forte.`,
      },
      first: {
        heading: 'I tuoi primi record sono fissati',
        detail: (count: number) =>
          `${String(count)} ${count === 1 ? 'esercizio' : 'esercizi'} da battere d’ora in poi. Aumenta il carico e compariranno come nuovi record.`,
      },
      close: {
        heading: (weight: string) => `A ${weight} dal tuo record`,
        detail: (name: string) => `${name} ci è quasi. Una buona giornata e ci sei.`,
      },
      holding: {
        heading: 'I tuoi record reggono ancora',
        detail: 'Una serie più pesante in qualsiasi esercizio questo mese comparirà qui.',
      },
    },
  },
};
