import type { Messages } from '../en/index.js';

type Stat = 'workouts' | 'lifted' | 'sets' | 'minutes';
type Period = 'week' | 'month';

const STAT: Record<Stat, string> = {
  workouts: 'séances',
  lifted: 'poids',
  sets: 'séries',
  minutes: 'temps',
};
const WHEN: Record<Period, string> = { week: 'cette semaine', month: 'ce mois-ci' };
const summary = (improved: boolean, period: Period): Record<Stat, string> => ({
  workouts: `${improved ? 'Plus grand progrès : ' : 'Le plus de '}${STAT.workouts} ${WHEN[period]}`,
  lifted: `${improved ? 'Plus grand progrès : ' : 'Le plus de '}${STAT.lifted} ${WHEN[period]}`,
  sets: `${improved ? 'Plus grand progrès : ' : 'Le plus de '}${STAT.sets} ${WHEN[period]}`,
  minutes: `${improved ? 'Plus grand progrès : ' : 'Le plus de '}${STAT.minutes} ${WHEN[period]}`,
});

export const friends: Messages['friends'] = {
  title: 'Amis',
  nameless: 'Ton ami',
  you: 'Toi',
  unknownExercise: 'Exercice inconnu',
  didNotGoThrough: 'Ça n’a pas marché.',
  didNotSave: 'Ça n’a pas été enregistré. Réessaie.',
  couldNotLoad: 'Impossible de charger.',
  addFriend: 'Ajouter un ami',
  profileUnavailable: 'Ton profil est indisponible. Ouvre ton profil et réessaie.',
  resultDismissed: 'Ce résultat a déjà été masqué.',
  challengeHint: 'Défie un ami sur une semaine : ouvre sa page et choisis une statistique.',
  tabs: {
    friends: 'Amis',
    leaderboard: 'Classement',
    requests: 'Demandes',
    waiting: ' en attente',
  },
  empty: {
    eyebrow: 'Amis',
    title: 'S’entraîner entre amis',
    body: 'Partage ton code avec quelqu’un avec qui tu t’entraînes. Une fois qu’il t’a ajouté, vous verrez ici vos semaines, records et séances.',
  },
  card: {
    levelShort: (level: number) => `Niv. ${String(level)}`,
    level: (level: number) => `Niveau ${String(level)}`,
    workingOut: 'En séance',
    notSharing: 'Ne partage pas son entraînement',
    lastWorkout: 'Dernière séance',
    bestLifts: 'Records',
    noLifts: 'Aucun exercice enregistré',
    thisWeek: 'Cette semaine',
    today: ' (aujourd’hui)',
    streak: 'Série : ',
    notLogged: (label: string, who: string) => `${label} : ${who} ne l’a pas enregistré`,
    youNotLogged: (label: string, who: string, theirs: string) =>
      `${label} : ${who} ${theirs} ; tu ne l’as pas enregistré`,
    levelWithYou: (label: string, who: string, theirs: string) =>
      `${label} : ${who} ${theirs}, à égalité avec toi`,
    youAhead: (label: string, who: string, theirs: string, gap: string) =>
      `${label} : ${who} ${theirs}, tu as ${gap} d’avance`,
    youBehind: (label: string, who: string, theirs: string, gap: string) =>
      `${label} : ${who} ${theirs}, tu as ${gap} de retard`,
  },
  status: {
    label: 'Partager quand je m’entraîne',
    description: 'Tes amis voient quand tu es en séance.',
  },
  when: {
    justNow: 'À l’instant',
    minutesAgo: (minutes: number) => `Il y a ${String(minutes)} min`,
    hoursAgo: (hours: number) => `Il y a ${String(hours)} h`,
  },
  requests: {
    none: 'Aucune demande en attente. Quand quelqu’un t’ajoute avec ton code ou te lance un défi, ça apparaît ici pour que tu acceptes.',
    accept: 'Accepter',
    decline: 'Refuser',
    acceptLabel: (name: string) => `Accepter ${name}`,
    declineLabel: (name: string) => `Refuser ${name}`,
  },
  code: {
    yours: 'Ton code',
    yoursLabel: (spelled: string) => `Ton code : ${spelled}`,
    copy: 'Copier',
    share: 'Partager',
    copied: 'Copié.',
    copiedToPaste: 'Copié, prêt à coller.',
    couldNotCopy: (code: string) => `Impossible de copier. Ton code est ${code}.`,
    couldNotShare: (code: string) => `Impossible de partager. Ton code est ${code}.`,
    shareTitle: 'Code ami g7m',
    shareText: (code: string) => `Ajoute-moi sur g7m : mon code ami est ${code}`,
    theirs: 'Son code',
    sending: 'Envoi…',
    send: 'Envoyer la demande',
    typeFirst: 'Saisis d’abord le code de ton ami.',
    shape: 'Un code ami contient six lettres et chiffres.',
    characters: 'Les codes amis n’utilisent jamais 0, O, 1, I ni L. Vérifie le code et réessaie.',
    sent: 'Demande envoyée.',
    sentTo: (who: string) => `Demande envoyée à ${who}.`,
    nowFriends: (who: string | null) =>
      who === null
        ? 'Cette personne t’avait déjà demandé, vous êtes donc amis.'
        : `${who} t’avait déjà demandé, vous êtes donc amis.`,
    ownCode: 'C’est ton propre code.',
    unknown: 'Personne n’a ce code. Vérifie-le et réessaie.',
    alreadyFriends: (who: string | null) =>
      who === null ? 'Vous êtes déjà amis.' : `Tu es déjà ami avec ${who}.`,
    alreadyRequested: (who: string | null) =>
      who === null
        ? 'Tu lui as déjà envoyé une demande.'
        : `Tu as déjà envoyé une demande à ${who}.`,
    tooMany: 'Ça fait beaucoup de demandes en une heure. Réessaie plus tard.',
  },
  reference: {
    seconds: (who: string, reps: string) => `${who} : ${reps} s`,
    reps: (who: string, reps: string) => `${who} : ${reps} rép.`,
    assisted: (who: string, reps: string, weight: string) =>
      `${who} : ${reps} × ${weight} d’assistance`,
  },
  offline: {
    title: 'Tu es hors ligne',
    body: 'Les amis nécessitent une connexion. Tout ton entraînement est toujours là, et ceci se remplira dès que tu seras de nouveau en ligne.',
  },
  name: {
    missingProfile:
      'Ton profil n’est pas encore arrivé sur ce téléphone. Patiente un instant et réessaie.',
    title: 'Comment tes amis doivent-ils t’appeler ?',
    body: 'Tes amis voient ton prénom à côté de ton entraînement. Tu pourras le changer plus tard dans Ton profil.',
    label: 'Ton prénom',
  },
  page: {
    notSharing: 'Ne partage pas son entraînement en ce moment, ou n’est plus dans ta liste d’amis.',
    headToHead: 'Face à face',
    nothingToCompare:
      'Rien à comparer pour l’instant. Dès que vous aurez tous les deux enregistré le même exercice, il apparaîtra ici.',
    exercise: 'Exercice',
    youAhead: (gap: string) => `Tu as ${gap} d’avance`,
    theyAhead: (who: string, gap: string) => `${who} a ${gap} d’avance`,
    level: 'Égalité',
    recent: 'Séances récentes',
    noRecent: 'Aucune séance terminée pour l’instant.',
    achievementsPending: (name: string) => `Apparaîtra quand ${name} rouvrira l’app`,
    noneEarned: 'Aucun obtenu',
    earnedOf: (earned: number, total: number) => `${String(earned)} sur ${String(total)} obtenus`,
    training: (name: string) => `Entraînement de ${name}`,
    lastWeeks: (weeks: number) => `Les ${String(weeks)} dernières semaines, sur son corps.`,
    nothingLogged: (weeks: number) =>
      `Rien d’enregistré sur les ${String(weeks)} dernières semaines.`,
    bestsDescription: (name: string) =>
      `Le plus lourd que ${name} a déplacé sur chaque exercice. Les exercices au poids du corps sont exclus : son poids reste privé.`,
    routines: 'Routines',
    noRoutines: 'Aucune routine enregistrée.',
    showFewer: 'Afficher moins',
    showAll: (count: number) => `Tout afficher (${String(count)})`,
    confirmRemove: (name: string) =>
      `Retirer ${name} de tes amis ? Cette personne ne sera pas prévenue.`,
    moreOptions: 'Plus d’options',
    remove: 'Retirer cet ami',
    exercises: (count: number) => (count === 1 ? '1 exercice' : `${String(count)} exercices`),
  },
  session: {
    gone: 'Cette séance n’est plus partagée avec toi.',
    label: (friend: string) => `Séance de ${friend}, ouvrir le profil de ${friend}`,
    whose: (friend: string) => `Séance de ${friend}`,
    fromDevice: 'Enregistrée sur ce téléphone lors de ta dernière ouverture.',
    settingUp: 'Préparation…',
    doIt: 'Faire cette séance',
    finishFirst: 'Termine la séance ouverte avant de commencer celle-ci.',
    openIt: 'L’ouvrir',
    explain:
      'Ses exercices et séries, avec tes propres charges de la dernière fois. Ses chiffres sont affichés à côté de chaque exercice comme repère.',
  },
  routine: {
    gone: 'Cette routine n’est plus partagée avec toi.',
    label: (name: string) => `Routine de ${name}, ouvrir le profil de ${name}`,
    whose: (name: string) => `Routine de ${name}`,
    doIt: 'Faire cette routine',
    explain:
      'Ses exercices, séries et fourchettes de répétitions, avec tes propres charges de la dernière fois.',
    empty: 'Elle est vide pour l’instant.',
    superset: 'Superset',
  },
  board: {
    label: 'Classement',
    rankBy: 'Classer par',
    stat: 'Statistique',
    period: 'Période',
    done: 'Terminé',
    change: 'Changer',
    nobody: 'Personne à affronter pour l’instant',
    nobodyBody:
      'Dès qu’un ami t’ajoute, tu verras qui s’est le plus entraîné cette semaine et ce mois-ci.',
    stats: { workouts: 'Séances', lifted: 'Poids', sets: 'Séries', minutes: 'Temps' },
    rankings: { most: 'Le plus', improved: 'Plus grand progrès' },
    periods: { week: 'Cette semaine', month: 'Ce mois-ci' },
    summary: {
      most: { week: summary(false, 'week'), month: summary(false, 'month') },
      improved: { week: summary(true, 'week'), month: summary(true, 'month') },
    },
    workouts: (count: string, n: number) => (n === 1 ? '1 séance' : `${count} séances`),
    sets: (count: string, n: number) => (n === 1 ? '1 série' : `${count} séries`),
    ofTraining: (time: string) => `${time} d’entraînement`,
    lifted: (amount: string) => `${amount} soulevés`,
    behind: (amount: string, who: string) => `${amount} derrière ${who}`,
    levelWith: (who: string) => `À égalité avec ${who}`,
    ahead: (amount: string, who: string) => `${amount} devant ${who}`,
    ordinal: (rank: number): string => (rank === 1 ? '1er' : `${String(rank)}e`),
    lastDay: 'Dernier jour',
    daysLeft: (days: number) => `Encore ${String(days)} jours`,
    crowned: (improved: boolean, period: 'week' | 'month') =>
      `${improved ? 'Plus grand progrès' : 'Vainqueur'} ${period === 'week' ? 'la semaine dernière' : 'le mois dernier'}`,
    nothingYetToMeasure: 'Rien à comparer pour l’instant',
    ofUsual: (score: number) => `${String(score)} % de l’habitude`,
    rowNew: (name: string) => `${name} : nouveau`,
    rowNewWhy: (name: string, period: 'week' | 'month') =>
      `${name} : nouveau, rien dans les quatre semaines avant ${period === 'week' ? 'cette semaine' : 'ce mois-ci'} pour comparer`,
    rowNothing: (name: string) => `${name} : rien pour l’instant`,
    rowPlaced: (place: string, name: string, score: string) => `${place}, ${name} : ${score}`,
    moved: (up: boolean, by: number) =>
      `${up ? 'Gagne' : 'Perd'} ${String(by)} ${by === 1 ? 'place' : 'places'} depuis hier`,
    new: 'Nouveau',
    usualWeek:
      '100 % correspond à une semaine habituelle : un quart de ce que chacun a fait sur les quatre semaines précédentes.',
    usualMonth:
      '100 % correspond à un mois habituel : ce que chacun a fait sur les quatre semaines précédentes, étendu à la durée du mois.',
    weightCounts:
      'Charge × répétitions sur les séries de travail. Pour les exercices au poids du corps comme les tractions et les dips, seul le lest compte.',
    oneNotSharing: (name: string) =>
      `${name} ne partage pas son entraînement, et n’apparaît donc pas au classement.`,
    manyNotSharing: (count: number) =>
      `${String(count)} amis ne partagent pas leur entraînement, et n’apparaissent donc pas au classement.`,
    noPlace: 'Pas encore classé',
    yourPlace: (rank: number) => `Tu es ${rank === 1 ? '1er' : `${String(rank)}e`}`,
  },
  challenge: {
    title: {
      most: {
        workouts: 'Le plus de séances',
        lifted: 'Le plus de poids soulevé',
        sets: 'Le plus de séries',
        minutes: 'Le plus de temps d’entraînement',
      },
      improved: {
        workouts: 'Plus grand progrès : séances',
        lifted: 'Plus grand progrès : poids soulevé',
        sets: 'Plus grand progrès : séries',
        minutes: 'Plus grand progrès : temps d’entraînement',
      },
    },
    metric: {
      workouts: 'séances',
      lifted: 'poids soulevé',
      sets: 'séries',
      minutes: 'temps d’entraînement',
    },
    ofUsual: '% de l’habitude',
    underAnHour: 'Moins d’une heure restante',
    hoursLeft: (hours: number) =>
      hours === 1 ? 'Encore 1 heure' : `Encore ${String(hours)} heures`,
    daysLeft: (days: number) => `Encore ${String(days)} jours`,
    against: (title: string, name: string) => `${title}, contre ${name}`,
    sent: (when: string) => `Envoyé ${when}`,
    ended: (when: string) => `Terminé ${when}`,
    waiting: (name: string) => `En attente de l’acceptation de ${name}`,
    challengedYou: (name: string) =>
      `${name} t’a lancé un défi. Sept jours, à partir de ton acceptation.`,
    youWon: 'Tu as gagné',
    theyWon: (name: string) => `${name} a gagné`,
    draw: 'Égalité',
    unavailable: 'Résultat indisponible',
    finalizing: 'Résultat en cours de validation',
    sharingOff: 'Le partage de l’entraînement est désactivé, ce défi ne peut donc pas être compté.',
    finalizingNote:
      'On laisse 24 heures aux séances hors ligne pour se synchroniser. Ensuite, les scores sont définitifs.',
    recovered: 'Résultat récupéré · basé sur l’entraînement disponible',
    excluded:
      'L’entraînement n’était pas disponible quand les scores ont été figés. Ce résultat est exclu de ton bilan.',
    gotIt: 'Compris',
    accept: 'Accepter',
    decline: 'Refuser',
    acceptLabel: (name: string) => `Accepter le défi de ${name}`,
    declineLabel: (name: string) => `Refuser le défi de ${name}`,
    takeBackLabel: (name: string) => `Retirer ton défi à ${name}`,
    takeBack: 'Le retirer',
    resultUnchanged:
      'L’entraînement n’était pas disponible quand les scores ont été figés. Ton bilan ne change pas.',
    resultOf: (i: number, n: number) => `Résultat ${String(i)} sur ${String(n)}`,
    view: 'Voir le défi',
    nextResult: 'Résultat suivant',
    later: 'Plus tard',
    resultAgainst: (title: string, name: string) => `${title} contre ${name}`,
    heading: 'Défis',
    challenge: (name: string) => `Défier ${name}`,
    fromAccept: (name: string) => `Sept jours, à partir de l’acceptation de ${name}.`,
    explainImproved:
      'Sept jours, chacun face à ses quatre dernières semaines : c’est équitable, peu importe qui s’entraîne le plus.',
    explainMost: 'Sept jours. Celui qui en fait le plus gagne.',
    send: 'Envoyer le défi',
    startsWhen: (name: string) => `Commence quand ${name} accepte.`,
    problems: {
      already_live: (name: string) => `Tu as déjà un défi avec ${name}. Un à la fois.`,
      not_sharing: (name: string) =>
        `${name} ne partage pas son entraînement, un défi ne peut donc pas être compté.`,
      you_not_sharing: (_name: string) =>
        'Active le partage de ton entraînement dans les réglages pour participer aux défis.',
      no_usual: (name: string) =>
        `${name} n’a aucune séance sur les quatre dernières semaines pour comparer. Essaie plutôt « Le plus ».`,
      you_no_usual: (_name: string) =>
        'Tu n’as aucune séance sur les quatre dernières semaines pour comparer. Essaie plutôt « Le plus ».',
      not_friends: (name: string) => `${name} n’est plus dans ta liste d’amis.`,
      not_found: (_name: string) => 'Ce défi n’existe plus.',
      too_many: (_name: string) => 'Trop de défis envoyés. Réessaie plus tard.',
      invalid: (_name: string) => 'Un problème est survenu avec ce défi. Réessaie.',
    },
  },
};
