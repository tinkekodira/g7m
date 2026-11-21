import type { Messages } from '../en/index.js';

type Stat = 'workouts' | 'lifted' | 'sets' | 'minutes';
type Period = 'week' | 'month';

const STAT: Record<Stat, string> = {
  workouts: 'Trainings',
  lifted: 'Gewicht',
  sets: 'Sätze',
  minutes: 'Zeit',
};
const WHEN: Record<Period, string> = { week: 'diese Woche', month: 'diesen Monat' };
const summary = (improved: boolean, period: Period): Record<Stat, string> => ({
  workouts: `${improved ? 'Am meisten verbessert: ' : 'Meiste '}${STAT.workouts} ${WHEN[period]}`,
  lifted: `${improved ? 'Am meisten verbessert: ' : 'Meistes '}${STAT.lifted} ${WHEN[period]}`,
  sets: `${improved ? 'Am meisten verbessert: ' : 'Meiste '}${STAT.sets} ${WHEN[period]}`,
  minutes: `${improved ? 'Am meisten verbessert: ' : 'Meiste '}${STAT.minutes} ${WHEN[period]}`,
});

export const friends: Messages['friends'] = {
  title: 'Freunde',
  nameless: 'Dein Freund',
  you: 'Du',
  unknownExercise: 'Unbekannte Übung',
  didNotGoThrough: 'Das hat nicht geklappt.',
  didNotSave: 'Das wurde nicht gespeichert. Versuche es erneut.',
  couldNotLoad: 'Konnte nicht geladen werden.',
  addFriend: 'Freund hinzufügen',
  profileUnavailable: 'Dein Profil ist nicht verfügbar. Öffne dein Profil und versuche es erneut.',
  resultDismissed: 'Dieses Ergebnis wurde bereits ausgeblendet.',
  challengeHint:
    'Fordere einen Freund zu einer Woche heraus: Öffne seine Seite und wähle eine Kategorie.',
  tabs: {
    friends: 'Freunde',
    leaderboard: 'Bestenliste',
    requests: 'Anfragen',
    waiting: ' wartend',
  },
  empty: {
    eyebrow: 'Freunde',
    title: 'Mit Freunden trainieren',
    body: 'Teile deinen Code mit jemandem, mit dem du trainierst. Sobald ihr euch hinzugefügt habt, seht ihr hier eure Woche, Bestwerte und Trainings.',
  },
  card: {
    levelShort: (level: number) => `Lv ${String(level)}`,
    level: (level: number) => `Level ${String(level)}`,
    workingOut: 'Trainiert gerade',
    notSharing: 'Teilt sein Training nicht',
    lastWorkout: 'Letztes Training',
    bestLifts: 'Bestwerte',
    noLifts: 'Noch keine Übungen eingetragen',
    thisWeek: 'Diese Woche',
    today: ' (heute)',
    streak: 'Serie: ',
    notLogged: (label: string, who: string) => `${label}: ${who} hat das noch nicht eingetragen`,
    youNotLogged: (label: string, who: string, theirs: string) =>
      `${label}: ${who} ${theirs}; du hast das noch nicht eingetragen`,
    levelWithYou: (label: string, who: string, theirs: string) =>
      `${label}: ${who} ${theirs}, gleichauf mit dir`,
    youAhead: (label: string, who: string, theirs: string, gap: string) =>
      `${label}: ${who} ${theirs}, du liegst ${gap} vorn`,
    youBehind: (label: string, who: string, theirs: string, gap: string) =>
      `${label}: ${who} ${theirs}, du liegst ${gap} zurück`,
  },
  status: {
    label: 'Meinen Trainingsstatus teilen',
    description: 'Freunde sehen, wann du trainierst.',
  },
  when: {
    justNow: 'Gerade eben',
    minutesAgo: (minutes: number) => `vor ${String(minutes)} Min.`,
    hoursAgo: (hours: number) => `vor ${String(hours)} Std.`,
  },
  requests: {
    none: 'Keine Anfragen offen. Wenn dich jemand mit deinem Code hinzufügt oder herausfordert, erscheint es hier zum Annehmen.',
    accept: 'Annehmen',
    decline: 'Ablehnen',
    acceptLabel: (name: string) => `${name} annehmen`,
    declineLabel: (name: string) => `${name} ablehnen`,
  },
  code: {
    yours: 'Dein Code',
    yoursLabel: (spelled: string) => `Dein Code: ${spelled}`,
    copy: 'Kopieren',
    share: 'Teilen',
    copied: 'Kopiert.',
    copiedToPaste: 'Kopiert, bereit zum Einfügen.',
    couldNotCopy: (code: string) => `Kopieren nicht möglich. Dein Code ist ${code}.`,
    couldNotShare: (code: string) => `Teilen nicht möglich. Dein Code ist ${code}.`,
    shareTitle: 'g7m-Freundescode',
    shareText: (code: string) => `Füg mich bei g7m hinzu: Mein Freundescode ist ${code}`,
    theirs: 'Sein Code',
    sending: 'Wird gesendet…',
    send: 'Anfrage senden',
    typeFirst: 'Gib zuerst den Code deines Freundes ein.',
    shape: 'Ein Freundescode besteht aus sechs Buchstaben und Zahlen.',
    characters:
      'Freundescodes verwenden nie 0, O, 1, I oder L. Prüfe den Code und versuche es erneut.',
    sent: 'Anfrage gesendet.',
    sentTo: (who: string) => `Anfrage an ${who} gesendet.`,
    nowFriends: (who: string | null) =>
      who === null
        ? 'Die Person hatte dich schon angefragt, ihr seid jetzt befreundet.'
        : `${who} hatte dich schon angefragt, ihr seid jetzt befreundet.`,
    ownCode: 'Das ist dein eigener Code.',
    unknown: 'Niemand hat diesen Code. Prüfe ihn und versuche es erneut.',
    alreadyFriends: (who: string | null) =>
      who === null ? 'Ihr seid bereits befreundet.' : `Du bist bereits mit ${who} befreundet.`,
    alreadyRequested: (who: string | null) =>
      who === null
        ? 'Du hast bereits eine Anfrage gesendet.'
        : `Du hast ${who} bereits eine Anfrage gesendet.`,
    tooMany: 'Das sind viele Anfragen in einer Stunde. Versuche es später erneut.',
  },
  reference: {
    seconds: (who: string, reps: string) => `${who}: ${reps} s`,
    reps: (who: string, reps: string) => `${who}: ${reps} Wdh.`,
    assisted: (who: string, reps: string, weight: string) =>
      `${who}: ${reps} × ${weight} Unterstützung`,
  },
  offline: {
    title: 'Du bist offline',
    body: 'Freunde brauchen eine Verbindung. Dein eigenes Training ist komplett hier, und das hier füllt sich, sobald du wieder online bist.',
  },
  name: {
    missingProfile:
      'Dein Profil ist noch nicht auf diesem Handy angekommen. Warte einen Moment und versuche es erneut.',
    title: 'Wie sollen deine Freunde dich nennen?',
    body: 'Freunde sehen deinen Namen neben deinem Training. Du kannst ihn später in deinem Profil ändern.',
    label: 'Dein Name',
  },
  page: {
    notSharing: 'Teilt sein Training gerade nicht oder ist nicht mehr in deiner Freundesliste.',
    headToHead: 'Direktvergleich',
    nothingToCompare:
      'Noch nichts zu vergleichen. Sobald ihr beide dieselbe Übung eingetragen habt, erscheint sie hier.',
    exercise: 'Übung',
    youAhead: (gap: string) => `Du liegst ${gap} vorn`,
    theyAhead: (who: string, gap: string) => `${who} liegt ${gap} vorn`,
    level: 'Gleichauf',
    recent: 'Letzte Trainings',
    noRecent: 'Noch keine abgeschlossenen Trainings.',
    achievementsPending: (name: string) =>
      `Erscheint, sobald ${name} die App das nächste Mal öffnet`,
    noneEarned: 'Noch keine verdient',
    earnedOf: (earned: number, total: number) => `${String(earned)} von ${String(total)} verdient`,
    training: (name: string) => `Training von ${name}`,
    lastWeeks: (weeks: number) => `Die letzten ${String(weeks)} Wochen, auf dem Körper.`,
    nothingLogged: (weeks: number) => `In den letzten ${String(weeks)} Wochen nichts eingetragen.`,
    bestsDescription: (name: string) =>
      `Das Schwerste, was ${name} bei jeder Übung bewegt hat. Körpergewichtsübungen sind ausgenommen: das Körpergewicht bleibt privat.`,
    routines: 'Routinen',
    noRoutines: 'Noch keine Routinen gespeichert.',
    showFewer: 'Weniger anzeigen',
    showAll: (count: number) => `Alle ${String(count)} anzeigen`,
    confirmRemove: (name: string) =>
      `${name} aus deinen Freunden entfernen? Es wird nicht mitgeteilt.`,
    moreOptions: 'Weitere Optionen',
    remove: 'Freund entfernen',
    exercises: (count: number) => (count === 1 ? '1 Übung' : `${String(count)} Übungen`),
  },
  session: {
    gone: 'Dieses Training wird nicht mehr mit dir geteilt.',
    label: (friend: string) => `Training von ${friend}, Profil von ${friend} öffnen`,
    whose: (friend: string) => `Training von ${friend}`,
    fromDevice: 'Auf diesem Handy gespeichert, vom letzten Öffnen.',
    settingUp: 'Wird vorbereitet…',
    doIt: 'Dieses Training machen',
    finishFirst: 'Beende das offene Training, bevor du dieses startest.',
    openIt: 'Öffnen',
    explain:
      'Die Übungen und Sätze, mit deinen eigenen Gewichten vom letzten Mal. Die Werte deines Freundes stehen als Orientierung neben jeder Übung.',
  },
  routine: {
    gone: 'Diese Routine wird nicht mehr mit dir geteilt.',
    label: (name: string) => `Routine von ${name}, Profil von ${name} öffnen`,
    whose: (name: string) => `Routine von ${name}`,
    doIt: 'Diese Routine machen',
    explain:
      'Die Übungen, Sätze und Wiederholungsbereiche, mit deinen eigenen Gewichten vom letzten Mal.',
    empty: 'Noch leer.',
    superset: 'Supersatz',
  },
  board: {
    label: 'Bestenliste',
    rankBy: 'Rangfolge nach',
    stat: 'Kategorie',
    period: 'Zeitraum',
    done: 'Fertig',
    change: 'Ändern',
    nobody: 'Noch niemand zum Messen',
    nobodyBody:
      'Sobald dich ein Freund hinzufügt, siehst du, wer diese Woche und diesen Monat am meisten trainiert hat.',
    stats: { workouts: 'Trainings', lifted: 'Gewicht', sets: 'Sätze', minutes: 'Zeit' },
    rankings: { most: 'Am meisten', improved: 'Am meisten verbessert' },
    periods: { week: 'Diese Woche', month: 'Dieser Monat' },
    summary: {
      most: { week: summary(false, 'week'), month: summary(false, 'month') },
      improved: { week: summary(true, 'week'), month: summary(true, 'month') },
    },
    workouts: (count: string, n: number) => (n === 1 ? '1 Training' : `${count} Trainings`),
    sets: (count: string, n: number) => (n === 1 ? '1 Satz' : `${count} Sätze`),
    ofTraining: (time: string) => `${time} Training`,
    lifted: (amount: string) => `${amount} bewegt`,
    behind: (amount: string, who: string) => `${amount} hinter ${who}`,
    levelWith: (who: string) => `Gleichauf mit ${who}`,
    ahead: (amount: string, who: string) => `${amount} vor ${who}`,
    ordinal: (rank: number): string => `${String(rank)}.`,
    lastDay: 'Letzter Tag',
    daysLeft: (days: number) => `Noch ${String(days)} Tage`,
    crowned: (improved: boolean, period: 'week' | 'month') =>
      `${improved ? 'Am meisten verbessert' : 'Gewonnen'} ${period === 'week' ? 'letzte Woche' : 'letzten Monat'}`,
    nothingYetToMeasure: 'Noch nichts zum Vergleichen',
    ofUsual: (score: number) => `${String(score)} % vom Üblichen`,
    rowNew: (name: string) => `${name}: neu`,
    rowNewWhy: (name: string, period: 'week' | 'month') =>
      `${name}: neu, nichts in den vier Wochen vor ${period === 'week' ? 'dieser Woche' : 'diesem Monat'} zum Vergleichen`,
    rowNothing: (name: string) => `${name}: noch nichts`,
    rowPlaced: (place: string, name: string, score: string) => `${place} ${name}: ${score}`,
    moved: (up: boolean, by: number) =>
      `Seit gestern ${String(by)} ${by === 1 ? 'Platz' : 'Plätze'} ${up ? 'nach oben' : 'nach unten'}`,
    new: 'Neu',
    usualWeek:
      '100 % ist eine übliche Woche: ein Viertel dessen, was jede Person in den vier Wochen davor gemacht hat.',
    usualMonth:
      '100 % ist ein üblicher Monat: was jede Person in den vier Wochen davor gemacht hat, auf die Länge des Monats gestreckt.',
    weightCounts:
      'Gewicht × Wiederholungen bei Arbeitssätzen. Bei Körpergewichtsübungen wie Klimmzügen und Dips zählt nur das Zusatzgewicht.',
    oneNotSharing: (name: string) =>
      `${name} teilt sein Training nicht und steht daher nicht auf der Liste.`,
    manyNotSharing: (count: number) =>
      `${String(count)} Freunde teilen ihr Training nicht und stehen daher nicht auf der Liste.`,
    noPlace: 'Noch kein Platz',
    yourPlace: (rank: number) => `Du bist auf Platz ${String(rank)}`,
  },
  challenge: {
    title: {
      most: {
        workouts: 'Meiste Trainings',
        lifted: 'Meistes bewegtes Gewicht',
        sets: 'Meiste Sätze',
        minutes: 'Meiste Trainingszeit',
      },
      improved: {
        workouts: 'Am meisten verbessert: Trainings',
        lifted: 'Am meisten verbessert: bewegtes Gewicht',
        sets: 'Am meisten verbessert: Sätze',
        minutes: 'Am meisten verbessert: Trainingszeit',
      },
    },
    metric: {
      workouts: 'Trainings',
      lifted: 'bewegtes Gewicht',
      sets: 'Sätze',
      minutes: 'Trainingszeit',
    },
    ofUsual: '% vom Üblichen',
    underAnHour: 'Weniger als eine Stunde übrig',
    hoursLeft: (hours: number) => (hours === 1 ? 'Noch 1 Stunde' : `Noch ${String(hours)} Stunden`),
    daysLeft: (days: number) => `Noch ${String(days)} Tage`,
    against: (title: string, name: string) => `${title}, gegen ${name}`,
    sent: (when: string) => `Gesendet ${when}`,
    ended: (when: string) => `Beendet ${when}`,
    waiting: (name: string) => `Wartet darauf, dass ${name} annimmt`,
    challengedYou: (name: string) =>
      `${name} hat dich herausgefordert. Sieben Tage, ab dem Annehmen.`,
    youWon: 'Du hast gewonnen',
    theyWon: (name: string) => `${name} hat gewonnen`,
    draw: 'Unentschieden',
    unavailable: 'Ergebnis nicht verfügbar',
    finalizing: 'Ergebnis wird ermittelt',
    sharingOff:
      'Das Teilen des Trainings ist aus, daher kann diese Herausforderung nicht gewertet werden.',
    finalizingNote:
      'Wir warten 24 Stunden, damit Offline-Trainings synchronisiert werden. Dann steht das Ergebnis fest.',
    recovered: 'Wiederhergestelltes Ergebnis · basiert auf verfügbarem Training',
    excluded:
      'Beim Festschreiben war das Training nicht verfügbar. Dieses Ergebnis zählt nicht zu deiner Bilanz.',
    gotIt: 'Verstanden',
    accept: 'Annehmen',
    decline: 'Ablehnen',
    acceptLabel: (name: string) => `Herausforderung von ${name} annehmen`,
    declineLabel: (name: string) => `Herausforderung von ${name} ablehnen`,
    takeBackLabel: (name: string) => `Deine Herausforderung an ${name} zurückziehen`,
    takeBack: 'Zurückziehen',
    resultUnchanged:
      'Beim Festschreiben war das Training nicht verfügbar. Deine Bilanz bleibt unverändert.',
    resultOf: (i: number, n: number) => `Ergebnis ${String(i)} von ${String(n)}`,
    view: 'Herausforderung ansehen',
    nextResult: 'Nächstes Ergebnis',
    later: 'Später',
    resultAgainst: (title: string, name: string) => `${title} gegen ${name}`,
    heading: 'Herausforderungen',
    challenge: (name: string) => `${name} herausfordern`,
    fromAccept: (name: string) => `Sieben Tage, ab dem Annehmen durch ${name}.`,
    explainImproved:
      'Sieben Tage, jeder gegen die eigenen letzten vier Wochen – fair, egal wer mehr trainiert.',
    explainMost: 'Sieben Tage. Wer am meisten macht, gewinnt.',
    send: 'Herausforderung senden',
    startsWhen: (name: string) => `Beginnt, wenn ${name} annimmt.`,
    problems: {
      already_live: (name: string) =>
        `Du hast schon eine Herausforderung mit ${name}. Eine nach der anderen.`,
      not_sharing: (name: string) =>
        `${name} teilt sein Training nicht, daher kann eine Herausforderung nicht gewertet werden.`,
      you_not_sharing: (_name: string) =>
        'Schalte in den Einstellungen das Teilen deines Trainings ein, um an Herausforderungen teilzunehmen.',
      no_usual: (name: string) =>
        `${name} hat in den letzten vier Wochen keine Trainings zum Vergleichen. Versuch stattdessen „Am meisten“.`,
      you_no_usual: (_name: string) =>
        'Du hast in den letzten vier Wochen keine Trainings zum Vergleichen. Versuch stattdessen „Am meisten“.',
      not_friends: (name: string) => `${name} ist nicht mehr in deiner Freundesliste.`,
      not_found: (_name: string) => 'Diese Herausforderung gibt es nicht mehr.',
      too_many: (_name: string) =>
        'Zu viele Herausforderungen gesendet. Versuche es später erneut.',
      invalid: (_name: string) =>
        'Mit dieser Herausforderung stimmte etwas nicht. Versuche es erneut.',
    },
  },
};
