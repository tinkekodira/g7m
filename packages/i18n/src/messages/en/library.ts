/** Finding and learning lifts: the library, an exercise's page, Learn, and the plate calculator. */
export const library = {
  addExercise: 'Add an exercise',
  exercises: 'Exercises',
  superset: 'Superset',
  supersetOn: 'Pick in workout order.',
  supersetOff: 'Back to back, then rest.',
  search: 'Search',
  searchPlaceholder: 'Squat, bench, row…',
  equipment: 'Equipment',
  selected: (count: number) => ` · ${String(count)} selected`,
  equipmentHint:
    'Nothing selected shows everything. Selecting some shows only what you could do with exactly those — every piece an exercise needs has to be ticked.',
  count: (count: number) => (count === 1 ? '1 exercise' : `${String(count)} exercises`),
  bestMatches: 'Best matches first',
  mostUsed: 'Most used first · Last 90 days',
  chartKey:
    'Weight per workout · Last 6 sessions. Best working set; + added, − assistance, BW bodyweight.',
  confirm: (count: number) => `Confirm (${String(count)})`,
  cardio: 'Cardio',
  compound: 'Compound',
  isolation: 'Isolation',
  recommended: 'Recommended',
  noneOnDevice:
    'No exercises on this device yet. They arrive with the first sync — open the app once with a connection and they stay for good.',
  noMatch: 'Nothing matches all of those filters.',
  clearFilters: 'Clear filters',
  muscleFilters: 'Muscle filters',
  all: 'All',
  favourite: 'Favourite',
  favouriteMark: '(favourite)',
  kit: {
    label: 'What you are training with',
    bodyweight: 'Bodyweight',
    both: 'Everything',
    gym: 'Gym',
  },
  stepper: {
    decrease: (label: string) => `Decrease ${label}`,
    increase: (label: string) => `Increase ${label}`,
  },
  detail: {
    missing: (slug: string) =>
      `There is no exercise called ${slug} on this device. It may have been renamed, or it may not have synced yet.`,
    unknownMuscle: 'Unknown muscle',
    roles: { primary: 'Prime mover', secondary: 'Assists', stabilizer: 'Stabilises' },
    alsoCalled: (aliases: string) => `Also called ${aliases}`,
    difficulty: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
    oneSide: 'One side at a time',
    timed: 'Held for time',
    startingPoint: 'Starting point',
    seconds: ' s',
    suggestedHold: 'Suggested hold',
    suggestedReps: 'Suggested reps',
    rest: 'Rest between sets',
    restCompound: 'Longer — it is a compound',
    restIsolation: 'Shorter — it is an isolation',
    restMinutes: (minutes: number) => `${String(minutes)} min`,
    restSeconds: (seconds: number) => `${String(seconds)} s`,
    cues: 'Cues',
    muscles: 'Muscles worked',
    cardioMuscles:
      'Cardio works the heart and lungs more than any one muscle, so it is not counted on the body map — twenty minutes on a machine is not twenty sets of anything.',
    notRecorded: 'Not recorded for this exercise.',
    howTo: 'How to do it',
    mistakes: 'Common mistakes',
    equipment: 'Equipment',
    noEquipment: 'Nothing at all.',
    whatYouLog: 'What you log',
    logged: (fields: string) =>
      `${fields} Calories are estimated from those and your bodyweight, or you can type the machine’s own figure.`,
    itsTime: 'its time',
    eachBout: (fields: readonly string[]) => {
      const spoken =
        fields.length === 1
          ? fields[0]
          : `${fields.slice(0, -1).join(', ')} and ${fields.at(-1) ?? ''}`;
      return `Each bout records ${spoken ?? ''}.`;
    },
    video: 'Video',
    videoNeedsConnection: 'Needs a connection. Everything above this line does not.',
    oneRepMax: 'Your estimated one-rep max',
    on: (set: string, date: string) => `${set} on ${date}`,
    nothingRecent: (weeks: number, source: string) =>
      `Nothing in the last ${String(weeks)} weeks, so this is your best ever, from ${source}.`,
    from: (source: string) => `From ${source}.`,
    bodyweightIncluded: ' Your bodyweight is included.',
    bestEver: (estimate: string, source: string) => `Best ever: ${estimate}, from ${source}.`,
    epley:
      'Worked out with the Epley formula from your best set of 12 reps or fewer. An estimate to pick working weights from, not a number to go and test.',
    seeTrend: 'See the trend',
    playDemo: 'Play demonstration',
    pauseDemo: 'Pause demonstration',
    musclesLabel: (muscles: string) => `Muscles worked: ${muscles}. Front and back views.`,
    front: 'Front',
    back: 'Back',
  },
  learn: {
    title: 'Learn',
    modes: { explore: 'Explore', heatmap: 'What I have trained' },
    heatmapIntro: (weeks: number) => `What you have trained, over ${String(weeks)} weeks.`,
    exploreIntro: 'Tap a muscle to see what trains it.',
    plates: 'Plates',
    noMuscles:
      'No muscles on this device yet, so nothing on the model can be tapped. They arrive with the first sync — open the app once with a connection and they stay for good.',
    bodyView: 'Body view',
    hint: 'Drag to turn. Tap a muscle.',
    chooseMuscle: 'Choose a muscle',
    muscleExercises: 'Muscle exercises',
    explore: 'Explore muscles',
    exploreHint: 'Tap the body or choose a muscle to find exercises.',
    browseAll: 'Browse all exercises',
    worthAdding: 'Worth adding',
    lastWeeks: (weeks: number) => `Last ${String(weeks)} weeks`,
    worthAddingHint:
      'The groups furthest behind their weekly target, and one thing that trains each.',
    behind: (group: string, sets: number) => `${group} · ${String(sets)} sets behind`,
    working: 'Working out what you have trained…',
    heatNote:
      'Colour is volume relative to your hardest-worked muscle — what you trained most, not whether you trained enough.',
    heatEmpty: 'Nothing logged in the last four weeks yet. Finish a workout and it shows up here.',
    placeholderModel:
      'The figure is generated from origins and insertions — the licensed anatomy model is not in this build. Everything else on this screen is real.',
    sculptedModel: 'A sculpted body, divided between the muscles that reach the skin.',
    notInCatalogue: 'That muscle is not in the catalogue on this device yet.',
    clear: 'Clear',
    nothingTrains: 'Nothing in the catalogue trains this yet.',
    alsoWorked: 'Also worked',
    alsoWorkedHint: 'Worked here as a supporting muscle rather than the main one.',
  },
  plates: {
    title: 'Plate calculator',
    intro: 'What goes on each end, at the sizes you will recognise.',
    weightOnBar: 'Weight on the bar',
    ezWeighs: "This gym's EZ bar weighs",
    hidden: (count: number) =>
      `${count === 1 ? 'One plate is' : `${String(count)} plates are`} hidden because your gym doesn’t have ${count === 1 ? 'it' : 'them'}.`,
    bar: 'Bar',
    ezBar: 'EZ bar',
    tooMuch:
      'That’s more plate than this bar’s sleeve can hold. Try fewer plates, a lighter weight, or a longer bar.',
    justBar: (weight: string, unit: string) => `Just the bar — ${weight} ${unit}, nothing on it.`,
    lighter: (weight: string, unit: string) =>
      `Lighter than the bar on its own, which is ${weight} ${unit}.`,
    eachEnd: 'Each end',
    onBar: (weight: string, unit: string) => `on a ${weight} ${unit} bar`,
    closest: (total: string, short: string, unit: string) =>
      ` — the closest these plates make is ${total} ${unit}, ${short} ${unit} short`,
    colours: 'The colours',
    coloursHint: 'Which disc is which, on the bar and on the rack.',
    available: 'Available plates',
    availableHint:
      'Which plates this gym has. A deselected plate is left out of the bar, the maths and the colours above.',
  },
};
