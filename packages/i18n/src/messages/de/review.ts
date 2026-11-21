import type { Messages } from '../en/index.js';

const GROUPS: Record<string, string> = {
  chest: 'Brust',
  back: 'Rücken',
  shoulders: 'Schultern',
  biceps: 'Bizeps',
  triceps: 'Trizeps',
  quads: 'Quadrizeps',
  hamstrings: 'Beinbeuger',
  glutes: 'Gesäß',
  calves: 'Waden',
  core: 'Rumpf',
};

const group = (slug: string): string => GROUPS[slug] ?? slug;

export const review: Messages['review'] = {
  card: {
    eyebrow: 'Aus deinem Protokoll',
    title: 'Wie es läuft',
    intro:
      'Gelesen aus dem, was du eingetragen hast – egal ob der Plan es geschrieben hat oder du.',
  },
  mark: {
    seconds: (reps: number) => `${String(reps)} s`,
    reps: (reps: number) => `${String(reps)} ${reps === 1 ? 'Wdh.' : 'Wdh.'}`,
    forSeconds: (reps: number) => ` für ${String(reps)} s`,
    times: (reps: number) => ` × ${String(reps)}`,
    help: (count: string, weight: string) => `${count} mit ${weight} Unterstützung`,
  },
  ago: (days: number) =>
    days < 14
      ? `vor ${String(days)} ${days === 1 ? 'Tag' : 'Tagen'}`
      : `vor ${String(Math.round(days / 7))} Wochen`,
  consistency: {
    heading: 'Du trainierst weniger als geplant',
    detail: (perWeek: number, weeks: number, target: number) =>
      `Etwa ${String(perWeek)} Einheiten pro Woche in den letzten ${String(weeks)} Wochen, statt der ${String(target)}, die du festgelegt hast. Der Plan ist auf ${String(target)} ausgelegt; wenn deine Woche so nicht aussieht, lohnt es sich, die Zahl zu ändern.`,
  },
  groupShort: {
    heading: (slug: string) => `${group(slug)} hinkt hinterher`,
    detail: (perWeek: number, target: number) =>
      `${String(perWeek)} Sätze pro Woche bei einem Ziel von ${String(target)}. Das liegt von allem, was du trainierst, am weitesten zurück – also das Erste, das sich zu ergänzen lohnt.`,
  },
  groupOver: {
    heading: (slug: string) => `Sehr viel ${group(slug)}`,
    detail: (perWeek: number, target: number) =>
      `${String(perWeek)} Sätze pro Woche bei einem Ziel von ${String(target)}. Nicht schädlich, aber ab einem Punkt zahlen sich die zusätzlichen Sätze für die Erholung, die sie kosten, nicht mehr aus.`,
  },
  climbing: {
    heading: (name: string) => `${name}: es geht aufwärts`,
    detail: (from: string, to: string, sessions: number) =>
      `Von ${from} auf ${to} über ${String(sessions)} Einheiten. Genau so soll es laufen.`,
  },
  stalled: {
    heading: (name: string) => `${name}: es tut sich nichts`,
    detail: (best: string, ago: string, sessionsSince: number, advice: string) =>
      `Dein bester Wert zuletzt ist immer noch ${best}, ${ago}, und ${
        sessionsSince === 1
          ? 'die Einheit danach hat ihn nicht übertroffen'
          : `die ${String(sessionsSince)} Einheiten danach haben ihn nicht übertroffen`
      }. ${advice}`,
    backOff:
      'Ein Plateau löst sich meist, wenn man etwa zehn Prozent zurückgeht und neu anläuft – das macht der Plan nach drei schwächeren Einheiten in Folge für dich.',
    yours: (timed: boolean) =>
      `${timed ? 'Eine Halteübung' : 'Eine Körpergewichtsübung'} kommt meist mit einem zusätzlichen Satz oder einer langsameren, härteren Ausführung jeder Wiederholung wieder in Bewegung. Der Plan passt ${timed ? 'Halteübungen' : 'diese Übungen'} nicht für dich an, das liegt also bei dir.`,
  },
  tooSoon: {
    heading: 'Noch nicht genug Daten',
    detail: (sessions: number, needed: number) =>
      `${String(sessions)} von ${String(needed)} Einheiten eingetragen. Sobald es ein paar sind, siehst du hier, wie es wirklich läuft.`,
  },
  notEnoughWeeks: {
    heading: 'Genug Einheiten, noch nicht genug Wochen',
    detail: (sessions: number, days: number, wait: number) =>
      `${String(sessions)} Einheiten in ${String(days)} ${days === 1 ? 'Tag' : 'Tagen'}. Ein Wochenmuster braucht etwa zwei Wochen, um etwas auszusagen – schau ${wait === 1 ? 'morgen' : `in ${String(wait)} Tagen`} wieder vorbei.`,
  },
  pace: {
    onTrack: {
      heading: 'Dein Gewicht macht, was du willst',
      detail: (rate: string, goal: string) =>
        `${rate} pro Woche, im Bereich für „${goal}“. Nichts zu ändern.`,
    },
    fast: {
      heading: 'Dein Gewicht ändert sich schneller, als das Ziel es will',
      detail: (rate: string, goal: string) =>
        `${rate} pro Woche. Schneller als der Bereich für „${goal}“ – meist geht dabei Kraft verloren, und das Training hier soll sie erhalten.`,
    },
    slow: {
      heading: 'Dein Gewicht bewegt sich kaum',
      detail: (rate: string, goal: string) =>
        `${rate} pro Woche, unter dem Bereich für „${goal}“. Das ändert nicht das Training.`,
    },
    wrongWay: {
      heading: 'Dein Gewicht geht in die andere Richtung',
      detail: (rate: string, down: boolean, goal: string) =>
        `${rate} pro Woche ${down ? 'weniger' : 'mehr'}, und dein Ziel ist „${goal}“. Entweder hat sich das Ziel geändert oder deine Woche – beides ist einen Blick wert.`,
    },
  },
  links: {
    rate: (perWeek: string) => `${perWeek} pro Woche`,
    attendance: {
      heading: (name: string) => `${name} stockt, und es liegt an den Einheiten`,
      detail: (rate: string, target: number) =>
        `Du hast ${rate} trainiert, statt der ${String(target)}, die du festgelegt hast. Eine Übung muss oft genug drankommen, um gesteigert zu werden – das ist noch kein Problem der Planung.`,
    },
    deficit: {
      heading: (name: string) => `${name} stockt, und dein Gewicht erklärt es`,
      detail: (best: string, losing: string) =>
        `Dein bester Wert zuletzt ist immer noch ${best}, während du ${losing} pro Woche abnimmst. Im Defizit stagniert Kraft meist – sie zu halten ist hier der Erfolg, also lass es lieber so, statt den Plan umzubauen.`,
    },
    programming: {
      heading: (name: string) => `${name} stockt, und sonst erklärt es nichts`,
      detail: (best: string, sessions: number, advice: string) =>
        `Dein bester Wert zuletzt ist nach ${String(sessions)} weiteren ${sessions === 1 ? 'Einheit' : 'Einheiten'} immer noch ${best}, obwohl du trainierst und dein Gewicht dort ist, wo du es willst. Bleibt das Training: ${advice}`,
      backOff:
        'Geh etwa zehn Prozent zurück und lauf neu an – das macht der Plan nach drei schwächeren Einheiten für dich.',
      yours:
        'Füge einen Satz hinzu oder führe jede Wiederholung langsamer aus. Der Plan passt diese nicht für dich an, die Änderung liegt also bei dir.',
    },
    shortfall: {
      heading: (slug: string) => `${group(slug)} hinkt hinterher, weil die Einheiten fehlen`,
      detail: (rate: string, target: number) =>
        `Du trainierst ${rate} statt der ${String(target)}, die du festgelegt hast. Mehr Volumen in einem Plan, zu dem du nicht kommst, löst das nicht – zuerst kommt die Regelmäßigkeit.`,
    },
    confirmed: {
      heading: 'Das funktioniert',
      detail: (name: string, from: string, to: string, pace: string) =>
        `${name} ging von ${from} auf ${to}, und dein Gewicht ändert sich um ${pace} pro Woche, genau wie gewollt. Hier muss sich nichts ändern.`,
    },
  },
};
