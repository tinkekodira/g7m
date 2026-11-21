import type { Messages } from '../en/index.js';

type Units = 'metric' | 'imperial';

const weight = (units: Units, kg: string, lb: string): string =>
  units === 'imperial' ? `${lb} lb` : `${kg} kg`;

const tonnage = (units: Units, tonnes: string, comparison: string): string =>
  `Soulève ${tonnes} ${units === 'imperial' ? 'tonnes courtes' : 'tonnes'} au total, ${comparison}`;

export const achievements: Messages['achievements'] = {
  badges: {
    'day-one': { name: 'Jour un', description: 'Termine ta première séance' },
    'double-digits': { name: 'Deux chiffres', description: 'Termine 10 séances' },
    'quarter-century': { name: 'Quart de siècle', description: 'Termine 25 séances' },
    'fifty-strong': { name: 'Cinquante', description: 'Termine 50 séances' },
    centurion: { name: 'Centurion', description: 'Termine 100 séances' },
    'iron-veteran': { name: 'Vétéran de la fonte', description: 'Termine 250 séances' },
    lifer: { name: 'À vie', description: 'Termine 500 séances' },
    'record-breaker': {
      name: 'Briseur de records',
      description: 'Établis ton premier record personnel',
    },
    'pr-machine': { name: 'Machine à records', description: 'Établis 25 records personnels' },
    'heavy-mover': {
      name: 'Poids lourd',
      description: (units: Units) => tonnage(units, '10', 'environ deux éléphants'),
    },
    'whale-of-a-time': {
      name: 'Baleine bleue',
      description: (units: Units) => tonnage(units, '100', 'environ une baleine bleue'),
    },
    'mountain-mover': {
      name: 'Déplaceur de montagnes',
      description: (units: Units) => tonnage(units, '1 000', 'plus que deux gros-porteurs'),
    },
    'plate-club': {
      name: 'Club du disque',
      description: (units: Units) => `Développé couché à ${weight(units, '60', '135')}`,
    },
    'two-plate-bench': {
      name: 'Couché à deux disques',
      description: (units: Units) => `Développé couché à ${weight(units, '100', '225')}`,
    },
    'three-plate-bench': {
      name: 'Couché à trois disques',
      description: (units: Units) => `Développé couché à ${weight(units, '140', '315')}`,
    },
    'two-plate-squat': {
      name: 'Squat à deux disques',
      description: (units: Units) => `Squat à ${weight(units, '100', '225')}`,
    },
    'three-plate-squat': {
      name: 'Squat à trois disques',
      description: (units: Units) => `Squat à ${weight(units, '140', '315')}`,
    },
    'four-plate-squat': {
      name: 'Squat à quatre disques',
      description: (units: Units) => `Squat à ${weight(units, '180', '405')}`,
    },
    'three-plate-pull': {
      name: 'Soulevé à trois disques',
      description: (units: Units) => `Soulevé de terre à ${weight(units, '140', '315')}`,
    },
    'four-plate-pull': {
      name: 'Soulevé à quatre disques',
      description: (units: Units) => `Soulevé de terre à ${weight(units, '180', '405')}`,
    },
    'five-plate-pull': {
      name: 'Soulevé à cinq disques',
      description: (units: Units) => `Soulevé de terre à ${weight(units, '220', '495')}`,
    },
    'plate-overhead': {
      name: 'Disque au-dessus de la tête',
      description: (units: Units) => `Développé militaire à ${weight(units, '60', '135')}`,
    },
    'total-club': {
      name: (units: Units) => (units === 'imperial' ? 'Le club des 1 000 lb' : 'Le club des 500'),
      description: (units: Units) =>
        `Tes meilleurs couché, squat et soulevé de terre totalisent ${weight(units, '500', '1 000')}`,
    },
    'bench-your-body': {
      name: 'Ton poids au couché',
      description: 'Développé couché avec ton propre poids de corps',
    },
    'squat-and-a-half': {
      name: 'Squat et demi',
      description: 'Squat à 1,5 fois ton poids de corps',
    },
    'double-trouble': {
      name: 'Double dose',
      description: 'Soulevé de terre à deux fois ton poids de corps',
    },
    'ten-clean': {
      name: 'Dix propres',
      description: '10 tractions en une série, sans assistance',
    },
    'gym-rat': { name: 'Rat de salle', description: 'Termine 5 séances en une semaine' },
    'no-days-off': { name: 'Pas de jour off', description: 'Entraîne-toi 7 jours d’affilée' },
    'on-a-roll': {
      name: 'Sur la lancée',
      description: 'Atteins les jours de ton objectif 4 semaines d’affilée',
    },
    'habit-formed': {
      name: 'Habitude prise',
      description: 'Atteins les jours de ton objectif 12 semaines d’affilée',
    },
    'half-year-hero': {
      name: 'Héros du semestre',
      description: 'Atteins les jours de ton objectif 26 semaines d’affilée',
    },
    'year-rounder': {
      name: 'Toute l’année',
      description: 'Atteins les jours de ton objectif 52 semaines d’affilée',
    },
    'comeback-kid': {
      name: 'Le retour',
      description: 'Reviens après 30 jours ou plus d’absence',
    },
    'early-bird': { name: 'Lève-tôt', description: 'Commence une séance avant 6 h' },
    'night-owl': { name: 'Oiseau de nuit', description: 'Entraîne-toi entre minuit et 4 h' },
    'weekend-warrior': {
      name: 'Guerrier du week-end',
      description: 'Entraîne-toi le samedi et le dimanche d’un même week-end',
    },
    'new-year-same-me': {
      name: 'Nouvelle année, même moi',
      description: 'Entraîne-toi le 1er janvier',
    },
    'jingle-lifts': { name: 'Fonte de Noël', description: 'Entraîne-toi le jour de Noël' },
    'leap-lifter': { name: 'Année bissextile', description: 'Entraîne-toi le 29 février' },
    'heart-starter': { name: 'Mise en route', description: 'Enregistre ton premier cardio' },
    'the-2k': { name: 'Le 2K', description: 'Rame 2 000 m d’une traite' },
    'five-k-finisher': {
      name: 'Finisher 5K',
      description: 'Cours ou marche 5 km d’une traite sur le tapis',
    },
    marathoner: {
      name: 'Marathonien',
      description: 'Parcours 42,2 km de cardio au total, un marathon',
    },
    'road-tripper': {
      name: 'En road trip',
      description: (units: Units) =>
        `Parcours ${units === 'imperial' ? '60 miles' : '100 km'} de cardio au total`,
    },
    everest: {
      name: 'Everest',
      description: 'Grimpe 8 849 m sur le stepper et avec l’inclinaison du tapis',
    },
    furnace: { name: 'Fournaise', description: 'Brûle 500 kcal de cardio en une séance' },
    'machine-collector': {
      name: 'Collectionneur de machines',
      description: 'Utilise les cinq machines de cardio',
    },
    'hybrid-athlete': {
      name: 'Athlète hybride',
      description: 'Muscu et cardio dans la même séance',
    },
    explorer: { name: 'Explorateur', description: 'Enregistre 25 exercices différents' },
    'lit-up': {
      name: 'Tout allumé',
      description: 'Travaille chaque groupe musculaire en une semaine',
    },
    'birthday-pump': {
      name: 'Pump d’anniversaire',
      description: 'Entraîne-toi le jour de ton anniversaire',
    },
  },
};
