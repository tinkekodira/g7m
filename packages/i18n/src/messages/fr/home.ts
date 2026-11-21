import type { Messages } from '../en/index.js';

type Region = 'legs' | 'arms' | 'shoulders' | 'back' | 'chest' | 'core';

const plural = (count: number, one: string, many: string): string =>
  `${String(count)} ${count === 1 ? one : many}`;

const REGION: Record<Region, string> = {
  legs: 'Jambes',
  arms: 'Bras',
  shoulders: 'Épaules',
  back: 'Dos',
  chest: 'Pectoraux',
  core: 'Gainage',
};

export const home: Messages['home'] = {
  yourProfile: 'Ton profil',
  thisMonth: 'Ce mois-ci',
  quickAccess: 'Accès rapide',
  stillOpen: 'Toujours ouverte',
  inProgress: 'En cours',
  openIt: 'L’ouvrir',
  today: {
    label: 'Séance du jour',
    noGoalTitle: 'Obtiens un plan fait pour toi',
    noGoalBody:
      'Choisis un objectif et combien de jours tu t’entraînes. Ça prend une dizaine de secondes, et chaque séance ensuite est construite à partir de ce que tu enregistres.',
    chooseGoal: 'Choisir un objectif',
    working: 'Préparation de la séance du jour…',
    minutes: (minutes: number) => `${String(minutes)} min`,
    sets: (sets: number) => `${String(sets)} ${sets === 1 ? 'série' : 'séries'}`,
    doneTitle: 'C’est fini pour aujourd’hui',
    trainedToday: (parts: string) => `Entraîné aujourd’hui · ${parts}`,
    doneBody:
      'C’est au repos que le travail du jour devient du progrès. La séance de demain est construite à partir de lui.',
    settingUp: 'Préparation…',
    trainAgain: 'S’entraîner encore',
    weekTitle: 'Ta semaine est bouclée',
    weekBody:
      'Tout ce que la séance du jour ferait travailler a déjà eu ses séries ces sept derniers jours. Une séance de plus maintenant coûte plus de récupération qu’elle n’apporte.',
    trainAnyway: 'S’entraîner quand même',
    summary: (exercises: number, sets: number) =>
      `${String(exercises)} exercices · ${String(sets)} séries`,
    about: (minutes: number) => ` · environ ${String(minutes)} min`,
    muscleGroups: 'Groupes musculaires',
    start: 'Démarrer la séance',
    seePlan: 'Voir le plan',
  },
  tiles: {
    plan: 'Plan du jour',
    planDetail: 'Ce que l’app propose',
    continue: 'Reprendre ta séance',
    start: 'Démarrer une séance',
    continueDetail: 'Retour à ta séance',
    startDetail: 'Choisis une routine ou pars de zéro',
    calendar: 'Calendrier',
    calendarDetail: 'Les jours où tu t’es entraîné',
    browse: 'Parcourir les exercices',
    browseDetail: 'Toute la bibliothèque',
    progress: 'Progrès',
    progressDetail: 'Où en est ton entraînement',
  },
  sync: {
    lost: 'Certaines modifications n’ont pas atteint le serveur',
    stopped: 'La synchronisation s’est arrêtée',
    lostDetail: 'Elles sont sur ce téléphone mais ne seront pas synchronisées.',
    stoppedDetail: 'Tout est toujours enregistré sur ce téléphone.',
    see: 'Voir ce qui s’est passé',
  },
  cards: {
    records: 'Records personnels',
    workouts: 'Séances',
    muscles: 'Groupes musculaires',
    activity: 'Force et activité',
    slide: (name: string, position: number, total: number) =>
      `${name}, ${String(position)} sur ${String(total)}`,
    workoutsLabel: (total: number, heading: string, detail: string) =>
      `Séances ce mois-ci : ${String(total)} terminées. ${heading}. ${detail}`,
    yourWorkouts: 'Tes séances',
    completed: 'terminées',
    workoutsSummary: (total: number, current: string, previous: number, previousName: string) =>
      `${String(total)} séances en ${current} pour l’instant, contre ${String(previous)} à la même date en ${previousName}.`,
    musclesLabel: (sets: number, groups: number, heading: string, detail: string) =>
      `Groupes musculaires ce mois-ci : ${String(sets)} ${sets === 1 ? 'série' : 'séries'} sur ${String(groups)} ${groups === 1 ? 'groupe' : 'groupes'}. ${heading}. ${detail}`,
    groups: (count: number) => (count === 1 ? 'groupe' : 'groupes'),
    setsWord: (count: number) => (count === 1 ? 'série' : 'séries'),
    noSets: 'Aucune série ce mois-ci pour l’instant.',
    activityLabel: (
      workouts: number,
      time: string,
      perWeek: string,
      lifted: string,
      range: string,
      heading: string,
      detail: string,
    ) =>
      `Force et activité ce mois-ci : ${String(workouts)} ${workouts === 1 ? 'séance' : 'séances'}, ${time} d’entraînement, ${perWeek} par semaine, ${lifted} soulevés. Par rapport à ${range}. ${heading}. ${detail}`,
    strengthActivity: 'Force et activité',
    firstMonth: 'Premier mois',
    comparedWith: 'Par rapport à',
    range: (month: string, through: number) => `1er–${String(through)} ${month}`,
    statWorkouts: 'Séances',
    trainingTime: 'Temps d’entraînement',
    perWeek: 'Par semaine',
    volumeLifted: 'Volume soulevé',
    recordsLabel: (count: number, heading: string, detail: string) =>
      `Records personnels ce mois-ci : ${String(count)} ${count === 1 ? 'nouveau record' : 'nouveaux records'}. ${heading}. ${detail}`,
    newBests: (count: number) => (count === 1 ? 'nouveau record' : 'nouveaux records'),
    exercise: 'Exercice',
    firstTime: 'Première fois',
    onYourBest: (weight: string) => `${weight} de plus que ton record`,
    best: (weight: string) => `Record ${weight}`,
    sameAsLast: 'Pareil que le mois dernier',
    noneLast: 'Aucun le mois dernier',
    up: 'en plus',
    down: 'en moins',
    yourMonth: 'Ton mois',
    today: 'Aujourd’hui',
    monthStart: (month: string) => `1er ${month}`,
    firstTitle: 'Ta première séance lance le graphique',
    firstBody:
      'Enregistre-en une et tout se remplit : à quelle fréquence tu t’entraînes, quels muscles tu travailles et combien tu soulèves, mois après mois.',
    logWorkout: 'Enregistrer une séance',
  },
  insights: {
    workouts: {
      start: {
        heading: 'Ton mois commence par une séance',
        detail: 'Enregistre une séance et cette courbe commencera à monter.',
      },
      notYet: {
        heading: 'Rien d’enregistré ce mois-ci',
        detail: (previous: number) =>
          `Le mois dernier, tu as fait ${plural(previous, 'séance', 'séances')}. Aujourd’hui est un bon jour pour commencer.`,
      },
      firstMonth: {
        heading: 'Ton premier mois est lancé',
        detail: (workouts: number) =>
          `${plural(workouts, 'séance', 'séances')} pour l’instant. Le mois prochain devra faire mieux.`,
      },
      ahead: {
        heading: 'Tu es sur ta lancée',
        detail: (by: number) =>
          `${plural(by, 'séance', 'séances')} de plus qu’à la même date le mois dernier.`,
      },
      level: {
        heading: 'À égalité avec le mois dernier',
        detail: (workouts: number) =>
          `${plural(workouts, 'séance', 'séances')}, autant qu’à la même date le mois dernier.`,
      },
      behind: {
        heading: 'Un peu en retard sur le mois dernier',
        detail: (by: number) => `${plural(by, 'séance', 'séances')} de moins qu’à la même date.`,
      },
    },
    muscles: {
      none: {
        heading: 'Aucune série enregistrée ce mois-ci',
        detail: 'Chaque série enregistrée apparaît ici, par groupe musculaire.',
      },
      early: {
        heading: 'Le tableau se remplit',
        detail: (sets: number) =>
          `${plural(sets, 'série', 'séries')} pour l’instant. Encore quelques séances et l’équilibre apparaîtra.`,
      },
      neglected: {
        atLeast: (region: Region, days: number) =>
          `${REGION[region]} : rien depuis ${String(days)} jours`,
        exactly: (region: Region, days: number) =>
          `${REGION[region]} : pas travaillés depuis ${String(days)} jours`,
        detail: 'Mérite une place dans ta prochaine séance.',
      },
      lopsided: {
        heading: (region: Region, percent: number) =>
          `${REGION[region]} : ${String(percent)} % de tes séries`,
        detail: 'Répartir le travail évite que le reste prenne du retard.',
      },
      balanced: {
        heading: 'Bien équilibré',
        detail: 'Tu travailles chaque grand groupe musculaire ce mois-ci.',
      },
      focused: {
        heading: (regions: readonly Region[]) =>
          `Surtout ${regions.map((region) => REGION[region].toLowerCase()).join(' et ')} pour l’instant`,
        detail: 'Le reste aura son tour au fil du mois.',
      },
    },
    activity: {
      quiet: {
        heading: 'Ton mois t’attend',
        detail: 'Le temps, le volume et le rythme apparaîtront après ta première séance.',
      },
      stronger: {
        heading: 'Tu soulèves plus',
        detail: (percent: number) =>
          `${String(percent)} % de charge en plus qu’à la même date le mois dernier.`,
      },
      consistent: {
        heading: 'Belle régularité',
        detail: (perWeek: string) => `Environ ${perWeek} par semaine. Tu es là, et ça se voit.`,
      },
      catchUp: {
        heading: (by: number) =>
          by === 1 ? 'Une séance comble l’écart' : `${String(by)} séances pour rattraper`,
        detail:
          'En retard sur le rythme du mois dernier à cette date, avec du temps pour rattraper.',
      },
      steady: {
        heading: 'Un mois régulier',
        detail: 'Continue et la tendance apparaîtra ici.',
      },
    },
    records: {
      oneLift: 'Un exercice',
      none: {
        heading: 'Aucun exercice enregistré ce mois-ci',
        detail: 'Tes séries les plus lourdes du mois apparaissent ici, face à ton record.',
      },
      new: {
        heading: (count: number) =>
          count === 1
            ? 'Un nouveau record personnel'
            : `${String(count)} nouveaux records personnels`,
        detail: (name: string) => `${name} : plus lourd que jamais. Tu deviens plus fort.`,
      },
      first: {
        heading: 'Tes premiers records sont posés',
        detail: (count: number) =>
          `${String(count)} ${count === 1 ? 'exercice' : 'exercices'} à battre désormais. Monte en charge et ils apparaîtront comme nouveaux records.`,
      },
      close: {
        heading: (weight: string) => `À ${weight} de ton record`,
        detail: (name: string) => `${name} y est presque. Un bon jour et c’est dans la boîte.`,
      },
      holding: {
        heading: 'Tes records tiennent toujours',
        detail: 'Une série plus lourde sur n’importe quel exercice ce mois-ci apparaîtra ici.',
      },
    },
  },
};
