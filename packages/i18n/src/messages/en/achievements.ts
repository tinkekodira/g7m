/**
 * Every badge's name and what earns it, by badge key.
 *
 * A function where the words depend on the lifter's units: a plate is 20 kg
 * in one and 45 lb in the other, and the badge says the number they load.
 */
type Units = 'metric' | 'imperial';
type Words = string | ((units: Units) => string);

const weight = (units: Units, kg: string, lb: string): string =>
  units === 'imperial' ? `${lb} lb` : `${kg} kg`;

const tonnage = (units: Units, tonnes: string, comparison: string): string =>
  `Lift ${tonnes} ${units === 'imperial' ? 'tons' : 'tonnes'} in total, ${comparison}`;

export const achievements = {
  badges: {
    'day-one': { name: 'Day One', description: 'Finish your first workout' },
    'double-digits': { name: 'Double Digits', description: 'Finish 10 workouts' },
    'quarter-century': { name: 'Quarter Century', description: 'Finish 25 workouts' },
    'fifty-strong': { name: 'Fifty Strong', description: 'Finish 50 workouts' },
    centurion: { name: 'Centurion', description: 'Finish 100 workouts' },
    'iron-veteran': { name: 'Iron Veteran', description: 'Finish 250 workouts' },
    lifer: { name: 'Lifer', description: 'Finish 500 workouts' },
    'record-breaker': { name: 'Record Breaker', description: 'Set your first personal record' },
    'pr-machine': { name: 'PR Machine', description: 'Set 25 personal records' },
    'heavy-mover': {
      name: 'Heavy Mover',
      description: (units: Units) => tonnage(units, '10', 'about two elephants'),
    },
    'whale-of-a-time': {
      name: 'Whale of a Time',
      description: (units: Units) => tonnage(units, '100', 'about a blue whale'),
    },
    'mountain-mover': {
      name: 'Mountain Mover',
      description: (units: Units) => tonnage(units, '1,000', 'more than two jumbo jets'),
    },
    'plate-club': {
      name: 'Plate Club',
      description: (units: Units) => `Bench press ${weight(units, '60', '135')}`,
    },
    'two-plate-bench': {
      name: 'Two-Plate Bench',
      description: (units: Units) => `Bench press ${weight(units, '100', '225')}`,
    },
    'three-plate-bench': {
      name: 'Three-Plate Bench',
      description: (units: Units) => `Bench press ${weight(units, '140', '315')}`,
    },
    'two-plate-squat': {
      name: 'Two-Plate Squat',
      description: (units: Units) => `Back squat ${weight(units, '100', '225')}`,
    },
    'three-plate-squat': {
      name: 'Three-Plate Squat',
      description: (units: Units) => `Back squat ${weight(units, '140', '315')}`,
    },
    'four-plate-squat': {
      name: 'Four-Plate Squat',
      description: (units: Units) => `Back squat ${weight(units, '180', '405')}`,
    },
    'three-plate-pull': {
      name: 'Three-Plate Pull',
      description: (units: Units) => `Deadlift ${weight(units, '140', '315')}`,
    },
    'four-plate-pull': {
      name: 'Four-Plate Pull',
      description: (units: Units) => `Deadlift ${weight(units, '180', '405')}`,
    },
    'five-plate-pull': {
      name: 'Five-Plate Pull',
      description: (units: Units) => `Deadlift ${weight(units, '220', '495')}`,
    },
    'plate-overhead': {
      name: 'Plate Overhead',
      description: (units: Units) => `Overhead press ${weight(units, '60', '135')}`,
    },
    'total-club': {
      name: (units: Units) => (units === 'imperial' ? 'The 1,000 lb Club' : 'The 500 Club'),
      description: (units: Units) =>
        `Best bench, squat and deadlift add up to ${weight(units, '500', '1,000')}`,
    },
    'bench-your-body': { name: 'Bench Your Body', description: 'Bench press your own bodyweight' },
    'squat-and-a-half': {
      name: 'Squat and a Half',
      description: 'Back squat 1.5× your bodyweight',
    },
    'double-trouble': { name: 'Double Trouble', description: 'Deadlift twice your bodyweight' },
    'ten-clean': {
      name: 'Ten Clean',
      description: '10 pull-ups or chin-ups in one set, unassisted',
    },
    'gym-rat': { name: 'Gym Rat', description: 'Finish 5 workouts in one week' },
    'no-days-off': { name: 'No Days Off', description: 'Train 7 days in a row' },
    'on-a-roll': { name: 'On a Roll', description: 'Hit your goal’s days for 4 weeks in a row' },
    'habit-formed': {
      name: 'Habit Formed',
      description: 'Hit your goal’s days for 12 weeks in a row',
    },
    'half-year-hero': {
      name: 'Half-Year Hero',
      description: 'Hit your goal’s days for 26 weeks in a row',
    },
    'year-rounder': {
      name: 'Year-Rounder',
      description: 'Hit your goal’s days for 52 weeks in a row',
    },
    'comeback-kid': { name: 'Comeback Kid', description: 'Come back after 30 days or more away' },
    'early-bird': { name: 'Early Bird', description: 'Start training before 6 am' },
    'night-owl': { name: 'Night Owl', description: 'Train between midnight and 4 am' },
    'weekend-warrior': {
      name: 'Weekend Warrior',
      description: 'Train on the Saturday and the Sunday of one weekend',
    },
    'new-year-same-me': { name: 'New Year, Same Me', description: 'Train on 1 January' },
    'jingle-lifts': { name: 'Jingle Lifts', description: 'Train on Christmas Day' },
    'leap-lifter': { name: 'Leap Lifter', description: 'Train on 29 February' },
    'heart-starter': { name: 'Heart Starter', description: 'Log your first cardio' },
    'the-2k': { name: 'The 2K', description: 'Row 2,000 m in one go' },
    'five-k-finisher': {
      name: '5K Finisher',
      description: 'Run or walk 5 km on the treadmill in one go',
    },
    marathoner: {
      name: 'Marathoner',
      description: 'Cover 42.2 km of cardio in total, a marathon',
    },
    'road-tripper': {
      name: 'Road Tripper',
      description: (units: Units) =>
        `Cover ${units === 'imperial' ? '60 miles' : '100 km'} of cardio in total`,
    },
    everest: {
      name: 'Everest',
      description: 'Climb 8,849 m on the stairs and the treadmill’s incline',
    },
    furnace: { name: 'Furnace', description: 'Burn 500 kcal of cardio in one workout' },
    'machine-collector': {
      name: 'Machine Collector',
      description: 'Use all five cardio machines',
    },
    'hybrid-athlete': {
      name: 'Hybrid Athlete',
      description: 'Lift and do cardio in the same workout',
    },
    explorer: { name: 'Explorer', description: 'Log 25 different exercises' },
    'lit-up': { name: 'Lit Up', description: 'Train every muscle group in one week' },
    'birthday-pump': { name: 'Birthday Pump', description: 'Train on your birthday' },
  } as Record<string, { readonly name: Words; readonly description: Words }>,
};
