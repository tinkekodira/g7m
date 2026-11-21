import type { Messages } from '../en/index.js';

const GROUPS: Record<string, string> = {
  chest: 'pectoraux',
  back: 'dos',
  shoulders: 'épaules',
  biceps: 'biceps',
  triceps: 'triceps',
  quads: 'quadriceps',
  hamstrings: 'ischios',
  glutes: 'fessiers',
  calves: 'mollets',
  core: 'gainage',
};

const group = (slug: string): string => GROUPS[slug] ?? slug;

const lower = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

export const review: Messages['review'] = {
  card: {
    eyebrow: 'D’après ton journal',
    title: 'Où tu en es',
    intro: 'Lu à partir de ce que tu as enregistré, que ce soit le plan ou toi qui l’ait écrit.',
  },
  mark: {
    seconds: (reps: number) => `${String(reps)} s`,
    reps: (reps: number) => `${String(reps)} rép.`,
    forSeconds: (reps: number) => ` pendant ${String(reps)} s`,
    times: (reps: number) => ` × ${String(reps)}`,
    help: (count: string, weight: string) => `${count} avec ${weight} d’aide`,
  },
  ago: (days: number) =>
    days < 14
      ? `il y a ${String(days)} ${days === 1 ? 'jour' : 'jours'}`
      : `il y a ${String(Math.round(days / 7))} semaines`,
  consistency: {
    heading: 'Tu t’entraînes moins que prévu',
    detail: (perWeek: number, weeks: number, target: number) =>
      `Environ ${String(perWeek)} séances par semaine sur les ${String(weeks)} dernières, contre les ${String(target)} que tu as fixées. Le plan est conçu pour ${String(target)} ; si ce n’est pas la semaine que tu as, ça vaut la peine de changer le chiffre.`,
  },
  groupShort: {
    heading: (slug: string) => `Tes ${group(slug)} sont en retard`,
    detail: (perWeek: number, target: number) =>
      `${String(perWeek)} séries par semaine pour un objectif de ${String(target)}. C’est ce qui est le plus en retard dans tout ce que tu travailles : c’est donc la première chose à ajouter.`,
  },
  groupOver: {
    heading: (slug: string) => `Beaucoup de ${group(slug)}`,
    detail: (perWeek: number, target: number) =>
      `${String(perWeek)} séries par semaine pour un objectif de ${String(target)}. Pas dangereux, mais au-delà d’un certain point les séries en plus ne rapportent plus la récupération qu’elles coûtent.`,
  },
  climbing: {
    heading: (name: string) => `Ton ${lower(name)} progresse`,
    detail: (from: string, to: string, sessions: number) =>
      `De ${from} à ${to} sur ${String(sessions)} séances. C’est que ça marche.`,
  },
  stalled: {
    heading: (name: string) => `Ton ${lower(name)} ne bouge plus`,
    detail: (best: string, ago: string, sessionsSince: number, advice: string) =>
      `Ton meilleur résultat récent est toujours ${best}, ${ago}, et ${
        sessionsSince === 1
          ? 'la séance suivante ne l’a pas battu'
          : `les ${String(sessionsSince)} séances suivantes ne l’ont pas battu`
      }. ${advice}`,
    backOff:
      'Un plateau se débloque généralement en baissant d’environ dix pour cent puis en remontant, ce que le plan fera pour toi après trois séances moins bonnes d’affilée.',
    yours: (timed: boolean) =>
      `${timed ? 'Un exercice de maintien' : 'Un exercice au poids du corps'} repart généralement avec une série de plus ou des répétitions plus lentes et plus dures. Le plan n’ajuste pas ${timed ? 'les maintiens' : 'ces exercices'} pour toi : à toi de jouer.`,
  },
  tooSoon: {
    heading: 'Pas encore assez de données',
    detail: (sessions: number, needed: number) =>
      `${String(sessions)} séances enregistrées sur ${String(needed)}. Dès qu’il y en aura quelques-unes, c’est ici que tu verras comment ça se passe vraiment.`,
  },
  notEnoughWeeks: {
    heading: 'Assez de séances, pas assez de semaines',
    detail: (sessions: number, days: number, wait: number) =>
      `${String(sessions)} séances en ${String(days)} ${days === 1 ? 'jour' : 'jours'}. Une tendance hebdomadaire demande environ deux semaines pour vouloir dire quelque chose, alors reviens ${wait === 1 ? 'demain' : `dans ${String(wait)} jours`}.`,
  },
  pace: {
    onTrack: {
      heading: 'Ton poids fait ce que tu lui demandes',
      detail: (rate: string, goal: string) =>
        `${rate} par semaine, dans la fourchette pour « ${lower(goal)} ». Rien à changer.`,
    },
    fast: {
      heading: 'Ton poids évolue plus vite que l’objectif ne le veut',
      detail: (rate: string, goal: string) =>
        `${rate} par semaine. Plus vite que la fourchette pour « ${lower(goal)} », ce qui veut souvent dire perdre de la force en route, alors que l’entraînement ici est fait pour la garder.`,
    },
    slow: {
      heading: 'Ton poids bouge à peine',
      detail: (rate: string, goal: string) =>
        `${rate} par semaine, en dessous de la fourchette pour « ${lower(goal)} ». Ce n’est pas l’entraînement qui changera ça.`,
    },
    wrongWay: {
      heading: 'Ton poids va dans l’autre sens',
      detail: (rate: string, down: boolean, goal: string) =>
        `${rate} par semaine en ${down ? 'moins' : 'plus'}, alors que tu as choisi « ${lower(goal)} ». Soit l’objectif a changé, soit ta semaine : les deux méritent un coup d’œil.`,
    },
  },
  links: {
    rate: (perWeek: string) => `${perWeek} par semaine`,
    attendance: {
      heading: (name: string) => `Ton ${lower(name)} stagne, et c’est à cause des séances`,
      detail: (rate: string, target: number) =>
        `Tu t’es entraîné ${rate}, contre les ${String(target)} que tu as fixées. Un exercice doit revenir assez souvent pour progresser : ce n’est pas encore un problème de programmation.`,
    },
    deficit: {
      heading: (name: string) => `Ton ${lower(name)} stagne, et ton poids l’explique`,
      detail: (best: string, losing: string) =>
        `Ton meilleur résultat récent est toujours ${best}, alors que tu perds ${losing} par semaine. La force stagne souvent en déficit : la garder, c’est déjà gagner, alors mieux vaut ne rien toucher que refaire le plan.`,
    },
    programming: {
      heading: (name: string) => `Ton ${lower(name)} stagne, et rien d’autre ne l’explique`,
      detail: (best: string, sessions: number, advice: string) =>
        `Ton meilleur résultat récent est toujours ${best} après ${String(sessions)} ${sessions === 1 ? 'séance' : 'séances'} de plus, alors que tu t’entraînes et que ton poids est là où tu le voulais. Reste l’entraînement : ${advice}`,
      backOff:
        'baisse d’environ dix pour cent et remonte, ce que le plan fait pour toi après trois séances moins bonnes.',
      yours:
        'ajoute une série, ou ralentis chaque répétition. Le plan ne les ajuste pas pour toi : le changement est entre tes mains.',
    },
    shortfall: {
      heading: (slug: string) => `Tes ${group(slug)} sont en retard parce que les séances le sont`,
      detail: (rate: string, target: number) =>
        `Tu t’entraînes ${rate}, contre les ${String(target)} que tu as fixées. Ajouter du volume à un plan que tu n’arrives pas à suivre ne réglera rien : la régularité passe d’abord.`,
    },
    confirmed: {
      heading: 'Ça marche',
      detail: (name: string, from: string, to: string, pace: string) =>
        `Ton ${lower(name)} est passé de ${from} à ${to}, et ton poids évolue de ${pace} par semaine, comme tu le voulais. Rien à changer ici.`,
    },
  },
};
