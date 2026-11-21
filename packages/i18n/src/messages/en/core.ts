/** The words `@g7m/core` hands out: labels, titles and descriptions. */
export const core = {
  regions: {
    legs: 'Legs',
    arms: 'Arms',
    shoulders: 'Shoulders',
    back: 'Back',
    chest: 'Chest',
    core: 'Core',
  },
  focus: {
    full_body: 'Full body',
    upper: 'Upper body',
    lower: 'Lower body',
    push: 'Push',
    pull: 'Pull',
    legs: 'Legs',
  },
  activity: {
    sedentary: 'Sedentary',
    light: 'Lightly active',
    moderate: 'Moderately active',
    active: 'Active',
    very_active: 'Very active',
  },
  activityDescriptions: {
    sedentary: 'Desk job, driving, little walking',
    light: 'On your feet for part of the day',
    moderate: 'Walking or standing most of the day',
    active: 'Physical job, or a lot of walking',
    very_active: 'Heavy manual work, or a second sport',
  },
  sex: { male: 'Male', female: 'Female' },
  goals: {
    chooseOne: 'Choose at least one training goal.',
    labels: {
      lose_fat: 'Lose fat',
      build_muscle: 'Build muscle',
      recomp: 'Both at once',
      get_stronger: 'Get stronger',
    },
    summaries: {
      lose_fat: 'Weight down, strength kept.',
      build_muscle: 'More size, in the reps that build it.',
      recomp: 'Both at once, slower than either alone.',
      get_stronger: 'Heavier bar, fewer reps.',
    },
    descriptions: {
      lose_fat:
        'Keep the strength you have while the weight comes down. The loads stay heavy and the total work comes down a little.',
      build_muscle:
        'More sets per muscle and more moderate reps, with enough recovery between sessions to actually use them.',
      recomp:
        'Muscle up and fat down together. Slower than doing either on its own, and it works best if you are new to lifting or coming back after a break.',
      get_stronger:
        'Heavier loads, fewer reps, longer rests. Fewer sets that count, and each one matters more.',
    },
    expectations: {
      lose_fat:
        'Expect 0.5–1% of your bodyweight a week. Much faster than that and strength usually goes with it.',
      build_muscle:
        'Expect 0.1–0.3 kg a week for men, around half that for women. Faster is mostly fat.',
      recomp:
        'Expect the scale to barely move. The progress shows up in the log weeks before it shows up on the scale.',
      get_stronger:
        'Expect the numbers on the bar to move first. Bodyweight can go either way and neither is a problem.',
    },
    muscleGainBySex: {
      male: 'Expect 0.1–0.3 kg a week. Faster than that is mostly fat.',
      female:
        'Expect 0.05–0.15 kg a week. Muscle is gained at about half the absolute rate, which is biology rather than effort.',
    },
    comingDown: (size: string) =>
      `Your weight has been coming down about ${size} kg a week. If that is on purpose, this is the goal that matches it.`,
    goingUp: (size: string) =>
      `Your weight has been going up about ${size} kg a week. If that is on purpose, this is the goal that matches it.`,
    beginner:
      'In your first year of lifting, muscle up and fat down at the same time is genuinely possible. It stops being the easy option later.',
  },
  /** What the weight field means, per kind of load. Bodyweight has no field. */
  weightField: {
    external: 'Weight',
    bodyweight_plus: 'Added',
    assisted: 'Assistance',
  },
  bars: {
    bar_20: '20 kg barbell',
    bar_15: '15 kg barbell',
    bar_ez: 'EZ curl bar',
  },
  when: {
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: (days: number) => `${String(days)} days ago`,
    lastWeek: 'Last week',
  },
  /**
   * Names for a workout nobody named: the kind of day its sets add up to,
   * and what it leaned on. The `focus` keys are the app's own, not words.
   */
  workoutTitle: {
    cardio: 'Cardio',
    workout: 'Workout',
    core: (focus: string) => `Core day ${focus}`,
    leg: (focus: string) => `Leg day ${focus}`,
    arm: (focus: string) => `Arm day ${focus}`,
    push: (focus: string) => `Push day ${focus}`,
    pull: (focus: string) => `Pull day ${focus}`,
    upper: (focus: string) => `Upper body ${focus}`,
    full: (focus: string) => `Full body ${focus}`,
    focused: (what: string) => `(${what} focused)`,
    allRound: '(all-round)',
    focus: {
      lat: 'lat',
      'upper back': 'upper back',
      'lower back': 'lower back',
      'rear delt': 'rear delt',
      ab: 'ab',
      oblique: 'oblique',
      chest: 'chest',
      shoulder: 'shoulder',
      triceps: 'triceps',
      biceps: 'biceps',
      forearm: 'forearm',
      trap: 'trap',
      back: 'back',
      quad: 'quad',
      hamstring: 'hamstring',
      glute: 'glute',
      calf: 'calf',
      adductor: 'adductor',
      core: 'core',
      push: 'push',
      pull: 'pull',
      leg: 'leg',
      'upper body': 'upper body',
    } as Record<string, string>,
  },
  friends: {
    dot: (day: string, trained: boolean) => `${day}: ${trained ? 'trained' : 'no workout'}`,
    notSeen: 'Not seen yet',
    online: 'Online now',
    minutesAgo: (minutes: number) => `Last seen ${String(minutes)} min ago`,
    hoursAgo: (hours: number) => `Last seen ${String(hours)}h ago`,
    yesterday: 'Last seen yesterday',
    daysAgo: (days: number) => `Last seen ${String(days)} days ago`,
    on: (date: string) => `Last seen ${date}`,
    /** "Tue 3 Mar". */
    shortDate: (weekday: string, day: number, month: string) =>
      `${weekday} ${String(day)} ${month}`,
    /**
     * Shorter names a friend card's column has room for, by exercise slug.
     * A language with none shows the catalogue's own name, which wraps.
     */
    shortLiftNames: {
      'barbell-back-squat': 'Squat',
      'barbell-bench-press': 'Bench',
      'conventional-deadlift': 'Deadlift',
      'romanian-deadlift': 'RDL',
      'overhead-press': 'OHP',
      'barbell-hip-thrust': 'Hip Thrust',
      'trap-bar-deadlift': 'Trap Bar DL',
      'incline-barbell-press': 'Incline Bench',
      'close-grip-bench-press': 'CG Bench',
      'dumbbell-bench-press': 'DB Bench',
      'incline-dumbbell-press': 'Incline DB Press',
      'dumbbell-shoulder-press': 'Shoulder Press',
      'machine-chest-press': 'Chest Press',
      'incline-machine-chest-press': 'Incline Machine Press',
      'bulgarian-split-squat': 'Split Squat',
      'single-arm-dumbbell-row': 'DB Row',
      'chest-supported-dumbbell-row': 'Supported DB Row',
      'seated-cable-row': 'Cable Row',
      'seated-row-machine': 'Machine Row',
      'standing-calf-raise': 'Calf Raise',
      'seated-calf-raise': 'Seated Calf',
      'barbell-shrug': 'Shrug',
      'preacher-curl': 'Preacher Curl',
      'barbell-preacher-curl': 'Preacher Curl',
      'dumbbell-preacher-curl': 'Preacher Curl',
      'preacher-curl-machine': 'Preacher Curl',
      'kettlebell-swing': 'KB Swing',
      'kettlebell-deadlift': 'KB Deadlift',
      'kettlebell-press': 'KB Press',
      'kettlebell-clean': 'KB Clean',
      'kettlebell-snatch': 'KB Snatch',
    } as Record<string, string>,
  },
  review: { thatLift: 'that lift' },
};
