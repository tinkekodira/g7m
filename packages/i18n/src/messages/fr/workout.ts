import type { Messages } from '../en/index.js';

const plural = (count: number, one: string, many: string): string =>
  `${String(count)} ${count === 1 ? one : many}`;

const lower = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

export const workout: Messages['workout'] = {
  notOnDevice: 'Cette séance n’est pas sur cet appareil.',
  progress: 'Progrès',
  editingClosed: 'Modification fermée',
  editWindow: 'Les séances sont modifiables pendant 2 heures après la fin.',
  details: 'Détails de la séance',
  boutRemoved: 'Bloc supprimé.',
  titleEdit: 'Modifier la séance',
  titlePast: 'Séance passée',
  title: 'Séance',
  elapsed: 'écoulé',
  lifted: (weight: string) => `${weight} soulevés`,
  calendar: 'Calendrier',
  editingHint:
    'Enregistre chaque série modifiée avec Enregistrer ou la coche. La modification se ferme 2 heures après la fin.',
  uncounted: (sets: number) =>
    `${sets === 1 ? 'Une série n’est pas comptée' : `${String(sets)} séries ne sont pas comptées`} dans le total : il leur faut un poids de corps comme référence.`,
  addExercise: '+ Ajouter un exercice',
  doneEditing: 'Terminer la modification',
  finish: 'Terminer la séance',
  confirmDiscard: 'Abandonner cette séance et tout ce qui y est enregistré ?',
  discard: 'Abandonner',
  removeTitle: (name: string | null) => `Retirer ${name ?? 'cet exercice'} ?`,
  exercise: 'Exercice',
  removal: {
    nothing: 'Rien n’y est encore enregistré.',
    one: (bout: boolean) => `${bout ? 'Le bloc enregistré' : 'La série enregistrée'} part avec.`,
    many: (count: number, bout: boolean) =>
      `Les ${String(count)} ${bout ? 'blocs enregistrés' : 'séries enregistrées'} partent avec.`,
  },
  removed: {
    drop: 'Drop supprimé.',
    set: 'Série supprimée.',
    setWithDrops: (drops: number) =>
      `Série supprimée, avec ${String(drops)} ${drops === 1 ? 'drop' : 'drops'}.`,
    exercise: (name: string) => `${name} retiré.`,
    exerciseWithSets: (name: string, sets: number) =>
      `${name} retiré, avec ${String(sets)} ${sets === 1 ? 'série' : 'séries'}.`,
  },
  superset: {
    label: 'Superset',
    heading: (count: number) => `Superset · ${String(count)} exercices`,
    ungroup: 'Dissocier',
    addRound: 'Ajouter un tour',
  },
  summary: {
    label: 'Résumé de la séance',
    elapsed: (hours: number, minutes: number, seconds: number) =>
      `${String(hours)} ${hours === 1 ? 'heure' : 'heures'} ${String(minutes)} minutes ${String(seconds)} secondes écoulées`,
    completedSets: 'Séries de travail terminées : ',
    sets: (count: number) => `${String(count)} ${count === 1 ? 'série' : 'séries'}`,
  },
  start: {
    title: 'S’entraîner',
    nothing:
      'Rien en cours. Démarre une séance et ajoute les exercices au fur et à mesure : tout est enregistré sur ce téléphone dès que tu touches, avec ou sans réseau.',
    button: 'Démarrer une séance',
  },
  bodyweight: {
    title: 'Combien pèses-tu ?',
    body: 'Une traction, c’est déplacer ton propre poids. Sans ce chiffre, ces séries peuvent être enregistrées mais pas mesurées, elles ne compteraient donc pour rien.',
    label: (unit: string) => `Poids de corps (${unit})`,
  },
  unknownExercise: 'Exercice inconnu',
  thatLift: 'cet exercice',
  elsewhere: (gym: string | null, set: string) =>
    `Première fois sur cette machine ici. La dernière fois ${gym === null ? 'ailleurs' : `à ${gym}`} : ${set}.`,
  noSets: 'Pas encore de séries.',
  advice: (reps: number, weight: string, next: string) =>
    `${String(reps)} rép. à ${weight} : essaie ${next} la prochaine fois`,
  warmUp: 'Échauffement',
  addSet: 'Ajouter une série',
  ramp: (count: number, from: string, to: string) =>
    `Ajoute ${String(count)} ${count === 1 ? 'série' : 'séries'} de ${from} jusqu’à ${to}`,
  effort: {
    question: 'Sur cette dernière série, combien aurais-tu pu en faire de plus ?',
    none: 'Aucune',
  },
  set: {
    deleteRow: (title: string) => `Supprimer ${lower(title)}`,
    dropAfter: (title: string) => `Drop après ${lower(title)}`,
    drop: 'Drop',
    last: (set: string) => `Dernière : ${set}`,
    load: (title: string) => `Charge ${lower(title)}`,
    bodyweight: 'Poids de corps',
    addedWeight: 'Lest',
    durationFormat: (title: string) => `Format de durée ${lower(title)}`,
    seconds: 'Secondes',
    minSec: 'Min + s',
    minutes: 'Minutes',
    reps: 'Rép.',
    saveRow: (title: string) => `Enregistrer ${lower(title)}`,
    markSkipped: 'Marquer comme passée',
  },
  rows: {
    warmup: (number: number) => `Échauffement ${String(number)}`,
    set: (number: number) => `Série ${String(number)}`,
    drop: 'Drop',
    dropNumbered: (number: number) => `Drop ${String(number)}`,
    tickWarmup: (done: boolean, number: number) =>
      `${done ? 'Annuler' : 'Valider'} l’échauffement ${String(number)}`,
    tickDrop: (done: boolean, number: number, parent: number) =>
      `${done ? 'Annuler' : 'Valider'} le drop ${String(number)} de la série ${String(parent)}`,
    tickSet: (done: boolean, number: number) =>
      `${done ? 'Annuler' : 'Valider'} la série ${String(number)}`,
  },
  stillTraining: {
    title: 'Toujours en séance ?',
    idle: (minutes: number) =>
      `Rien coché depuis ${String(minutes)} ${minutes === 1 ? 'minute' : 'minutes'}.`,
    keepGoing: 'Continuer',
    finish: 'Terminer',
  },
  rest: {
    over: 'Repos terminé',
    resting: 'Repos',
    less: (label: string) => `${label} de repos en moins`,
    more: (label: string) => `${label} de repos en plus`,
    dismiss: 'Ignorer',
  },
  record: {
    badge: 'PR',
    heaviestShort: 'Le plus lourd',
    heaviest: (name: string) => `${name} : ta série la plus lourde`,
    heaviestDetail: (now: string, gain: string, unit: string) =>
      `${now} ${unit} : ${gain} ${unit} de plus que ton ancien record.`,
    bestShort: 'Meilleure série',
    best: (name: string) => `${name} : ta meilleure série`,
    bestDetail: (now: string, before: string, unit: string, beforeUnit: string) =>
      `Max estimé ${now} ${unit}, contre ${before} ${beforeUnit} avant.`,
  },
  open: {
    past: 'Termine d’enregistrer ta séance passée',
    stale: 'Tu as laissé une séance ouverte',
    continue: 'Reprendre ta séance',
    exercises: (count: number) => plural(count, 'exercice', 'exercices'),
    setsDone: (count: number) => plural(count, 'série faite', 'séries faites'),
    justStarted: 'tout juste commencée',
    openFor: (hours: number) => `ouverte depuis ${plural(hours, 'heure', 'heures')}`,
    minutesIn: (minutes: number) => `depuis ${String(minutes)} min`,
    hoursIn: (hours: number, minutes: number) => `depuis ${String(hours)} h ${String(minutes)} min`,
  },
  autoFinish: {
    title: 'Nous avons terminé ta séance',
    closed: (when: string) =>
      `Rien n’a été coché depuis un moment, ta séance de ${when} a donc été fermée pour toi.`,
    closedAt: (when: string, at: string) =>
      `Rien n’a été coché depuis un moment, ta séance de ${when} a donc été fermée à ta dernière série, à ${at}.`,
    allSaved: 'Tout ce que tu as enregistré est sauvegardé.',
    saved: (parts: string) => `Enregistré : ${parts}.`,
    exercises: (count: number) => plural(count, 'exercice', 'exercices'),
    sets: (count: number) => plural(count, 'série', 'séries'),
    bouts: (count: number) => plural(count, 'bloc', 'blocs'),
    minutes: (minutes: number) => `${String(minutes)} min`,
    okay: 'OK',
    see: 'La voir',
  },
  cardio: {
    label: 'Cardio',
    needsBodyweight:
      'Les calories ont besoin de ton poids de corps. Ajoute-le dans Ton profil et elles seront calculées.',
    noBouts: 'Pas encore de blocs. Ajoutes-en un quand tu montes dessus.',
    addBout: 'Ajouter un bloc',
    timeFormat: 'Le temps est en minutes, ou minutes:secondes comme 25:30.',
    notANumber: (field: string) => `${field} n’est pas un nombre.`,
    bout: (number: number) => `Bloc ${String(number)}`,
    boutLabel: (number: number) => `bloc ${String(number)}`,
    time: 'Temps',
    start: 'Démarrer',
    stop: 'Arrêter',
    calories: 'Calories',
    fromMachine: 'De la machine. Efface-le pour utiliser l’estimation.',
    addTime: 'Ajoute le temps pour les estimer, ou saisis ce qu’affiche la machine.',
    estimate: (calories: string, source: string) =>
      `${calories}. ${source} Saisis le chiffre de la machine pour l’utiliser à la place.`,
    undo: (label: string) => `Annuler ${label}`,
    complete: (label: string) => `Valider ${label}`,
    saveWithoutTicking: 'Enregistrer sans cocher',
    fields: {
      distance: (unit: string) => `Distance (${unit})`,
      speed: (unit: string) => `Vitesse (${unit})`,
      incline: 'Inclinaison (%)',
      level: 'Niveau',
      watts: 'Watts moyens',
      floors: 'Étages',
    },
    sources: {
      machine: 'De la machine.',
      treadmill: 'Estimé d’après la vitesse et l’inclinaison.',
      power: 'Estimé d’après les watts.',
      pace: 'Estimé d’après ton allure.',
      stairs: 'Estimé d’après les étages montés.',
      met: (better: string) => `Une estimation grossière d’après le temps seul. ${better}`,
    },
    better: {
      treadmill: 'Ajoute la vitesse pour une meilleure estimation.',
      bike: 'Ajoute les watts pour une meilleure estimation.',
      rower: 'Ajoute la distance ou les watts pour une meilleure estimation.',
      ski_erg: 'Ajoute la distance ou les watts pour une meilleure estimation.',
      stair_climber: 'Ajoute les étages pour une meilleure estimation.',
    },
    floors: (count: number) => `${String(count)} étages`,
    nothing: 'Rien d’enregistré',
  },
  gym: {
    change: (name: string | null) => `${name ?? 'Aucune salle choisie'}, changer de salle`,
    choose: 'Choisir une salle',
    where: 'Où t’entraînes-tu ?',
    which: 'Quelle salle',
    compared:
      'Les machines et poulies sont comparées à leur propre historique dans chaque salle. Les séries pas encore faites passent aux chiffres de la nouvelle salle.',
    manage: 'Gérer les salles',
  },
  startDialog: {
    title: 'Démarrer une séance',
    routines: 'Tes routines',
    chooseRoutine: 'Choisir une routine',
    loading: 'Chargement des routines…',
    none: 'Pas encore de routines. Termine une séance et enregistre-la comme routine pour la retrouver ici la prochaine fois.',
    settingUp: 'Préparation…',
    blank: 'Démarrer une séance vide',
    dontShow: 'Ne plus afficher',
    dontShowHint: 'Toujours démarrer une séance vide. Modifiable dans les réglages.',
    saved: 'Routines enregistrées',
    page: (index: number, total: number) =>
      `Page de routines ${String(index)} sur ${String(total)}`,
    start: (name: string) => `Démarrer ${name}`,
    choosePage: 'Choisir la page de routines',
    showPage: (index: number, total: number) =>
      `Afficher la page de routines ${String(index)} sur ${String(total)}`,
  },
  plates: {
    loaded: (plates: string) => `Une barre chargée avec ${plates} de chaque côté`,
    empty: (bar: string, unit: string) => `Une barre de ${bar} ${unit} à vide`,
    bar: (weight: string, unit: string) => `Barre de ${weight} ${unit}`,
    lighter: (bar: string) => `Plus léger qu’une ${lower(bar)}`,
    just: (bar: string) => `Juste la ${lower(bar)}`,
    eachSide: 'De chaque côté',
  },
  previousSet: {
    seconds: (reps: number) => `${String(reps)} s`,
    reps: (reps: number) => `${String(reps)} rép.`,
  },
};
