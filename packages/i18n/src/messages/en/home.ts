/** Home: the greeting, this month's cards, the ways in, and today's workout. */
type Region = 'legs' | 'arms' | 'shoulders' | 'back' | 'chest' | 'core';

const plural = (count: number, one: string, many = `${one}s`): string =>
  `${String(count)} ${count === 1 ? one : many}`;

const REGION: Record<Region, string> = {
  legs: 'Legs',
  arms: 'Arms',
  shoulders: 'Shoulders',
  back: 'Back',
  chest: 'Chest',
  core: 'Core',
};

export const home = {
  yourProfile: 'Your profile',
  thisMonth: 'This month',
  quickAccess: 'Quick access',
  stillOpen: 'Still open',
  inProgress: 'In progress',
  openIt: 'Open it',
  today: {
    label: 'Today’s workout',
    noGoalTitle: 'Get a plan built for you',
    noGoalBody:
      'Pick a goal and how many days you train. It takes about ten seconds, and every session after that is built from what you log.',
    chooseGoal: 'Choose a goal',
    working: 'Working out today’s session…',
    minutes: (minutes: number) => `${String(minutes)} min`,
    sets: (sets: number) => `${String(sets)} ${sets === 1 ? 'set' : 'sets'}`,
    doneTitle: 'Done for today',
    trainedToday: (parts: string) => `Trained today · ${parts}`,
    doneBody:
      'Rest is where today’s work turns into progress. Tomorrow’s session is built from it.',
    settingUp: 'Setting it up…',
    trainAgain: 'Train again',
    weekTitle: 'You have done the week',
    weekBody:
      'Everything today’s session would train has had its sets in the last seven days. Another session now costs more recovery than it buys.',
    trainAnyway: 'Train anyway',
    summary: (exercises: number, sets: number) =>
      `${String(exercises)} exercises · ${String(sets)} sets`,
    about: (minutes: number) => ` · about ${String(minutes)} min`,
    muscleGroups: 'Muscle groups',
    start: 'Start workout',
    seePlan: 'See the plan',
  },
  tiles: {
    plan: 'Today’s plan',
    planDetail: 'What the app suggests',
    continue: 'Continue your workout',
    start: 'Start a workout',
    continueDetail: 'Back to your session',
    startDetail: 'Choose a routine or start blank',
    calendar: 'Calendar',
    calendarDetail: 'The days you trained',
    browse: 'Browse exercises',
    browseDetail: 'The whole library',
    progress: 'Progress',
    progressDetail: 'How your training is going',
  },
  sync: {
    lost: 'Some changes did not reach the server',
    stopped: 'Sync has stopped',
    lostDetail: 'They are on this phone but will not sync.',
    stoppedDetail: 'Everything is still saved on this phone.',
    see: 'See what happened',
  },
  cards: {
    records: 'Personal records',
    workouts: 'Workouts',
    muscles: 'Muscle groups',
    activity: 'Strength and activity',
    slide: (name: string, position: number, total: number) =>
      `${name}, ${String(position)} of ${String(total)}`,
    workoutsLabel: (total: number, heading: string, detail: string) =>
      `Workouts this month: ${String(total)} completed. ${heading}. ${detail}`,
    yourWorkouts: 'Your workouts',
    completed: 'completed',
    workoutsSummary: (total: number, current: string, previous: number, previousName: string) =>
      `${String(total)} workouts in ${current} so far, against ${String(previous)} by this day in ${previousName}.`,
    musclesLabel: (sets: number, groups: number, heading: string, detail: string) =>
      `Muscle groups this month: ${String(sets)} ${sets === 1 ? 'set' : 'sets'} across ${String(groups)} ${groups === 1 ? 'group' : 'groups'}. ${heading}. ${detail}`,
    groups: (count: number): string => (count === 1 ? 'group' : 'groups'),
    setsWord: (count: number): string => (count === 1 ? 'set' : 'sets'),
    noSets: 'No sets this month yet.',
    activityLabel: (
      workouts: number,
      time: string,
      perWeek: string,
      lifted: string,
      range: string,
      heading: string,
      detail: string,
    ) =>
      `Strength and activity this month: ${String(workouts)} ${workouts === 1 ? 'workout' : 'workouts'}, ${time} training, ${perWeek} a week, ${lifted} lifted. Compared with ${range}. ${heading}. ${detail}`,
    strengthActivity: 'Strength & activity',
    firstMonth: 'First month',
    comparedWith: 'Compared with',
    range: (month: string, through: number) => `${month} 1–${String(through)}`,
    statWorkouts: 'Workouts',
    trainingTime: 'Training time',
    perWeek: 'Per week',
    volumeLifted: 'Volume lifted',
    recordsLabel: (count: number, heading: string, detail: string) =>
      `Personal records this month: ${String(count)} new ${count === 1 ? 'best' : 'bests'}. ${heading}. ${detail}`,
    newBests: (count: number): string => (count === 1 ? 'new best' : 'new bests'),
    exercise: 'Exercise',
    firstTime: 'First time',
    onYourBest: (weight: string) => `${weight} on your best`,
    best: (weight: string) => `Best ${weight}`,
    sameAsLast: 'Same as last month',
    noneLast: 'None last month',
    up: 'up',
    down: 'down',
    yourMonth: 'Your month',
    today: 'Today',
    monthStart: (month: string) => `${month} 1`,
    firstTitle: 'Your first workout starts the chart',
    firstBody:
      'Log one and this fills in: how often you train, which muscles you work and how much you lift, month by month.',
    logWorkout: 'Log a workout',
  },
  insights: {
    workouts: {
      start: {
        heading: 'Your month starts with one workout',
        detail: 'Log a session and this line starts to climb.',
      },
      notYet: {
        heading: 'Nothing logged yet this month',
        detail: (previous: number) =>
          `Last month you did ${plural(previous, 'workout')}. Today is a good day to start.`,
      },
      firstMonth: {
        heading: 'Your first month is under way',
        detail: (workouts: number) =>
          `${plural(workouts, 'workout')} so far. Next month has this one to beat.`,
      },
      ahead: {
        heading: 'You’re on a roll',
        detail: (by: number) =>
          `${plural(by, 'more workout', 'more workouts')} than at this point last month.`,
      },
      level: {
        heading: 'Level with last month',
        detail: (workouts: number) =>
          `${plural(workouts, 'workout')}, the same as by this day last month.`,
      },
      behind: {
        heading: 'A little behind last month',
        detail: (by: number) => `${plural(by, 'workout')} short of where you were by this day.`,
      },
    },
    muscles: {
      none: {
        heading: 'No sets logged this month yet',
        detail: 'Every set you log shows up here, by muscle group.',
      },
      early: {
        heading: 'The picture is filling in',
        detail: (sets: number) =>
          `${plural(sets, 'set')} so far. A few more workouts and the balance shows.`,
      },
      neglected: {
        /** "Legs: nothing in 30 days", when the gap is at least that long. */
        atLeast: (region: Region, days: number) =>
          `${REGION[region]}: nothing in ${String(days)} days`,
        /** "Legs haven’t been trained", "Back hasn’t". */
        exactly: (region: Region, days: number) =>
          `${REGION[region]} ${REGION[region].endsWith('s') ? 'haven’t' : 'hasn’t'} been trained in ${String(days)} days`,
        detail: 'Worth a place in your next workout.',
      },
      lopsided: {
        heading: (region: Region, percent: number) =>
          `${REGION[region]} took ${String(percent)}% of your sets`,
        detail: 'Spreading the work keeps the rest from falling behind.',
      },
      balanced: {
        heading: 'Well balanced',
        detail: 'You’re training every major muscle group this month.',
      },
      focused: {
        heading: (regions: readonly Region[]) =>
          `Mostly ${regions.map((region) => REGION[region].toLowerCase()).join(' and ')} so far`,
        detail: 'The rest get their turn as the month goes on.',
      },
    },
    activity: {
      quiet: {
        heading: 'Your month is waiting',
        detail: 'Time, volume and pace show up after your first workout.',
      },
      stronger: {
        heading: 'You’re lifting more',
        detail: (percent: number) =>
          `${String(percent)}% more weight moved than at this point last month.`,
      },
      consistent: {
        heading: 'Great consistency',
        detail: (perWeek: string) => `About ${perWeek} a week. You’re showing up, and it shows.`,
      },
      catchUp: {
        heading: (by: number) =>
          by === 1 ? 'One workout closes the gap' : `${String(by)} workouts to catch up`,
        detail: 'Behind last month’s pace by this day, with time to make it up.',
      },
      steady: {
        heading: 'A steady month',
        detail: 'Keep it going and the trend will show here.',
      },
    },
    records: {
      oneLift: 'One lift',
      none: {
        heading: 'No lifts logged this month yet',
        detail: 'Your heaviest sets this month show up here, against your best.',
      },
      new: {
        heading: (count: number) =>
          count === 1 ? 'A new personal best' : `${String(count)} new personal bests`,
        detail: (name: string) => `${name} is heavier than ever. You’re getting stronger.`,
      },
      first: {
        heading: 'Your first bests are set',
        detail: (count: number) =>
          `${String(count)} ${count === 1 ? 'lift' : 'lifts'} to beat from here. Go heavier and they show up as new records.`,
      },
      close: {
        heading: (weight: string) => `${weight} off your best`,
        detail: (name: string) => `${name} is nearly there. One good day puts it on the board.`,
      },
      holding: {
        heading: 'Your bests still stand',
        detail: 'A heavier set on any lift this month shows up here.',
      },
    },
  },
};
