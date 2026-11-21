/** The logger: a workout in progress, its sets and bouts, and what surrounds them. */
const plural = (count: number, noun: string): string =>
  `${String(count)} ${noun}${count === 1 ? '' : 's'}`;

export const workout = {
  notOnDevice: 'That workout is not on this device.',
  progress: 'Progress',
  editingClosed: 'Editing closed',
  editWindow: 'Workouts can be edited for 2 hours after completion.',
  details: 'Workout details',
  boutRemoved: 'Bout removed.',
  titleEdit: 'Edit workout',
  titlePast: 'Past workout',
  title: 'Workout',
  elapsed: 'elapsed',
  lifted: (weight: string) => `${weight} lifted`,
  calendar: 'Calendar',
  editingHint:
    'Save each changed set with Save or the tick. Editing closes 2 hours after completion.',
  uncounted: (sets: number) =>
    `${sets === 1 ? 'One set is' : `${String(sets)} sets are`} not counted in the total — they need a bodyweight to measure against.`,
  addExercise: '+ Add an exercise',
  doneEditing: 'Done editing',
  finish: 'Finish workout',
  confirmDiscard: 'Discard this workout and everything logged in it?',
  discard: 'Discard',
  removeTitle: (name: string | null) => `Remove ${name ?? 'this exercise'}?`,
  exercise: 'Exercise',
  removal: {
    nothing: 'Nothing is logged on it yet.',
    one: (bout: boolean) => `The ${bout ? 'bout' : 'set'} you logged on it goes with it.`,
    many: (count: number, bout: boolean) =>
      `The ${String(count)} ${bout ? 'bout' : 'set'}s you logged on it go with it.`,
  },
  removed: {
    drop: 'Drop removed.',
    set: 'Set removed.',
    setWithDrops: (drops: number) =>
      `Set removed, with ${String(drops)} ${drops === 1 ? 'drop' : 'drops'}.`,
    exercise: (name: string) => `${name} removed.`,
    exerciseWithSets: (name: string, sets: number) =>
      `${name} removed, with ${String(sets)} ${sets === 1 ? 'set' : 'sets'}.`,
  },
  superset: {
    label: 'Superset',
    heading: (count: number) => `Superset · ${String(count)} exercises`,
    ungroup: 'Ungroup',
    addRound: 'Add round',
  },
  summary: {
    label: 'Workout summary',
    elapsed: (hours: number, minutes: number, seconds: number) =>
      `${String(hours)} ${hours === 1 ? 'hour' : 'hours'} ${String(minutes)} minutes ${String(seconds)} seconds elapsed`,
    completedSets: 'Completed working sets: ',
    sets: (count: number) => `${String(count)} ${count === 1 ? 'set' : 'sets'}`,
  },
  start: {
    title: 'Train',
    nothing:
      'Nothing in progress. Start a workout and add exercises to it as you go — everything is saved on this phone the moment you tap, whether or not there is any signal.',
    button: 'Start a workout',
  },
  bodyweight: {
    title: 'What do you weigh?',
    body: 'A pull-up is you moving your own bodyweight. Without this number those sets can be logged but not measured, so they would not count toward anything.',
    label: (unit: string) => `Bodyweight (${unit})`,
  },
  unknownExercise: 'Unknown exercise',
  thatLift: 'that lift',
  elsewhere: (gym: string | null, set: string) =>
    `First time on this machine here. Last time ${gym === null ? 'elsewhere' : `at ${gym}`}: ${set}.`,
  noSets: 'No sets yet.',
  advice: (reps: number, weight: string, next: string) =>
    `${String(reps)} reps at ${weight} — try ${next} next time`,
  warmUp: 'Warm-up',
  addSet: 'Add set',
  ramp: (count: number, from: string, to: string) =>
    `Adds ${String(count)} ${count === 1 ? 'set' : 'sets'} from ${from} up to ${to}`,
  effort: {
    question: 'On that last set — how many more could you have done?',
    none: 'None',
  },
  set: {
    deleteRow: (title: string) => `Delete ${title.toLowerCase()}`,
    dropAfter: (title: string) => `Drop after ${title.toLowerCase()}`,
    drop: 'Drop',
    last: (set: string) => `Last: ${set}`,
    load: (title: string) => `${title} load`,
    bodyweight: 'Bodyweight',
    addedWeight: 'Added weight',
    durationFormat: (title: string) => `${title} duration format`,
    seconds: 'Seconds',
    minSec: 'Min + sec',
    minutes: 'Minutes',
    reps: 'Reps',
    saveRow: (title: string) => `Save ${title.toLowerCase()}`,
    markSkipped: 'Mark as skipped',
  },
  /** The names a set row is read out by: "Set 2", "Warm-up 1", "Drop 2". */
  rows: {
    warmup: (number: number) => `Warm-up ${String(number)}`,
    set: (number: number) => `Set ${String(number)}`,
    drop: 'Drop',
    dropNumbered: (number: number) => `Drop ${String(number)}`,
    tickWarmup: (done: boolean, number: number) =>
      `${done ? 'Undo' : 'Complete'} warm-up ${String(number)}`,
    tickDrop: (done: boolean, number: number, parent: number) =>
      `${done ? 'Undo' : 'Complete'} drop ${String(number)} of set ${String(parent)}`,
    tickSet: (done: boolean, number: number) =>
      `${done ? 'Undo' : 'Complete'} set ${String(number)}`,
  },
  stillTraining: {
    title: 'Still training?',
    idle: (minutes: number) =>
      `Nothing ticked for ${String(minutes)} ${minutes === 1 ? 'minute' : 'minutes'}.`,
    keepGoing: 'Keep going',
    finish: 'Finish',
  },
  rest: {
    over: 'Rest over',
    resting: 'Resting',
    less: (label: string) => `${label} less rest`,
    more: (label: string) => `${label} more rest`,
    dismiss: 'Dismiss',
  },
  record: {
    badge: 'PR',
    heaviestShort: 'Heaviest yet',
    heaviest: (name: string) => `Heaviest ${name.toLocaleLowerCase()} yet`,
    heaviestDetail: (now: string, gain: string, unit: string) =>
      `${now} ${unit} — ${gain} ${unit} over your old best.`,
    bestShort: 'Best set yet',
    best: (name: string) => `Best ${name.toLocaleLowerCase()} set yet`,
    bestDetail: (now: string, before: string, unit: string, beforeUnit: string) =>
      `Estimated max ${now} ${unit}, up from ${before} ${beforeUnit}.`,
  },
  open: {
    past: 'Finish logging your past workout',
    stale: 'You left a workout open',
    continue: 'Continue your workout',
    exercises: (count: number) => plural(count, 'exercise'),
    setsDone: (count: number) => `${plural(count, 'set')} done`,
    justStarted: 'just started',
    openFor: (hours: number) => `open for ${plural(hours, 'hour')}`,
    minutesIn: (minutes: number) => `${String(minutes)} min in`,
    hoursIn: (hours: number, minutes: number) => `${String(hours)} h ${String(minutes)} min in`,
  },
  autoFinish: {
    title: 'We finished your workout',
    closed: (when: string) =>
      `Nothing was ticked for a while, so your workout from ${when} was closed for you.`,
    closedAt: (when: string, at: string) =>
      `Nothing was ticked for a while, so your workout from ${when} was closed at your last set, ${at}.`,
    allSaved: 'Everything you logged is saved.',
    saved: (parts: string) => `Saved: ${parts}.`,
    exercises: (count: number) => plural(count, 'exercise'),
    sets: (count: number) => plural(count, 'set'),
    bouts: (count: number) => plural(count, 'bout'),
    minutes: (minutes: number) => `${String(minutes)} min`,
    okay: 'Okay',
    see: 'See it',
  },
  cardio: {
    label: 'Cardio',
    needsBodyweight:
      'Calories need your bodyweight. Add it in Your profile and they will be worked out.',
    noBouts: 'No bouts yet. Add one when you get on.',
    addBout: 'Add bout',
    timeFormat: 'Time is minutes, or minutes:seconds like 25:30.',
    notANumber: (field: string) => `${field} is not a number.`,
    bout: (number: number) => `Bout ${String(number)}`,
    boutLabel: (number: number) => `bout ${String(number)}`,
    time: 'Time',
    start: 'Start',
    stop: 'Stop',
    calories: 'Calories',
    fromMachine: 'From the machine. Clear it to use the estimate.',
    addTime: 'Add the time to estimate them, or type what the machine says.',
    estimate: (calories: string, source: string) =>
      `${calories}. ${source} Type the machine’s figure to use it instead.`,
    undo: (label: string) => `Undo ${label}`,
    complete: (label: string) => `Complete ${label}`,
    saveWithoutTicking: 'Save without ticking',
    fields: {
      distance: (unit: string) => `Distance (${unit})`,
      speed: (unit: string) => `Speed (${unit})`,
      incline: 'Incline (%)',
      level: 'Level',
      watts: 'Avg watts',
      floors: 'Floors',
    },
    sources: {
      machine: 'From the machine.',
      treadmill: 'Estimated from the speed and incline.',
      power: 'Estimated from the watts.',
      pace: 'Estimated from your pace.',
      stairs: 'Estimated from the floors climbed.',
      met: (better: string) => `A rough estimate from the time alone. ${better}`,
    },
    better: {
      treadmill: 'Add the speed for a better one.',
      bike: 'Add the watts for a better one.',
      rower: 'Add the distance or watts for a better one.',
      ski_erg: 'Add the distance or watts for a better one.',
      stair_climber: 'Add the floors for a better one.',
    },
    floors: (count: number) => `${String(count)} floors`,
    nothing: 'Nothing recorded',
  },
  gym: {
    change: (name: string | null) => `${name ?? 'No gym chosen'}, change gym`,
    choose: 'Choose a gym',
    where: 'Where are you training?',
    which: 'Which gym',
    compared:
      'Machines and cables are compared with their own history at each gym. Sets you haven’t done yet switch to the new gym’s numbers.',
    manage: 'Manage gyms',
  },
  startDialog: {
    title: 'Start a workout',
    routines: 'Your routines',
    chooseRoutine: 'Choose a routine',
    loading: 'Loading routines…',
    none: 'No routines yet. Finish a workout and save it as a routine to use it here next time.',
    settingUp: 'Setting it up…',
    blank: 'Start a blank workout',
    dontShow: 'Do not show this again',
    dontShowHint: 'Always start blank workouts. Change this in Settings.',
    saved: 'Saved routines',
    page: (index: number, total: number) => `Routine page ${String(index)} of ${String(total)}`,
    start: (name: string) => `Start ${name}`,
    choosePage: 'Choose routine page',
    showPage: (index: number, total: number) =>
      `Show routine page ${String(index)} of ${String(total)}`,
  },
  plates: {
    loaded: (plates: string) => `A bar loaded with ${plates} on each end`,
    empty: (bar: string, unit: string) => `An empty ${bar} ${unit} bar`,
    bar: (weight: string, unit: string) => `${weight} ${unit} bar`,
    lighter: (bar: string) => `Lighter than a ${bar}`,
    just: (bar: string) => `Just the ${bar}`,
    eachSide: 'Each side',
  },
  previousSet: {
    seconds: (reps: number) => `${String(reps)} s`,
    reps: (reps: number) => `${String(reps)} ${reps === 1 ? 'rep' : 'reps'}`,
  },
};
