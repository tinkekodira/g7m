import type { Messages } from '../en/index.js';

type Units = 'metric' | 'imperial';

const weight = (units: Units, kg: string, lb: string): string =>
  units === 'imperial' ? `${lb} lb` : `${kg} kg`;

const tonnage = (units: Units, tonnes: string, comparison: string): string =>
  `Levanta ${tonnes} ${units === 'imperial' ? 'toneladas cortas' : 'toneladas'} en total, ${comparison}`;

export const achievements: Messages['achievements'] = {
  badges: {
    'day-one': { name: 'Día uno', description: 'Termina tu primer entrenamiento' },
    'double-digits': { name: 'Dos cifras', description: 'Termina 10 entrenamientos' },
    'quarter-century': { name: 'Cuarto de siglo', description: 'Termina 25 entrenamientos' },
    'fifty-strong': { name: 'Cincuenta fuerte', description: 'Termina 50 entrenamientos' },
    centurion: { name: 'Centurión', description: 'Termina 100 entrenamientos' },
    'iron-veteran': { name: 'Veterano del hierro', description: 'Termina 250 entrenamientos' },
    lifer: { name: 'De por vida', description: 'Termina 500 entrenamientos' },
    'record-breaker': { name: 'Rompe récords', description: 'Consigue tu primer récord personal' },
    'pr-machine': { name: 'Máquina de récords', description: 'Consigue 25 récords personales' },
    'heavy-mover': {
      name: 'Carga pesada',
      description: (units: Units) => tonnage(units, '10', 'unos dos elefantes'),
    },
    'whale-of-a-time': {
      name: 'Ballena azul',
      description: (units: Units) => tonnage(units, '100', 'más o menos una ballena azul'),
    },
    'mountain-mover': {
      name: 'Mueve montañas',
      description: (units: Units) => tonnage(units, '1000', 'más que dos jumbos'),
    },
    'plate-club': {
      name: 'Club del disco',
      description: (units: Units) => `Press de banca con ${weight(units, '60', '135')}`,
    },
    'two-plate-bench': {
      name: 'Banca de dos discos',
      description: (units: Units) => `Press de banca con ${weight(units, '100', '225')}`,
    },
    'three-plate-bench': {
      name: 'Banca de tres discos',
      description: (units: Units) => `Press de banca con ${weight(units, '140', '315')}`,
    },
    'two-plate-squat': {
      name: 'Sentadilla de dos discos',
      description: (units: Units) => `Sentadilla trasera con ${weight(units, '100', '225')}`,
    },
    'three-plate-squat': {
      name: 'Sentadilla de tres discos',
      description: (units: Units) => `Sentadilla trasera con ${weight(units, '140', '315')}`,
    },
    'four-plate-squat': {
      name: 'Sentadilla de cuatro discos',
      description: (units: Units) => `Sentadilla trasera con ${weight(units, '180', '405')}`,
    },
    'three-plate-pull': {
      name: 'Peso muerto de tres discos',
      description: (units: Units) => `Peso muerto con ${weight(units, '140', '315')}`,
    },
    'four-plate-pull': {
      name: 'Peso muerto de cuatro discos',
      description: (units: Units) => `Peso muerto con ${weight(units, '180', '405')}`,
    },
    'five-plate-pull': {
      name: 'Peso muerto de cinco discos',
      description: (units: Units) => `Peso muerto con ${weight(units, '220', '495')}`,
    },
    'plate-overhead': {
      name: 'Disco sobre la cabeza',
      description: (units: Units) => `Press militar con ${weight(units, '60', '135')}`,
    },
    'total-club': {
      name: (units: Units) =>
        units === 'imperial' ? 'El club de las 1000 lb' : 'El club de los 500',
      description: (units: Units) =>
        `Tu mejor banca, sentadilla y peso muerto suman ${weight(units, '500', '1000')}`,
    },
    'bench-your-body': {
      name: 'Tu peso en la banca',
      description: 'Haz press de banca con tu propio peso corporal',
    },
    'squat-and-a-half': {
      name: 'Sentadilla y media',
      description: 'Sentadilla trasera con 1,5 veces tu peso corporal',
    },
    'double-trouble': {
      name: 'Doble problema',
      description: 'Peso muerto con el doble de tu peso corporal',
    },
    'ten-clean': {
      name: 'Diez limpias',
      description: '10 dominadas en una serie, sin ayuda',
    },
    'gym-rat': { name: 'Rata de gimnasio', description: 'Termina 5 entrenamientos en una semana' },
    'no-days-off': { name: 'Sin días libres', description: 'Entrena 7 días seguidos' },
    'on-a-roll': {
      name: 'En racha',
      description: 'Cumple los días de tu objetivo 4 semanas seguidas',
    },
    'habit-formed': {
      name: 'Hábito creado',
      description: 'Cumple los días de tu objetivo 12 semanas seguidas',
    },
    'half-year-hero': {
      name: 'Héroe de medio año',
      description: 'Cumple los días de tu objetivo 26 semanas seguidas',
    },
    'year-rounder': {
      name: 'Todo el año',
      description: 'Cumple los días de tu objetivo 52 semanas seguidas',
    },
    'comeback-kid': {
      name: 'La vuelta',
      description: 'Vuelve tras 30 días o más sin entrenar',
    },
    'early-bird': { name: 'Madrugador', description: 'Empieza a entrenar antes de las 6:00' },
    'night-owl': { name: 'Búho nocturno', description: 'Entrena entre la medianoche y las 4:00' },
    'weekend-warrior': {
      name: 'Guerrero de fin de semana',
      description: 'Entrena el sábado y el domingo del mismo fin de semana',
    },
    'new-year-same-me': { name: 'Año nuevo, yo de siempre', description: 'Entrena el 1 de enero' },
    'jingle-lifts': { name: 'Navidad de hierro', description: 'Entrena el día de Navidad' },
    'leap-lifter': { name: 'Año bisiesto', description: 'Entrena el 29 de febrero' },
    'heart-starter': { name: 'Arranque de corazón', description: 'Registra tu primer cardio' },
    'the-2k': { name: 'Los 2K', description: 'Rema 2000 m seguidos' },
    'five-k-finisher': {
      name: '5K completados',
      description: 'Corre o camina 5 km seguidos en la cinta',
    },
    marathoner: {
      name: 'Maratoniano',
      description: 'Recorre 42,2 km de cardio en total, un maratón',
    },
    'road-tripper': {
      name: 'De ruta',
      description: (units: Units) =>
        `Recorre ${units === 'imperial' ? '60 millas' : '100 km'} de cardio en total`,
    },
    everest: {
      name: 'Everest',
      description: 'Sube 8849 m en la escaladora y con la inclinación de la cinta',
    },
    furnace: { name: 'Horno', description: 'Quema 500 kcal de cardio en un entrenamiento' },
    'machine-collector': {
      name: 'Coleccionista de máquinas',
      description: 'Usa las cinco máquinas de cardio',
    },
    'hybrid-athlete': {
      name: 'Atleta híbrido',
      description: 'Haz pesas y cardio en el mismo entrenamiento',
    },
    explorer: { name: 'Explorador', description: 'Registra 25 ejercicios distintos' },
    'lit-up': {
      name: 'Encendido',
      description: 'Entrena todos los grupos musculares en una semana',
    },
    'birthday-pump': {
      name: 'Bombeo de cumpleaños',
      description: 'Entrena el día de tu cumpleaños',
    },
  },
};
