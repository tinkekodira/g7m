import type { Messages } from '../en/index.js';

export const library: Messages['library'] = {
  addExercise: 'Ajouter un exercice',
  exercises: 'Exercices',
  superset: 'Superset',
  supersetOn: 'Choisis dans l’ordre de la séance.',
  supersetOff: 'Enchaînés, puis repos.',
  search: 'Rechercher',
  searchPlaceholder: 'Squat, couché, rowing…',
  equipment: 'Matériel',
  selected: (count: number) => ` · ${String(count)} sélectionnés`,
  equipmentHint:
    'Sans sélection, tout s’affiche. Avec une sélection, seulement ce que tu peux faire avec exactement ce matériel : chaque élément dont un exercice a besoin doit être coché.',
  count: (count: number) => (count === 1 ? '1 exercice' : `${String(count)} exercices`),
  bestMatches: 'Meilleurs résultats d’abord',
  mostUsed: 'Les plus utilisés d’abord · 90 derniers jours',
  chartKey:
    'Charge par séance · 6 dernières séances. Meilleure série de travail ; + lest, − assistance, PdC poids de corps.',
  confirm: (count: number) => `Confirmer (${String(count)})`,
  cardio: 'Cardio',
  compound: 'Polyarticulaire',
  isolation: 'Isolation',
  recommended: 'Recommandé',
  noneOnDevice:
    'Aucun exercice sur cet appareil pour l’instant. Ils arrivent avec la première synchronisation : ouvre l’app une fois avec une connexion et ils restent pour de bon.',
  noMatch: 'Rien ne correspond à tous ces filtres.',
  clearFilters: 'Effacer les filtres',
  muscleFilters: 'Filtres musculaires',
  all: 'Tous',
  favourite: 'Favori',
  favouriteMark: '(favori)',
  kit: {
    label: 'Avec quoi tu t’entraînes',
    bodyweight: 'Poids du corps',
    both: 'Tout',
    gym: 'Salle',
  },
  stepper: {
    decrease: (label: string) => `Diminuer ${label}`,
    increase: (label: string) => `Augmenter ${label}`,
  },
  detail: {
    missing: (slug: string) =>
      `Aucun exercice nommé ${slug} sur cet appareil. Il a peut-être été renommé, ou il n’est pas encore synchronisé.`,
    unknownMuscle: 'Muscle inconnu',
    roles: { primary: 'Moteur principal', secondary: 'Assiste', stabilizer: 'Stabilise' },
    alsoCalled: (aliases: string) => `Aussi appelé ${aliases}`,
    difficulty: { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' },
    oneSide: 'Un côté à la fois',
    timed: 'Tenu dans le temps',
    startingPoint: 'Point de départ',
    seconds: ' s',
    suggestedHold: 'Maintien conseillé',
    suggestedReps: 'Répétitions conseillées',
    rest: 'Repos entre les séries',
    restCompound: 'Plus long : c’est un polyarticulaire',
    restIsolation: 'Plus court : c’est un exercice d’isolation',
    restMinutes: (minutes: number) => `${String(minutes)} min`,
    restSeconds: (seconds: number) => `${String(seconds)} s`,
    cues: 'Repères',
    muscles: 'Muscles travaillés',
    cardioMuscles:
      'Le cardio sollicite le cœur et les poumons plus qu’un muscle en particulier, il n’est donc pas compté sur la carte du corps : vingt minutes sur une machine ne valent pas vingt séries de quoi que ce soit.',
    notRecorded: 'Non renseigné pour cet exercice.',
    howTo: 'Comment le faire',
    mistakes: 'Erreurs fréquentes',
    recentWeights: 'Vos charges récentes',
    equipment: 'Matériel',
    noEquipment: 'Rien du tout.',
    whatYouLog: 'Ce que tu enregistres',
    logged: (fields: string) =>
      `${fields} Les calories sont estimées à partir de ça et de ton poids, ou tu peux saisir le chiffre de la machine.`,
    itsTime: 'sa durée',
    eachBout: (fields: readonly string[]) => {
      const spoken =
        fields.length === 1
          ? fields[0]
          : `${fields.slice(0, -1).join(', ')} et ${fields.at(-1) ?? ''}`;
      return `Chaque bloc enregistre ${spoken ?? ''}.`;
    },
    video: 'Vidéo',
    videoNeedsConnection: 'Nécessite une connexion. Tout ce qui est au-dessus de cette ligne, non.',
    oneRepMax: 'Ton 1RM estimé',
    on: (set: string, date: string) => `${set} le ${date}`,
    nothingRecent: (weeks: number, source: string) =>
      `Rien sur les ${String(weeks)} dernières semaines, c’est donc ton meilleur de tous les temps, de ${source}.`,
    from: (source: string) => `De ${source}.`,
    bodyweightIncluded: ' Ton poids de corps est inclus.',
    bestEver: (estimate: string, source: string) =>
      `Meilleur de tous les temps : ${estimate}, de ${source}.`,
    epley:
      'Calculé avec la formule d’Epley à partir de ta meilleure série de 12 répétitions ou moins. Une estimation pour choisir tes charges de travail, pas un chiffre à aller tester.',
    seeTrend: 'Voir l’évolution',
    playDemo: 'Lire la démonstration',
    pauseDemo: 'Mettre la démonstration en pause',
    musclesLabel: (muscles: string) => `Muscles travaillés : ${muscles}. Vues de face et de dos.`,
    front: 'Face',
    back: 'Dos',
  },
  learn: {
    title: 'Apprendre',
    modes: { explore: 'Explorer', heatmap: 'Ce que j’ai travaillé' },
    heatmapIntro: (weeks: number) => `Ce que tu as travaillé sur ${String(weeks)} semaines.`,
    exploreIntro: 'Touche un muscle pour voir ce qui le travaille.',
    plates: 'Disques',
    noMuscles:
      'Aucun muscle sur cet appareil pour l’instant, donc rien n’est touchable sur le modèle. Ils arrivent avec la première synchronisation : ouvre l’app une fois avec une connexion et ils restent pour de bon.',
    bodyView: 'Vue du corps',
    hint: 'Fais glisser pour tourner. Touche un muscle.',
    chooseMuscle: 'Choisir un muscle',
    muscleExercises: 'Exercices du muscle',
    explore: 'Explorer les muscles',
    exploreHint: 'Touche le corps ou choisis un muscle pour trouver des exercices.',
    browseAll: 'Parcourir tous les exercices',
    worthAdding: 'À ajouter',
    lastWeeks: (weeks: number) => `${String(weeks)} dernières semaines`,
    worthAddingHint:
      'Les groupes les plus en retard sur leur objectif hebdomadaire, et un exercice pour chacun.',
    behind: (group: string, sets: number) => `${group} · ${String(sets)} séries de retard`,
    working: 'Calcul de ce que tu as travaillé…',
    heatNote:
      'La couleur indique le volume par rapport à ton muscle le plus travaillé : ce que tu as le plus entraîné, pas si c’était suffisant.',
    heatEmpty:
      'Rien d’enregistré sur les quatre dernières semaines. Termine une séance et elle apparaîtra ici.',
    placeholderModel:
      'La figure est générée à partir des origines et insertions : le modèle anatomique sous licence n’est pas dans cette version. Tout le reste de cet écran est réel.',
    sculptedModel: 'Un corps sculpté, découpé entre les muscles qui affleurent sous la peau.',
    notInCatalogue: 'Ce muscle n’est pas encore dans le catalogue de cet appareil.',
    clear: 'Effacer',
    nothingTrains: 'Rien dans le catalogue ne le travaille pour l’instant.',
    alsoWorked: 'Aussi travaillés',
    alsoWorkedHint: 'Travaillé ici comme muscle d’appoint plutôt que principal.',
  },
  plates: {
    title: 'Calculateur de disques',
    intro: 'Ce qui va de chaque côté, dans les tailles que tu connais.',
    weightOnBar: 'Charge sur la barre',
    ezWeighs: 'La barre EZ de cette salle pèse',
    hidden: (count: number) =>
      `${count === 1 ? 'Un disque est masqué' : `${String(count)} disques sont masqués`} car ta salle ne ${count === 1 ? 'l’a' : 'les a'} pas.`,
    bar: 'Barre',
    ezBar: 'Barre EZ',
    tooMuch:
      'C’est plus que ce que le manchon de cette barre peut porter. Essaie moins de disques, une charge plus légère ou une barre plus longue.',
    justBar: (weight: string, unit: string) => `Juste la barre : ${weight} ${unit}, rien dessus.`,
    lighter: (weight: string, unit: string) =>
      `Plus léger que la barre seule, qui pèse ${weight} ${unit}.`,
    eachEnd: 'De chaque côté',
    onBar: (weight: string, unit: string) => `sur une barre de ${weight} ${unit}`,
    closest: (total: string, short: string, unit: string) =>
      ` : le plus proche possible avec ces disques est ${total} ${unit}, soit ${short} ${unit} de moins`,
    colours: 'Les couleurs',
    coloursHint: 'Quel disque est lequel, sur la barre et sur le rack.',
    available: 'Disques disponibles',
    availableHint:
      'Les disques de cette salle. Un disque désélectionné est retiré de la barre, du calcul et des couleurs ci-dessus.',
  },
};
