/** Friends: the list, requests, a friend's page, the leaderboard and challenges. */
export const friends = {
  title: 'Friends',
  nameless: 'Your friend',
  you: 'You',
  unknownExercise: 'Unknown exercise',
  didNotGoThrough: 'That did not go through.',
  didNotSave: 'That did not save. Try again.',
  couldNotLoad: 'Could not load it.',
  addFriend: 'Add a friend',
  profileUnavailable: 'Your profile is unavailable. Open your profile and try again.',
  resultDismissed: 'This result has already been dismissed.',
  challengeHint: 'Challenge a friend to a week: open their page and pick a stat.',
  tabs: {
    friends: 'Friends',
    leaderboard: 'Leaderboard',
    requests: 'Requests',
    waiting: ' waiting',
  },
  empty: {
    eyebrow: 'Friends',
    title: 'Train with friends',
    body: 'Share your code with someone you train with. Once they add you, you’ll see each other’s week, best lifts and workouts here.',
  },
  card: {
    levelShort: (level: number) => `Lv ${String(level)}`,
    level: (level: number) => `Level ${String(level)}`,
    workingOut: 'Working out',
    notSharing: 'Not sharing their training',
    lastWorkout: 'Last workout',
    bestLifts: 'Best lifts',
    noLifts: 'No lifts logged yet',
    thisWeek: 'This week',
    today: ' (today)',
    streak: 'Streak: ',
    notLogged: (label: string, who: string) => `${label}: ${who} has not logged it`,
    youNotLogged: (label: string, who: string, theirs: string) =>
      `${label}: ${who} ${theirs}; you have not logged it`,
    levelWithYou: (label: string, who: string, theirs: string) =>
      `${label}: ${who} ${theirs}, level with you`,
    youAhead: (label: string, who: string, theirs: string, gap: string) =>
      `${label}: ${who} ${theirs}, you are ${gap} ahead`,
    youBehind: (label: string, who: string, theirs: string, gap: string) =>
      `${label}: ${who} ${theirs}, you are ${gap} behind`,
  },
  status: {
    label: 'Share my workout status',
    description: 'Let friends see when you’re working out.',
  },
  when: {
    justNow: 'Just now',
    minutesAgo: (minutes: number) => `${String(minutes)} min ago`,
    hoursAgo: (hours: number) => `${String(hours)}h ago`,
  },
  requests: {
    none: 'No requests waiting. When someone adds you with your code, or challenges you, it shows up here for you to accept.',
    accept: 'Accept',
    decline: 'Decline',
    acceptLabel: (name: string) => `Accept ${name}`,
    declineLabel: (name: string) => `Decline ${name}`,
  },
  code: {
    yours: 'Your code',
    yoursLabel: (spelled: string) => `Your code: ${spelled}`,
    copy: 'Copy',
    share: 'Share',
    copied: 'Copied.',
    copiedToPaste: 'Copied, ready to paste.',
    couldNotCopy: (code: string) => `Could not copy. Your code is ${code}.`,
    couldNotShare: (code: string) => `Could not share. Your code is ${code}.`,
    shareTitle: 'g7m friend code',
    shareText: (code: string) => `Add me on g7m: my friend code is ${code}`,
    theirs: 'Their code',
    sending: 'Sending…',
    send: 'Send request',
    typeFirst: 'Type your friend’s code first.',
    shape: 'A friend code is six letters and numbers.',
    characters: 'Friend codes never use 0, O, 1, I or L. Check the code and try again.',
    sent: 'Request sent.',
    sentTo: (who: string) => `Request sent to ${who}.`,
    nowFriends: (who: string | null) =>
      who === null
        ? 'They had already asked you, so you’re now friends.'
        : `${who} had already asked you, so you’re now friends.`,
    ownCode: 'That’s your own code.',
    unknown: 'No one has that code. Check it and try again.',
    alreadyFriends: (who: string | null) => `You’re already friends with ${who ?? 'them'}.`,
    alreadyRequested: (who: string | null) => `You’ve already sent ${who ?? 'them'} a request.`,
    tooMany: 'That’s a lot of requests in an hour. Try again later.',
  },
  reference: {
    seconds: (who: string, reps: string) => `${who}: ${reps} s`,
    reps: (who: string, reps: string) => `${who}: ${reps} reps`,
    assisted: (who: string, reps: string, weight: string) => `${who}: ${reps} × ${weight} assisted`,
  },
  offline: {
    title: 'You’re offline',
    body: 'Friends need a connection. Your own training is all still here, and this will fill in when you’re back online.',
  },
  name: {
    missingProfile: 'Your profile hasn’t reached this phone yet. Give it a moment and try again.',
    title: 'What should friends call you?',
    body: 'Friends see your name next to your training. You can change it later on Your profile.',
    label: 'Your name',
  },
  page: {
    notSharing: 'Not sharing their training right now, or no longer on your friends list.',
    headToHead: 'Head-to-head',
    nothingToCompare:
      'Nothing to compare yet. Once you’ve both logged the same lift, it shows up here.',
    exercise: 'Exercise',
    youAhead: (gap: string) => `You’re ${gap} ahead`,
    theyAhead: (who: string, gap: string) => `${who} is ${gap} ahead`,
    level: 'Level',
    recent: 'Recent workouts',
    noRecent: 'No finished workouts yet.',
    achievementsPending: (name: string) => `Shows up once ${name} next opens the app`,
    noneEarned: 'None earned yet',
    earnedOf: (earned: number, total: number) => `${String(earned)} of ${String(total)} earned`,
    training: (name: string) => `${name}’s training`,
    lastWeeks: (weeks: number) => `The last ${String(weeks)} weeks, on their body.`,
    nothingLogged: (weeks: number) => `Nothing logged in the last ${String(weeks)} weeks.`,
    bestsDescription: (name: string) =>
      `The heaviest ${name} has moved on each exercise. Bodyweight exercises are left out: their bodyweight stays private.`,
    routines: 'Routines',
    noRoutines: 'No routines saved yet.',
    showFewer: 'Show fewer',
    showAll: (count: number) => `Show all ${String(count)}`,
    confirmRemove: (name: string) => `Remove ${name} from your friends? They won’t be told.`,
    moreOptions: 'More options',
    remove: 'Remove friend',
    exercises: (count: number) => (count === 1 ? '1 exercise' : `${String(count)} exercises`),
  },
  session: {
    gone: 'This workout isn’t shared with you any more.',
    label: (friend: string) => `${friend}’s workout, open ${friend}’s profile`,
    whose: (friend: string) => `${friend}’s workout`,
    fromDevice: 'Saved on this phone from when you last opened it.',
    settingUp: 'Setting it up…',
    doIt: 'Do this workout',
    finishFirst: 'Finish the workout you have open before starting this one.',
    openIt: 'Open it',
    explain:
      'Their exercises and sets, with your own weights from last time. Their numbers are shown beside each exercise as a guide.',
  },
  routine: {
    gone: 'This routine isn’t shared with you any more.',
    label: (name: string) => `${name}’s routine, open ${name}’s profile`,
    whose: (name: string) => `${name}’s routine`,
    doIt: 'Do this routine',
    explain: 'Their exercises, sets and rep ranges, with your own weights from last time.',
    empty: 'Nothing in it yet.',
    superset: 'Superset',
  },
  board: {
    label: 'Leaderboard',
    rankBy: 'Rank by',
    stat: 'Stat',
    period: 'Period',
    done: 'Done',
    change: 'Change',
    nobody: 'Nobody to race yet',
    nobodyBody: 'Once a friend adds you, you’ll see who trained most this week and this month.',
    stats: { workouts: 'Workouts', lifted: 'Weight', sets: 'Sets', minutes: 'Time' },
    rankings: { most: 'Most', improved: 'Most improved' },
    periods: { week: 'This week', month: 'This month' },
    summary: {
      most: {
        week: {
          workouts: 'Most workouts this week',
          lifted: 'Most weight this week',
          sets: 'Most sets this week',
          minutes: 'Most time this week',
        },
        month: {
          workouts: 'Most workouts this month',
          lifted: 'Most weight this month',
          sets: 'Most sets this month',
          minutes: 'Most time this month',
        },
      },
      improved: {
        week: {
          workouts: 'Most improved: workouts this week',
          lifted: 'Most improved: weight this week',
          sets: 'Most improved: sets this week',
          minutes: 'Most improved: time this week',
        },
        month: {
          workouts: 'Most improved: workouts this month',
          lifted: 'Most improved: weight this month',
          sets: 'Most improved: sets this month',
          minutes: 'Most improved: time this month',
        },
      },
    },
    workouts: (count: string, n: number) => (n === 1 ? '1 workout' : `${count} workouts`),
    sets: (count: string, n: number) => (n === 1 ? '1 set' : `${count} sets`),
    ofTraining: (time: string) => `${time} of training`,
    lifted: (amount: string) => `${amount} lifted`,
    behind: (amount: string, who: string) => `${amount} behind ${who}`,
    levelWith: (who: string) => `Level with ${who}`,
    ahead: (amount: string, who: string) => `${amount} ahead of ${who}`,
    ordinal: (rank: number): string => {
      const tens = rank % 100;
      if (tens >= 11 && tens <= 13) return `${String(rank)}th`;
      switch (rank % 10) {
        case 1:
          return `${String(rank)}st`;
        case 2:
          return `${String(rank)}nd`;
        case 3:
          return `${String(rank)}rd`;
        default:
          return `${String(rank)}th`;
      }
    },
    lastDay: 'Last day',
    daysLeft: (days: number) => `${String(days)} days left`,
    crowned: (improved: boolean, period: 'week' | 'month') =>
      `${improved ? 'Most improved' : 'Won'} last ${period}`,
    nothingYetToMeasure: 'Nothing to measure against yet',
    ofUsual: (score: number) => `${String(score)}% of usual`,
    rowNew: (name: string) => `${name}: new`,
    rowNewWhy: (name: string, period: 'week' | 'month') =>
      `${name}: new, nothing in the four weeks before this ${period} to measure against`,
    rowNothing: (name: string) => `${name}: nothing yet`,
    rowPlaced: (place: string, name: string, score: string) => `${place}, ${name}: ${score}`,
    moved: (up: boolean, by: number) => `${up ? 'Up' : 'Down'} ${String(by)} since yesterday`,
    new: 'New',
    usualWeek:
      '100% is a usual week: a quarter of what each person did in the four weeks before it.',
    usualMonth:
      '100% is a usual month: what each person did in the four weeks before it, stretched to the month’s length.',
    weightCounts:
      'Weight × reps on working sets. Bodyweight moves like pull-ups and dips count only the weight added to them.',
    oneNotSharing: (name: string) => `${name} isn’t sharing their training, so isn’t on the board.`,
    manyNotSharing: (count: number) =>
      `${String(count)} friends aren’t sharing their training, so aren’t on the board.`,
    noPlace: 'No place yet',
    yourPlace: (rank: number) => `You’re #${String(rank)}`,
  },
  challenge: {
    title: {
      most: {
        workouts: 'Most workouts',
        lifted: 'Most weight lifted',
        sets: 'Most sets',
        minutes: 'Most time training',
      },
      improved: {
        workouts: 'Most improved: workouts',
        lifted: 'Most improved: weight lifted',
        sets: 'Most improved: sets',
        minutes: 'Most improved: time training',
      },
    },
    metric: {
      workouts: 'workouts',
      lifted: 'weight lifted',
      sets: 'sets',
      minutes: 'time training',
    },
    ofUsual: '% of usual',
    underAnHour: 'Under an hour left',
    hoursLeft: (hours: number) => (hours === 1 ? '1 hour left' : `${String(hours)} hours left`),
    daysLeft: (days: number) => `${String(days)} days left`,
    against: (title: string, name: string) => `${title}, against ${name}`,
    sent: (when: string) => `Sent ${when}`,
    ended: (when: string) => `Ended ${when}`,
    waiting: (name: string) => `Waiting for ${name} to accept`,
    challengedYou: (name: string) => `${name} challenged you. Seven days, from when you accept.`,
    youWon: 'You won',
    theyWon: (name: string) => `${name} won`,
    draw: 'A draw',
    unavailable: 'Result unavailable',
    finalizing: 'Finalizing result',
    sharingOff: 'Training sharing is off, so this challenge can’t be scored.',
    finalizingNote: 'Allowing 24 hours for offline workouts to sync. Then the scores are final.',
    recovered: 'Recovered result · based on available training',
    excluded:
      'Training was unavailable when the scores locked. This result is excluded from your record.',
    gotIt: 'Got it',
    accept: 'Accept',
    decline: 'Decline',
    acceptLabel: (name: string) => `Accept ${name}’s challenge`,
    declineLabel: (name: string) => `Decline ${name}’s challenge`,
    takeBackLabel: (name: string) => `Take back your challenge to ${name}`,
    takeBack: 'Take it back',
    resultUnchanged: 'Training was unavailable when the scores locked. Your record is unchanged.',
    resultOf: (i: number, n: number) => `Result ${String(i)} of ${String(n)}`,
    view: 'View challenge',
    nextResult: 'Next result',
    later: 'Later',
    resultAgainst: (title: string, name: string) => `${title} against ${name}`,
    heading: 'Challenges',
    challenge: (name: string) => `Challenge ${name}`,
    fromAccept: (name: string) => `Seven days, from when ${name} accepts.`,
    explainImproved:
      'Seven days, each of you against your own last four weeks, so it’s fair whoever trains more.',
    explainMost: 'Seven days. Whoever does the most wins.',
    send: 'Send challenge',
    startsWhen: (name: string) => `Starts when ${name} accepts.`,
    problems: {
      already_live: (name: string) => `You already have a challenge with ${name}. One at a time.`,
      not_sharing: (name: string) =>
        `${name} isn’t sharing their training, so a challenge can’t be scored.`,
      you_not_sharing: (_name: string) =>
        'Turn on sharing your training in Settings to take part in challenges.',
      no_usual: (name: string) =>
        `${name} has no workouts in the last four weeks to measure against. Try Most instead.`,
      you_no_usual: (_name: string) =>
        'You have no workouts in the last four weeks to measure against. Try Most instead.',
      not_friends: (name: string) => `${name} is no longer on your friends list.`,
      not_found: (_name: string) => 'That challenge isn’t there any more.',
      too_many: (_name: string) => 'Too many challenges sent. Try again later.',
      invalid: (_name: string) => 'Something was wrong with that challenge. Try again.',
    },
  },
};
