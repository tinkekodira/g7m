import type { Messages } from '../en/index.js';

export const library: Messages['library'] = {
  addExercise: 'Übung hinzufügen',
  exercises: 'Übungen',
  superset: 'Supersatz',
  supersetOn: 'In der Reihenfolge des Trainings wählen.',
  supersetOff: 'Direkt hintereinander, dann Pause.',
  search: 'Suchen',
  searchPlaceholder: 'Kniebeuge, Bankdrücken, Rudern…',
  equipment: 'Ausrüstung',
  selected: (count: number) => ` · ${String(count)} ausgewählt`,
  equipmentHint:
    'Ohne Auswahl wird alles angezeigt. Mit Auswahl nur, was du mit genau diesen Geräten machen kannst – jedes Teil, das eine Übung braucht, muss angehakt sein.',
  count: (count: number) => (count === 1 ? '1 Übung' : `${String(count)} Übungen`),
  bestMatches: 'Beste Treffer zuerst',
  mostUsed: 'Am häufigsten genutzt zuerst · Letzte 90 Tage',
  chartKey:
    'Gewicht pro Training · Letzte 6 Einheiten. Bester Arbeitssatz; + Zusatz, − Unterstützung, KG Körpergewicht.',
  confirm: (count: number) => `Bestätigen (${String(count)})`,
  cardio: 'Cardio',
  compound: 'Grundübung',
  isolation: 'Isolation',
  recommended: 'Empfohlen',
  noneOnDevice:
    'Noch keine Übungen auf diesem Gerät. Sie kommen mit der ersten Synchronisierung – öffne die App einmal mit Verbindung, danach bleiben sie dauerhaft.',
  noMatch: 'Nichts passt zu all diesen Filtern.',
  clearFilters: 'Filter zurücksetzen',
  muscleFilters: 'Muskelfilter',
  all: 'Alle',
  favourite: 'Favorit',
  favouriteMark: '(Favorit)',
  kit: {
    label: 'Womit du trainierst',
    bodyweight: 'Körpergewicht',
    both: 'Alles',
    gym: 'Studio',
  },
  stepper: {
    decrease: (label: string) => `${label} verringern`,
    increase: (label: string) => `${label} erhöhen`,
  },
  detail: {
    missing: (slug: string) =>
      `Auf diesem Gerät gibt es keine Übung namens ${slug}. Vielleicht wurde sie umbenannt oder noch nicht synchronisiert.`,
    unknownMuscle: 'Unbekannter Muskel',
    roles: { primary: 'Hauptmuskel', secondary: 'Unterstützt', stabilizer: 'Stabilisiert' },
    alsoCalled: (aliases: string) => `Auch genannt: ${aliases}`,
    difficulty: { beginner: 'Einsteiger', intermediate: 'Fortgeschritten', advanced: 'Profi' },
    oneSide: 'Eine Seite nach der anderen',
    timed: 'Auf Zeit gehalten',
    startingPoint: 'Ausgangspunkt',
    seconds: ' s',
    suggestedHold: 'Empfohlene Haltezeit',
    suggestedReps: 'Empfohlene Wiederholungen',
    rest: 'Pause zwischen den Sätzen',
    restCompound: 'Länger – es ist eine Grundübung',
    restIsolation: 'Kürzer – es ist eine Isolationsübung',
    restMinutes: (minutes: number) => `${String(minutes)} Min.`,
    restSeconds: (seconds: number) => `${String(seconds)} s`,
    cues: 'Hinweise',
    muscles: 'Beanspruchte Muskeln',
    cardioMuscles:
      'Cardio fordert Herz und Lunge mehr als einen einzelnen Muskel, daher zählt es nicht auf der Körperkarte – zwanzig Minuten an einem Gerät sind keine zwanzig Sätze von irgendetwas.',
    notRecorded: 'Für diese Übung nicht erfasst.',
    howTo: 'So geht’s',
    mistakes: 'Häufige Fehler',
    recentWeights: 'Deine letzten Gewichte',
    equipment: 'Ausrüstung',
    noEquipment: 'Gar nichts.',
    whatYouLog: 'Was du einträgst',
    logged: (fields: string) =>
      `${fields} Die Kalorien werden daraus und aus deinem Körpergewicht geschätzt, oder du gibst den Wert des Geräts ein.`,
    itsTime: 'die Zeit',
    eachBout: (fields: readonly string[]) => {
      const spoken =
        fields.length === 1
          ? fields[0]
          : `${fields.slice(0, -1).join(', ')} und ${fields.at(-1) ?? ''}`;
      return `Jede Einheit erfasst ${spoken ?? ''}.`;
    },
    video: 'Video',
    videoNeedsConnection: 'Braucht eine Verbindung. Alles oberhalb dieser Linie nicht.',
    oneRepMax: 'Dein geschätztes 1RM',
    on: (set: string, date: string) => `${set} am ${date}`,
    nothingRecent: (weeks: number, source: string) =>
      `Nichts in den letzten ${String(weeks)} Wochen, daher ist das dein Bestwert aller Zeiten, aus ${source}.`,
    from: (source: string) => `Aus ${source}.`,
    bodyweightIncluded: ' Dein Körpergewicht ist eingerechnet.',
    bestEver: (estimate: string, source: string) => `Bestwert: ${estimate}, aus ${source}.`,
    epley:
      'Mit der Epley-Formel aus deinem besten Satz mit höchstens 12 Wiederholungen berechnet. Eine Schätzung zur Wahl der Arbeitsgewichte, kein Wert zum Austesten.',
    seeTrend: 'Verlauf ansehen',
    playDemo: 'Vorführung abspielen',
    pauseDemo: 'Vorführung pausieren',
    musclesLabel: (muscles: string) =>
      `Beanspruchte Muskeln: ${muscles}. Ansicht von vorne und hinten.`,
    front: 'Vorne',
    back: 'Hinten',
  },
  learn: {
    title: 'Lernen',
    modes: { explore: 'Entdecken', heatmap: 'Was ich trainiert habe' },
    heatmapIntro: (weeks: number) => `Was du in ${String(weeks)} Wochen trainiert hast.`,
    exploreIntro: 'Tippe auf einen Muskel, um zu sehen, was ihn trainiert.',
    plates: 'Scheiben',
    noMuscles:
      'Noch keine Muskeln auf diesem Gerät, daher lässt sich am Modell nichts antippen. Sie kommen mit der ersten Synchronisierung – öffne die App einmal mit Verbindung, danach bleiben sie dauerhaft.',
    bodyView: 'Körperansicht',
    hint: 'Ziehen zum Drehen. Tippe auf einen Muskel.',
    chooseMuscle: 'Muskel wählen',
    muscleExercises: 'Übungen für den Muskel',
    explore: 'Muskeln entdecken',
    exploreHint: 'Tippe auf den Körper oder wähle einen Muskel, um Übungen zu finden.',
    browseAll: 'Alle Übungen durchsuchen',
    worthAdding: 'Lohnt sich zu ergänzen',
    lastWeeks: (weeks: number) => `Letzte ${String(weeks)} Wochen`,
    worthAddingHint:
      'Die Gruppen, die am weitesten hinter ihrem Wochenziel liegen, und je eine Übung dafür.',
    behind: (group: string, sets: number) => `${group} · ${String(sets)} Sätze im Rückstand`,
    working: 'Wird berechnet, was du trainiert hast…',
    heatNote:
      'Die Farbe zeigt das Volumen im Verhältnis zu deinem meistbeanspruchten Muskel – was du am meisten trainiert hast, nicht ob es genug war.',
    heatEmpty:
      'In den letzten vier Wochen noch nichts eingetragen. Schließe ein Training ab, dann erscheint es hier.',
    placeholderModel:
      'Die Figur wird aus Ursprüngen und Ansätzen erzeugt – das lizenzierte Anatomiemodell ist in diesem Build nicht enthalten. Alles andere auf diesem Bildschirm ist echt.',
    sculptedModel:
      'Ein modellierter Körper, aufgeteilt auf die Muskeln, die bis an die Haut reichen.',
    notInCatalogue: 'Dieser Muskel ist noch nicht im Katalog auf diesem Gerät.',
    clear: 'Zurücksetzen',
    nothingTrains: 'Im Katalog trainiert ihn noch nichts.',
    alsoWorked: 'Ebenfalls beansprucht',
    alsoWorkedHint: 'Hier als unterstützender Muskel beansprucht, nicht als Hauptmuskel.',
  },
  plates: {
    title: 'Scheibenrechner',
    intro: 'Was auf jede Seite kommt, in den Größen, die du kennst.',
    weightOnBar: 'Gewicht auf der Stange',
    ezWeighs: 'Die SZ-Stange in diesem Studio wiegt',
    hidden: (count: number) =>
      `${count === 1 ? 'Eine Scheibe ist' : `${String(count)} Scheiben sind`} ausgeblendet, weil dein Studio ${count === 1 ? 'sie' : 'sie'} nicht hat.`,
    bar: 'Stange',
    ezBar: 'SZ-Stange',
    tooMuch:
      'Das ist mehr, als auf die Hülse dieser Stange passt. Versuche weniger Scheiben, ein leichteres Gewicht oder eine längere Stange.',
    justBar: (weight: string, unit: string) => `Nur die Stange – ${weight} ${unit}, nichts drauf.`,
    lighter: (weight: string, unit: string) =>
      `Leichter als die Stange allein, die ${weight} ${unit} wiegt.`,
    eachEnd: 'Pro Seite',
    onBar: (weight: string, unit: string) => `auf einer ${weight}-${unit}-Stange`,
    closest: (total: string, short: string, unit: string) =>
      ` – mit diesen Scheiben kommst du am nächsten auf ${total} ${unit}, ${short} ${unit} zu wenig`,
    colours: 'Die Farben',
    coloursHint: 'Welche Scheibe welche ist, auf der Stange und im Ständer.',
    available: 'Verfügbare Scheiben',
    availableHint:
      'Welche Scheiben dieses Studio hat. Eine abgewählte Scheibe fehlt auf der Stange, in der Rechnung und bei den Farben oben.',
  },
};
