/**
 * The training review: what the log says about how it is going.
 *
 * Functions take the parts of a sentence, already formatted — a weight is
 * "100 kg", a mark is "100 kg × 5" — and a muscle group by its slug, so each
 * language can decline it however its grammar needs.
 */
const GROUPS: Record<string, string> = {
  chest: 'chest',
  back: 'back',
  shoulders: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  quads: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  calves: 'calves',
  core: 'core',
};

const group = (slug: string): string => GROUPS[slug] ?? slug;

/** "chest is", "glutes are". */
const groupIs = (slug: string): string => {
  const word = group(slug);
  return `${word} ${word.endsWith('s') ? 'are' : 'is'}`;
};

export const review = {
  card: {
    eyebrow: 'From your log',
    title: 'How it is going',
    intro: 'Read from what you logged, whether the plan wrote it or you did.',
  },
  mark: {
    seconds: (reps: number) => `${String(reps)} s`,
    reps: (reps: number) => `${String(reps)} ${reps === 1 ? 'rep' : 'reps'}`,
    forSeconds: (reps: number) => ` for ${String(reps)} s`,
    times: (reps: number) => ` × ${String(reps)}`,
    help: (count: string, weight: string) => `${count} with ${weight} of help`,
  },
  ago: (days: number) =>
    days < 14
      ? `${String(days)} ${days === 1 ? 'day' : 'days'} ago`
      : `${String(Math.round(days / 7))} weeks ago`,
  consistency: {
    heading: 'You are training less than you planned for',
    detail: (perWeek: number, weeks: number, target: number) =>
      `About ${String(perWeek)} sessions a week over the last ${String(weeks)}, against the ${String(target)} you set. The plan is built to fit ${String(target)}; if that is not the week you have, it is worth changing the number.`,
  },
  groupShort: {
    heading: (slug: string) => `Your ${groupIs(slug)} behind`,
    detail: (perWeek: number, target: number) =>
      `${String(perWeek)} sets a week against a target of ${String(target)}. It is the furthest behind of anything you train, which makes it the one thing worth adding first.`,
  },
  groupOver: {
    heading: (slug: string) => `A lot of ${group(slug)}`,
    detail: (perWeek: number, target: number) =>
      `${String(perWeek)} sets a week against a target of ${String(target)}. Not harmful, but past a point the extra sets stop paying for the recovery they cost.`,
  },
  climbing: {
    heading: (name: string) => `Your ${name.toLowerCase()} is going up`,
    detail: (from: string, to: string, sessions: number) =>
      `${from} to ${to} across ${String(sessions)} sessions. That is the thing working.`,
  },
  stalled: {
    heading: (name: string) => `Your ${name.toLowerCase()} has not moved`,
    detail: (best: string, ago: string, sessionsSince: number, advice: string) =>
      `Your best lately is still ${best}, from ${ago}, and ${
        sessionsSince === 1
          ? 'the session since has not'
          : `the ${String(sessionsSince)} sessions since have not`
      } beaten it. ${advice}`,
    backOff:
      'A plateau usually breaks by backing off about ten percent and running at it again, which the plan will do for you after three short sessions in a row.',
    yours: (timed: boolean) =>
      `${timed ? 'A hold' : 'A bodyweight movement'} usually moves again with an extra set or a slower, harder version of each rep. The plan does not change ${timed ? 'holds' : 'these'} for you, so this one is yours to adjust.`,
  },
  tooSoon: {
    heading: 'Not enough to go on yet',
    detail: (sessions: number, needed: number) =>
      `${String(sessions)} of ${String(needed)} sessions logged. Once there are a few, this is where you will find out how it is actually going.`,
  },
  notEnoughWeeks: {
    heading: 'Enough sessions, not enough weeks',
    detail: (sessions: number, days: number, wait: number) =>
      `${String(sessions)} sessions over ${String(days)} ${days === 1 ? 'day' : 'days'}. A weekly pattern needs about two weeks to mean anything, so check back ${wait === 1 ? 'tomorrow' : `in ${String(wait)} days`}.`,
  },
  pace: {
    onTrack: {
      heading: 'Your weight is doing what you asked it to',
      detail: (rate: string, goal: string) =>
        `${rate} a week, which is inside the range for ${goal.toLowerCase()}. Nothing to change.`,
    },
    fast: {
      heading: 'Your weight is moving faster than the goal wants',
      detail: (rate: string, goal: string) =>
        `${rate} a week. Faster than the range for ${goal.toLowerCase()} — which usually means giving up strength on the way, and the training here is meant to keep it.`,
    },
    slow: {
      heading: 'Your weight is barely moving',
      detail: (rate: string, goal: string) =>
        `${rate} a week, which is short of the range for ${goal.toLowerCase()}. The training is not what changes this one.`,
    },
    wrongWay: {
      heading: 'Your weight is going the other way',
      detail: (rate: string, down: boolean, goal: string) =>
        `${rate} a week ${down ? 'down' : 'up'}, and you asked for ${goal.toLowerCase()}. Either the goal has changed or the week has; both are worth a look.`,
    },
  },
  links: {
    rate: (perWeek: string) => `${perWeek} a week`,
    attendance: {
      heading: (name: string) => `Your ${name.toLowerCase()} is stuck, and the sessions are why`,
      detail: (rate: string, target: number) =>
        `You have trained ${rate} against the ${String(target)} you set. A lift needs to come round often enough to be pushed — this one is not a programming problem yet.`,
    },
    deficit: {
      heading: (name: string) => `Your ${name.toLowerCase()} is stuck, and your weight explains it`,
      detail: (best: string, losing: string) =>
        `Your best lately is still ${best}, while you are losing ${losing} a week. Strength usually flattens in a deficit — holding it is the win here, so this is worth leaving alone rather than rebuilding the plan around.`,
    },
    programming: {
      heading: (name: string) =>
        `Your ${name.toLowerCase()} is stuck, and nothing else explains it`,
      detail: (best: string, sessions: number, advice: string) =>
        `Your best lately is still ${best} after ${String(sessions)} more ${sessions === 1 ? 'session' : 'sessions'}, with the sessions happening and your weight where you asked it to be. That leaves the training: ${advice}`,
      backOff:
        'back off about ten percent and run at it again, which the plan does for you after three short sessions.',
      yours:
        'add a set, or slow each rep down. The plan does not change these for you, so the change is yours to make.',
    },
    shortfall: {
      heading: (slug: string) => `Your ${groupIs(slug)} behind because the sessions are`,
      detail: (rate: string, target: number) =>
        `Training ${rate} against the ${String(target)} you set. Adding volume to a plan you are not getting to will not fix this one — the attendance comes first.`,
    },
    confirmed: {
      heading: 'This is working',
      detail: (name: string, from: string, to: string, pace: string) =>
        `Your ${name.toLowerCase()} went ${from} to ${to}, and your weight is moving at ${pace} a week, which is where you asked for it. Nothing here needs changing.`,
    },
  },
};
