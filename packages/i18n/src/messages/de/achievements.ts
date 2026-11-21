import type { Messages } from '../en/index.js';

type Units = 'metric' | 'imperial';

const weight = (units: Units, kg: string, lb: string): string =>
  units === 'imperial' ? `${lb} lb` : `${kg} kg`;

const tonnage = (units: Units, tonnes: string, comparison: string): string =>
  `Hebe insgesamt ${tonnes} ${units === 'imperial' ? 'US-Tonnen' : 'Tonnen'}, ${comparison}`;

export const achievements: Messages['achievements'] = {
  badges: {
    'day-one': { name: 'Tag eins', description: 'Schließe dein erstes Training ab' },
    'double-digits': { name: 'Zweistellig', description: 'Schließe 10 Trainings ab' },
    'quarter-century': { name: 'Vierteljahrhundert', description: 'Schließe 25 Trainings ab' },
    'fifty-strong': { name: 'Fünfzig stark', description: 'Schließe 50 Trainings ab' },
    centurion: { name: 'Zenturio', description: 'Schließe 100 Trainings ab' },
    'iron-veteran': { name: 'Eisen-Veteran', description: 'Schließe 250 Trainings ab' },
    lifer: { name: 'Auf Lebenszeit', description: 'Schließe 500 Trainings ab' },
    'record-breaker': {
      name: 'Rekordbrecher',
      description: 'Stelle deinen ersten persönlichen Rekord auf',
    },
    'pr-machine': { name: 'PR-Maschine', description: 'Stelle 25 persönliche Rekorde auf' },
    'heavy-mover': {
      name: 'Schwerlast',
      description: (units: Units) => tonnage(units, '10', 'etwa zwei Elefanten'),
    },
    'whale-of-a-time': {
      name: 'Blauwal',
      description: (units: Units) => tonnage(units, '100', 'etwa ein Blauwal'),
    },
    'mountain-mover': {
      name: 'Bergversetzer',
      description: (units: Units) => tonnage(units, '1.000', 'mehr als zwei Jumbojets'),
    },
    'plate-club': {
      name: 'Scheiben-Club',
      description: (units: Units) => `Bankdrücken mit ${weight(units, '60', '135')}`,
    },
    'two-plate-bench': {
      name: 'Zwei Scheiben Bank',
      description: (units: Units) => `Bankdrücken mit ${weight(units, '100', '225')}`,
    },
    'three-plate-bench': {
      name: 'Drei Scheiben Bank',
      description: (units: Units) => `Bankdrücken mit ${weight(units, '140', '315')}`,
    },
    'two-plate-squat': {
      name: 'Zwei Scheiben Kniebeuge',
      description: (units: Units) => `Kniebeuge mit ${weight(units, '100', '225')}`,
    },
    'three-plate-squat': {
      name: 'Drei Scheiben Kniebeuge',
      description: (units: Units) => `Kniebeuge mit ${weight(units, '140', '315')}`,
    },
    'four-plate-squat': {
      name: 'Vier Scheiben Kniebeuge',
      description: (units: Units) => `Kniebeuge mit ${weight(units, '180', '405')}`,
    },
    'three-plate-pull': {
      name: 'Drei Scheiben Kreuzheben',
      description: (units: Units) => `Kreuzheben mit ${weight(units, '140', '315')}`,
    },
    'four-plate-pull': {
      name: 'Vier Scheiben Kreuzheben',
      description: (units: Units) => `Kreuzheben mit ${weight(units, '180', '405')}`,
    },
    'five-plate-pull': {
      name: 'Fünf Scheiben Kreuzheben',
      description: (units: Units) => `Kreuzheben mit ${weight(units, '220', '495')}`,
    },
    'plate-overhead': {
      name: 'Scheibe über Kopf',
      description: (units: Units) => `Schulterdrücken mit ${weight(units, '60', '135')}`,
    },
    'total-club': {
      name: (units: Units) => (units === 'imperial' ? 'Der 1.000-lb-Club' : 'Der 500er-Club'),
      description: (units: Units) =>
        `Bestes Bankdrücken, Kniebeugen und Kreuzheben ergeben zusammen ${weight(units, '500', '1.000')}`,
    },
    'bench-your-body': {
      name: 'Eigengewicht auf der Bank',
      description: 'Drücke dein eigenes Körpergewicht auf der Bank',
    },
    'squat-and-a-half': {
      name: 'Anderthalbfach gebeugt',
      description: 'Kniebeuge mit dem 1,5-Fachen deines Körpergewichts',
    },
    'double-trouble': {
      name: 'Doppelt stark',
      description: 'Kreuzheben mit dem Doppelten deines Körpergewichts',
    },
    'ten-clean': {
      name: 'Saubere Zehn',
      description: '10 Klimmzüge in einem Satz, ohne Unterstützung',
    },
    'gym-rat': { name: 'Studioratte', description: 'Schließe 5 Trainings in einer Woche ab' },
    'no-days-off': { name: 'Kein Ruhetag', description: 'Trainiere 7 Tage am Stück' },
    'on-a-roll': {
      name: 'Im Lauf',
      description: 'Erreiche die Trainingstage deines Ziels 4 Wochen in Folge',
    },
    'habit-formed': {
      name: 'Zur Gewohnheit geworden',
      description: 'Erreiche die Trainingstage deines Ziels 12 Wochen in Folge',
    },
    'half-year-hero': {
      name: 'Halbjahresheld',
      description: 'Erreiche die Trainingstage deines Ziels 26 Wochen in Folge',
    },
    'year-rounder': {
      name: 'Das ganze Jahr',
      description: 'Erreiche die Trainingstage deines Ziels 52 Wochen in Folge',
    },
    'comeback-kid': {
      name: 'Comeback',
      description: 'Komm nach 30 Tagen oder mehr Pause zurück',
    },
    'early-bird': { name: 'Frühaufsteher', description: 'Beginne ein Training vor 6 Uhr' },
    'night-owl': { name: 'Nachteule', description: 'Trainiere zwischen Mitternacht und 4 Uhr' },
    'weekend-warrior': {
      name: 'Wochenendkrieger',
      description: 'Trainiere am Samstag und am Sonntag desselben Wochenendes',
    },
    'new-year-same-me': { name: 'Neues Jahr, gleiches Ich', description: 'Trainiere am 1. Januar' },
    'jingle-lifts': { name: 'Stille Gewichte', description: 'Trainiere am ersten Weihnachtstag' },
    'leap-lifter': { name: 'Schaltjahr-Heber', description: 'Trainiere am 29. Februar' },
    'heart-starter': { name: 'Herzstarter', description: 'Trage dein erstes Cardio ein' },
    'the-2k': { name: 'Die 2K', description: 'Rudere 2.000 m am Stück' },
    'five-k-finisher': {
      name: '5K geschafft',
      description: 'Laufe oder gehe 5 km am Stück auf dem Laufband',
    },
    marathoner: {
      name: 'Marathonläufer',
      description: 'Lege insgesamt 42,2 km Cardio zurück, einen Marathon',
    },
    'road-tripper': {
      name: 'Auf großer Fahrt',
      description: (units: Units) =>
        `Lege insgesamt ${units === 'imperial' ? '60 Meilen' : '100 km'} Cardio zurück`,
    },
    everest: {
      name: 'Everest',
      description: 'Steige 8.849 m auf dem Stepper und mit der Steigung des Laufbands',
    },
    furnace: { name: 'Hochofen', description: 'Verbrenne 500 kcal Cardio in einem Training' },
    'machine-collector': {
      name: 'Gerätesammler',
      description: 'Nutze alle fünf Cardiogeräte',
    },
    'hybrid-athlete': {
      name: 'Hybridathlet',
      description: 'Krafttraining und Cardio im selben Training',
    },
    explorer: { name: 'Entdecker', description: 'Trage 25 verschiedene Übungen ein' },
    'lit-up': {
      name: 'Voll entflammt',
      description: 'Trainiere jede Muskelgruppe in einer Woche',
    },
    'birthday-pump': { name: 'Geburtstags-Pump', description: 'Trainiere an deinem Geburtstag' },
  },
};
