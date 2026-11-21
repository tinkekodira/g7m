import type { Messages } from '../en/index.js';

type Units = 'metric' | 'imperial';

const weight = (units: Units, kg: string, lb: string): string =>
  units === 'imperial' ? `${lb} lb` : `${kg} kg`;

const tonnage = (units: Units, tonnes: string, comparison: string): string =>
  `Solleva ${tonnes} ${units === 'imperial' ? 'tonnellate corte' : 'tonnellate'} in totale, ${comparison}`;

export const achievements: Messages['achievements'] = {
  badges: {
    'day-one': { name: 'Giorno uno', description: 'Completa il tuo primo allenamento' },
    'double-digits': { name: 'Doppia cifra', description: 'Completa 10 allenamenti' },
    'quarter-century': { name: 'Quarto di secolo', description: 'Completa 25 allenamenti' },
    'fifty-strong': { name: 'Cinquanta', description: 'Completa 50 allenamenti' },
    centurion: { name: 'Centurione', description: 'Completa 100 allenamenti' },
    'iron-veteran': { name: 'Veterano del ferro', description: 'Completa 250 allenamenti' },
    lifer: { name: 'A vita', description: 'Completa 500 allenamenti' },
    'record-breaker': {
      name: 'Battirecord',
      description: 'Stabilisci il tuo primo record personale',
    },
    'pr-machine': { name: 'Macchina da record', description: 'Stabilisci 25 record personali' },
    'heavy-mover': {
      name: 'Peso massimo',
      description: (units: Units) => tonnage(units, '10', 'circa due elefanti'),
    },
    'whale-of-a-time': {
      name: 'Balenottera azzurra',
      description: (units: Units) => tonnage(units, '100', 'circa una balenottera azzurra'),
    },
    'mountain-mover': {
      name: 'Sposta montagne',
      description: (units: Units) => tonnage(units, '1.000', 'più di due jumbo jet'),
    },
    'plate-club': {
      name: 'Club del disco',
      description: (units: Units) => `Panca piana con ${weight(units, '60', '135')}`,
    },
    'two-plate-bench': {
      name: 'Panca a due dischi',
      description: (units: Units) => `Panca piana con ${weight(units, '100', '225')}`,
    },
    'three-plate-bench': {
      name: 'Panca a tre dischi',
      description: (units: Units) => `Panca piana con ${weight(units, '140', '315')}`,
    },
    'two-plate-squat': {
      name: 'Squat a due dischi',
      description: (units: Units) => `Squat con ${weight(units, '100', '225')}`,
    },
    'three-plate-squat': {
      name: 'Squat a tre dischi',
      description: (units: Units) => `Squat con ${weight(units, '140', '315')}`,
    },
    'four-plate-squat': {
      name: 'Squat a quattro dischi',
      description: (units: Units) => `Squat con ${weight(units, '180', '405')}`,
    },
    'three-plate-pull': {
      name: 'Stacco a tre dischi',
      description: (units: Units) => `Stacco da terra con ${weight(units, '140', '315')}`,
    },
    'four-plate-pull': {
      name: 'Stacco a quattro dischi',
      description: (units: Units) => `Stacco da terra con ${weight(units, '180', '405')}`,
    },
    'five-plate-pull': {
      name: 'Stacco a cinque dischi',
      description: (units: Units) => `Stacco da terra con ${weight(units, '220', '495')}`,
    },
    'plate-overhead': {
      name: 'Disco sopra la testa',
      description: (units: Units) => `Lento avanti con ${weight(units, '60', '135')}`,
    },
    'total-club': {
      name: (units: Units) => (units === 'imperial' ? 'Il club delle 1.000 lb' : 'Il club dei 500'),
      description: (units: Units) =>
        `I tuoi migliori panca, squat e stacco sommano ${weight(units, '500', '1.000')}`,
    },
    'bench-your-body': {
      name: 'Il tuo peso in panca',
      description: 'Fai panca piana con il tuo peso corporeo',
    },
    'squat-and-a-half': {
      name: 'Squat e mezzo',
      description: 'Squat con 1,5 volte il tuo peso corporeo',
    },
    'double-trouble': {
      name: 'Doppia dose',
      description: 'Stacco da terra con il doppio del tuo peso corporeo',
    },
    'ten-clean': {
      name: 'Dieci pulite',
      description: '10 trazioni in una serie, senza assistenza',
    },
    'gym-rat': { name: 'Topo da palestra', description: 'Completa 5 allenamenti in una settimana' },
    'no-days-off': { name: 'Niente riposo', description: 'Allenati 7 giorni di fila' },
    'on-a-roll': {
      name: 'Lanciato',
      description: 'Rispetta i giorni del tuo obiettivo per 4 settimane di fila',
    },
    'habit-formed': {
      name: 'Abitudine presa',
      description: 'Rispetta i giorni del tuo obiettivo per 12 settimane di fila',
    },
    'half-year-hero': {
      name: 'Eroe del semestre',
      description: 'Rispetta i giorni del tuo obiettivo per 26 settimane di fila',
    },
    'year-rounder': {
      name: 'Tutto l’anno',
      description: 'Rispetta i giorni del tuo obiettivo per 52 settimane di fila',
    },
    'comeback-kid': {
      name: 'Il ritorno',
      description: 'Torna dopo 30 giorni o più di pausa',
    },
    'early-bird': { name: 'Mattiniero', description: 'Inizia ad allenarti prima delle 6' },
    'night-owl': { name: 'Nottambulo', description: 'Allenati tra mezzanotte e le 4' },
    'weekend-warrior': {
      name: 'Guerriero del weekend',
      description: 'Allenati il sabato e la domenica dello stesso weekend',
    },
    'new-year-same-me': { name: 'Anno nuovo, stesso me', description: 'Allenati il 1° gennaio' },
    'jingle-lifts': { name: 'Natale di ferro', description: 'Allenati il giorno di Natale' },
    'leap-lifter': { name: 'Anno bisestile', description: 'Allenati il 29 febbraio' },
    'heart-starter': { name: 'Cuore acceso', description: 'Registra il tuo primo cardio' },
    'the-2k': { name: 'I 2K', description: 'Rema 2.000 m di fila' },
    'five-k-finisher': {
      name: '5K completati',
      description: 'Corri o cammina 5 km di fila sul tapis roulant',
    },
    marathoner: {
      name: 'Maratoneta',
      description: 'Percorri 42,2 km di cardio in totale, una maratona',
    },
    'road-tripper': {
      name: 'In viaggio',
      description: (units: Units) =>
        `Percorri ${units === 'imperial' ? '60 miglia' : '100 km'} di cardio in totale`,
    },
    everest: {
      name: 'Everest',
      description: 'Sali 8.849 m sullo stepper e con la pendenza del tapis roulant',
    },
    furnace: { name: 'Fornace', description: 'Brucia 500 kcal di cardio in un allenamento' },
    'machine-collector': {
      name: 'Collezionista di macchine',
      description: 'Usa tutte e cinque le macchine cardio',
    },
    'hybrid-athlete': {
      name: 'Atleta ibrido',
      description: 'Pesi e cardio nello stesso allenamento',
    },
    explorer: { name: 'Esploratore', description: 'Registra 25 esercizi diversi' },
    'lit-up': {
      name: 'Tutto acceso',
      description: 'Allena ogni gruppo muscolare in una settimana',
    },
    'birthday-pump': {
      name: 'Pump di compleanno',
      description: 'Allenati il giorno del tuo compleanno',
    },
  },
};
