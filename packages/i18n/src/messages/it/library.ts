import type { Messages } from '../en/index.js';

export const library: Messages['library'] = {
  addExercise: 'Aggiungi un esercizio',
  exercises: 'Esercizi',
  superset: 'Superserie',
  supersetOn: 'Scegli nell’ordine dell’allenamento.',
  supersetOff: 'Uno dopo l’altro, poi recupero.',
  search: 'Cerca',
  searchPlaceholder: 'Squat, panca, rematore…',
  equipment: 'Attrezzatura',
  selected: (count: number) => ` · ${String(count)} selezionati`,
  equipmentHint:
    'Senza selezione si vede tutto. Selezionandone alcuni, vedi solo ciò che puoi fare esattamente con quelli: ogni attrezzo di cui un esercizio ha bisogno deve essere spuntato.',
  count: (count: number) => (count === 1 ? '1 esercizio' : `${String(count)} esercizi`),
  bestMatches: 'Risultati migliori prima',
  mostUsed: 'Più usati prima · Ultimi 90 giorni',
  chartKey:
    'Carico per allenamento · Ultime 6 sessioni. Miglior serie allenante; + zavorra, − assistenza, PC peso corporeo.',
  confirm: (count: number) => `Conferma (${String(count)})`,
  cardio: 'Cardio',
  compound: 'Multiarticolare',
  isolation: 'Isolamento',
  recommended: 'Consigliato',
  noneOnDevice:
    'Ancora nessun esercizio su questo dispositivo. Arrivano con la prima sincronizzazione: apri l’app una volta con la connessione e restano per sempre.',
  noMatch: 'Niente corrisponde a tutti questi filtri.',
  clearFilters: 'Azzera filtri',
  muscleFilters: 'Filtri muscolari',
  all: 'Tutti',
  favourite: 'Preferito',
  favouriteMark: '(preferito)',
  kit: {
    label: 'Con cosa ti alleni',
    bodyweight: 'Corpo libero',
    both: 'Tutto',
    gym: 'Palestra',
  },
  stepper: {
    decrease: (label: string) => `Diminuisci ${label}`,
    increase: (label: string) => `Aumenta ${label}`,
  },
  detail: {
    missing: (slug: string) =>
      `Su questo dispositivo non c’è nessun esercizio chiamato ${slug}. Potrebbe essere stato rinominato o non ancora sincronizzato.`,
    unknownMuscle: 'Muscolo sconosciuto',
    roles: { primary: 'Motore principale', secondary: 'Assiste', stabilizer: 'Stabilizza' },
    alsoCalled: (aliases: string) => `Chiamato anche ${aliases}`,
    difficulty: { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzato' },
    oneSide: 'Un lato alla volta',
    timed: 'Tenuto a tempo',
    startingPoint: 'Punto di partenza',
    seconds: ' s',
    suggestedHold: 'Tenuta consigliata',
    suggestedReps: 'Ripetizioni consigliate',
    rest: 'Recupero tra le serie',
    restCompound: 'Più lungo: è un multiarticolare',
    restIsolation: 'Più breve: è un esercizio di isolamento',
    restMinutes: (minutes: number) => `${String(minutes)} min`,
    restSeconds: (seconds: number) => `${String(seconds)} s`,
    cues: 'Indicazioni',
    muscles: 'Muscoli allenati',
    cardioMuscles:
      'Il cardio allena cuore e polmoni più di qualsiasi muscolo, quindi non viene contato sulla mappa del corpo: venti minuti su una macchina non sono venti serie di niente.',
    notRecorded: 'Non registrato per questo esercizio.',
    howTo: 'Come si esegue',
    mistakes: 'Errori comuni',
    equipment: 'Attrezzatura',
    noEquipment: 'Niente di niente.',
    whatYouLog: 'Cosa registri',
    logged: (fields: string) =>
      `${fields} Le calorie vengono stimate da questi dati e dal tuo peso corporeo, oppure puoi inserire il valore della macchina.`,
    itsTime: 'la durata',
    eachBout: (fields: readonly string[]) => {
      const spoken =
        fields.length === 1
          ? fields[0]
          : `${fields.slice(0, -1).join(', ')} e ${fields.at(-1) ?? ''}`;
      return `Ogni blocco registra ${spoken ?? ''}.`;
    },
    video: 'Video',
    videoNeedsConnection: 'Richiede una connessione. Tutto ciò che sta sopra questa linea no.',
    oneRepMax: 'Il tuo massimale stimato',
    on: (set: string, date: string) => `${set} il ${date}`,
    nothingRecent: (weeks: number, source: string) =>
      `Niente nelle ultime ${String(weeks)} settimane, quindi questo è il tuo miglior risultato di sempre, da ${source}.`,
    from: (source: string) => `Da ${source}.`,
    bodyweightIncluded: ' Il tuo peso corporeo è incluso.',
    bestEver: (estimate: string, source: string) =>
      `Migliore di sempre: ${estimate}, da ${source}.`,
    epley:
      'Calcolato con la formula di Epley dalla tua miglior serie da 12 ripetizioni o meno. Una stima per scegliere i carichi di lavoro, non un numero da andare a testare.',
    seeTrend: 'Vedi l’andamento',
    playDemo: 'Riproduci dimostrazione',
    pauseDemo: 'Metti in pausa la dimostrazione',
    musclesLabel: (muscles: string) => `Muscoli allenati: ${muscles}. Viste frontale e posteriore.`,
    front: 'Fronte',
    back: 'Retro',
  },
  learn: {
    title: 'Impara',
    modes: { explore: 'Esplora', heatmap: 'Cosa ho allenato' },
    heatmapIntro: (weeks: number) => `Cosa hai allenato in ${String(weeks)} settimane.`,
    exploreIntro: 'Tocca un muscolo per vedere cosa lo allena.',
    plates: 'Dischi',
    noMuscles:
      'Ancora nessun muscolo su questo dispositivo, quindi sul modello non si può toccare niente. Arrivano con la prima sincronizzazione: apri l’app una volta con la connessione e restano per sempre.',
    bodyView: 'Vista del corpo',
    hint: 'Trascina per ruotare. Tocca un muscolo.',
    chooseMuscle: 'Scegli un muscolo',
    muscleExercises: 'Esercizi per il muscolo',
    explore: 'Esplora i muscoli',
    exploreHint: 'Tocca il corpo o scegli un muscolo per trovare gli esercizi.',
    browseAll: 'Sfoglia tutti gli esercizi',
    worthAdding: 'Da aggiungere',
    lastWeeks: (weeks: number) => `Ultime ${String(weeks)} settimane`,
    worthAddingHint:
      'I gruppi più indietro rispetto all’obiettivo settimanale, e un esercizio per ciascuno.',
    behind: (group: string, sets: number) => `${group} · ${String(sets)} serie indietro`,
    working: 'Sto calcolando cosa hai allenato…',
    heatNote:
      'Il colore indica il volume rispetto al muscolo che hai lavorato di più: cosa hai allenato di più, non se l’hai allenato abbastanza.',
    heatEmpty:
      'Niente registrato nelle ultime quattro settimane. Completa un allenamento e comparirà qui.',
    placeholderModel:
      'La figura è generata da origini e inserzioni: il modello anatomico con licenza non è in questa build. Tutto il resto di questa schermata è reale.',
    sculptedModel: 'Un corpo scolpito, diviso tra i muscoli che arrivano alla pelle.',
    notInCatalogue: 'Quel muscolo non è ancora nel catalogo di questo dispositivo.',
    clear: 'Azzera',
    nothingTrains: 'Niente nel catalogo lo allena, per ora.',
    alsoWorked: 'Allenati anche',
    alsoWorkedHint: 'Qui lavora come muscolo di supporto, non come principale.',
  },
  plates: {
    title: 'Calcolatore dischi',
    intro: 'Cosa va su ogni lato, nelle misure che riconosci.',
    weightOnBar: 'Peso sul bilanciere',
    ezWeighs: 'Il bilanciere EZ di questa palestra pesa',
    hidden: (count: number) =>
      `${count === 1 ? 'Un disco è nascosto' : `${String(count)} dischi sono nascosti`} perché la tua palestra non ${count === 1 ? 'lo' : 'li'} ha.`,
    bar: 'Bilanciere',
    ezBar: 'Bilanciere EZ',
    tooMuch:
      'È più di quanto possa reggere il manicotto di questo bilanciere. Prova con meno dischi, un peso più leggero o un bilanciere più lungo.',
    justBar: (weight: string, unit: string) =>
      `Solo il bilanciere: ${weight} ${unit}, niente sopra.`,
    lighter: (weight: string, unit: string) =>
      `Più leggero del solo bilanciere, che pesa ${weight} ${unit}.`,
    eachEnd: 'Per lato',
    onBar: (weight: string, unit: string) => `su un bilanciere da ${weight} ${unit}`,
    closest: (total: string, short: string, unit: string) =>
      `: il valore più vicino con questi dischi è ${total} ${unit}, ${short} ${unit} in meno`,
    colours: 'I colori',
    coloursHint: 'Quale disco è quale, sul bilanciere e sulla rastrelliera.',
    available: 'Dischi disponibili',
    availableHint:
      'Quali dischi ha questa palestra. Un disco deselezionato viene escluso dal bilanciere, dal calcolo e dai colori qui sopra.',
  },
};
