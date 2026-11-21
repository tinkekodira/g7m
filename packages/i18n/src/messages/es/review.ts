import type { Messages } from '../en/index.js';

const GROUPS: Record<string, string> = {
  chest: 'pecho',
  back: 'espalda',
  shoulders: 'hombros',
  biceps: 'bíceps',
  triceps: 'tríceps',
  quads: 'cuádriceps',
  hamstrings: 'isquiotibiales',
  glutes: 'glúteos',
  calves: 'gemelos',
  core: 'core',
};

const group = (slug: string): string => GROUPS[slug] ?? slug;

const lower = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

export const review: Messages['review'] = {
  card: {
    eyebrow: 'De tu registro',
    title: 'Cómo va',
    intro: 'Leído de lo que registraste, lo haya escrito el plan o tú.',
  },
  mark: {
    seconds: (reps: number) => `${String(reps)} s`,
    reps: (reps: number) => `${String(reps)} ${reps === 1 ? 'rep.' : 'reps.'}`,
    forSeconds: (reps: number) => ` durante ${String(reps)} s`,
    times: (reps: number) => ` × ${String(reps)}`,
    help: (count: string, weight: string) => `${count} con ${weight} de ayuda`,
  },
  ago: (days: number) =>
    days < 14
      ? `hace ${String(days)} ${days === 1 ? 'día' : 'días'}`
      : `hace ${String(Math.round(days / 7))} semanas`,
  consistency: {
    heading: 'Entrenas menos de lo que planeaste',
    detail: (perWeek: number, weeks: number, target: number) =>
      `Unas ${String(perWeek)} sesiones por semana en las últimas ${String(weeks)}, frente a las ${String(target)} que fijaste. El plan está hecho para ${String(target)}; si esa no es la semana que tienes, merece la pena cambiar el número.`,
  },
  groupShort: {
    heading: (slug: string) => `Te falta trabajo de ${group(slug)}`,
    detail: (perWeek: number, target: number) =>
      `${String(perWeek)} series por semana frente a un objetivo de ${String(target)}. Es lo que más se queda atrás de todo lo que entrenas, así que es lo primero que merece la pena añadir.`,
  },
  groupOver: {
    heading: (slug: string) => `Mucho trabajo de ${group(slug)}`,
    detail: (perWeek: number, target: number) =>
      `${String(perWeek)} series por semana frente a un objetivo de ${String(target)}. No es perjudicial, pero a partir de cierto punto las series extra dejan de compensar la recuperación que cuestan.`,
  },
  climbing: {
    heading: (name: string) => `Tu ${lower(name)} va subiendo`,
    detail: (from: string, to: string, sessions: number) =>
      `De ${from} a ${to} en ${String(sessions)} sesiones. Eso es que funciona.`,
  },
  stalled: {
    heading: (name: string) => `Tu ${lower(name)} no se ha movido`,
    detail: (best: string, ago: string, sessionsSince: number, advice: string) =>
      `Tu mejor marca reciente sigue siendo ${best}, de ${ago}, y ${
        sessionsSince === 1
          ? 'la sesión de después no la ha superado'
          : `las ${String(sessionsSince)} sesiones de después no la han superado`
      }. ${advice}`,
    backOff:
      'Un estancamiento suele romperse bajando un diez por ciento y volviendo a subir, y el plan lo hará por ti tras tres sesiones flojas seguidas.',
    yours: (timed: boolean) =>
      `${timed ? 'Un ejercicio isométrico' : 'Un ejercicio con peso corporal'} suele volver a avanzar con una serie extra o con repeticiones más lentas y exigentes. El plan no ajusta ${timed ? 'los isométricos' : 'estos ejercicios'} por ti, así que este te toca a ti.`,
  },
  tooSoon: {
    heading: 'Aún no hay suficiente información',
    detail: (sessions: number, needed: number) =>
      `${String(sessions)} de ${String(needed)} sesiones registradas. Cuando haya unas cuantas, aquí verás cómo va de verdad.`,
  },
  notEnoughWeeks: {
    heading: 'Suficientes sesiones, pocas semanas',
    detail: (sessions: number, days: number, wait: number) =>
      `${String(sessions)} sesiones en ${String(days)} ${days === 1 ? 'día' : 'días'}. Un patrón semanal necesita unas dos semanas para significar algo, así que vuelve ${wait === 1 ? 'mañana' : `dentro de ${String(wait)} días`}.`,
  },
  pace: {
    onTrack: {
      heading: 'Tu peso hace lo que le pediste',
      detail: (rate: string, goal: string) =>
        `${rate} por semana, dentro del rango para «${lower(goal)}». Nada que cambiar.`,
    },
    fast: {
      heading: 'Tu peso cambia más rápido de lo que pide el objetivo',
      detail: (rate: string, goal: string) =>
        `${rate} por semana. Más rápido que el rango para «${lower(goal)}», lo que suele significar perder fuerza por el camino, y el entrenamiento aquí busca conservarla.`,
    },
    slow: {
      heading: 'Tu peso apenas se mueve',
      detail: (rate: string, goal: string) =>
        `${rate} por semana, por debajo del rango para «${lower(goal)}». Esto no lo cambia el entrenamiento.`,
    },
    wrongWay: {
      heading: 'Tu peso va en la dirección contraria',
      detail: (rate: string, down: boolean, goal: string) =>
        `${rate} por semana ${down ? 'menos' : 'más'}, y pediste «${lower(goal)}». O ha cambiado el objetivo o ha cambiado la semana; vale la pena revisar ambas cosas.`,
    },
  },
  links: {
    rate: (perWeek: string) => `${perWeek} por semana`,
    attendance: {
      heading: (name: string) => `Tu ${lower(name)} está estancado, y es por las sesiones`,
      detail: (rate: string, target: number) =>
        `Has entrenado ${rate} frente a las ${String(target)} que fijaste. Un ejercicio tiene que repetirse lo bastante para poder progresar; esto aún no es un problema de programación.`,
    },
    deficit: {
      heading: (name: string) => `Tu ${lower(name)} está estancado, y tu peso lo explica`,
      detail: (best: string, losing: string) =>
        `Tu mejor marca reciente sigue siendo ${best}, mientras pierdes ${losing} por semana. La fuerza suele estancarse en déficit; mantenerla ya es el logro, así que mejor dejarlo así que rehacer el plan.`,
    },
    programming: {
      heading: (name: string) => `Tu ${lower(name)} está estancado, y nada más lo explica`,
      detail: (best: string, sessions: number, advice: string) =>
        `Tu mejor marca reciente sigue siendo ${best} tras ${String(sessions)} ${sessions === 1 ? 'sesión' : 'sesiones'} más, con las sesiones hechas y tu peso donde lo querías. Queda el entrenamiento: ${advice}`,
      backOff:
        'baja un diez por ciento y vuelve a subir, algo que el plan hace por ti tras tres sesiones flojas.',
      yours:
        'añade una serie o haz cada repetición más lenta. El plan no ajusta esto por ti, así que el cambio es cosa tuya.',
    },
    shortfall: {
      heading: (slug: string) => `Te falta trabajo de ${group(slug)} porque faltan sesiones`,
      detail: (rate: string, target: number) =>
        `Entrenas ${rate} frente a las ${String(target)} que fijaste. Añadir volumen a un plan que no llegas a hacer no lo arreglará; primero va la asistencia.`,
    },
    confirmed: {
      heading: 'Esto funciona',
      detail: (name: string, from: string, to: string, pace: string) =>
        `Tu ${lower(name)} pasó de ${from} a ${to}, y tu peso cambia a ${pace} por semana, justo donde lo querías. Aquí no hay nada que cambiar.`,
    },
  },
};
