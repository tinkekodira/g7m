import type { Messages } from '../en/index.js';

const GROUPS: Record<string, string> = {
  chest: 'peito',
  back: 'costas',
  shoulders: 'ombros',
  biceps: 'bíceps',
  triceps: 'tríceps',
  quads: 'quadríceps',
  hamstrings: 'posteriores de coxa',
  glutes: 'glúteos',
  calves: 'panturrilhas',
  core: 'core',
};

const group = (slug: string): string => GROUPS[slug] ?? slug;

const lower = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

export const review: Messages['review'] = {
  card: {
    eyebrow: 'Do seu registro',
    title: 'Como está indo',
    intro: 'Lido a partir do que você registrou, tenha sido o plano ou você quem escreveu.',
  },
  mark: {
    seconds: (reps: number) => `${String(reps)} s`,
    reps: (reps: number) => `${String(reps)} ${reps === 1 ? 'rep.' : 'reps.'}`,
    forSeconds: (reps: number) => ` por ${String(reps)} s`,
    times: (reps: number) => ` × ${String(reps)}`,
    help: (count: string, weight: string) => `${count} com ${weight} de ajuda`,
  },
  ago: (days: number) =>
    days < 14
      ? `há ${String(days)} ${days === 1 ? 'dia' : 'dias'}`
      : `há ${String(Math.round(days / 7))} semanas`,
  consistency: {
    heading: 'Você está treinando menos do que planejou',
    detail: (perWeek: number, weeks: number, target: number) =>
      `Cerca de ${String(perWeek)} sessões por semana nas últimas ${String(weeks)}, contra as ${String(target)} que você definiu. O plano foi montado para ${String(target)}; se essa não é a semana que você tem, vale a pena mudar o número.`,
  },
  groupShort: {
    heading: (slug: string) => `Falta treino de ${group(slug)}`,
    detail: (perWeek: number, target: number) =>
      `${String(perWeek)} séries por semana contra uma meta de ${String(target)}. É o que está mais atrasado de tudo o que você treina, então é a primeira coisa que vale a pena acrescentar.`,
  },
  groupOver: {
    heading: (slug: string) => `Muito treino de ${group(slug)}`,
    detail: (perWeek: number, target: number) =>
      `${String(perWeek)} séries por semana contra uma meta de ${String(target)}. Não faz mal, mas a partir de certo ponto as séries extras deixam de compensar a recuperação que custam.`,
  },
  climbing: {
    heading: (name: string) => `Seu ${lower(name)} está subindo`,
    detail: (from: string, to: string, sessions: number) =>
      `De ${from} para ${to} em ${String(sessions)} sessões. É sinal de que está funcionando.`,
  },
  stalled: {
    heading: (name: string) => `Seu ${lower(name)} não saiu do lugar`,
    detail: (best: string, ago: string, sessionsSince: number, advice: string) =>
      `Sua melhor marca recente continua sendo ${best}, de ${ago}, e ${
        sessionsSince === 1
          ? 'a sessão seguinte não a superou'
          : `as ${String(sessionsSince)} sessões seguintes não a superaram`
      }. ${advice}`,
    backOff:
      'Um platô costuma se resolver recuando uns dez por cento e voltando a subir, e o plano faz isso por você depois de três sessões fracas seguidas.',
    yours: (timed: boolean) =>
      `${timed ? 'Um exercício isométrico' : 'Um exercício com peso corporal'} costuma voltar a evoluir com uma série extra ou com repetições mais lentas e difíceis. O plano não ajusta ${timed ? 'os isométricos' : 'esses exercícios'} por você, então este fica por sua conta.`,
  },
  tooSoon: {
    heading: 'Ainda não há dados suficientes',
    detail: (sessions: number, needed: number) =>
      `${String(sessions)} de ${String(needed)} sessões registradas. Quando houver algumas, é aqui que você vai ver como está indo de verdade.`,
  },
  notEnoughWeeks: {
    heading: 'Sessões suficientes, semanas insuficientes',
    detail: (sessions: number, days: number, wait: number) =>
      `${String(sessions)} sessões em ${String(days)} ${days === 1 ? 'dia' : 'dias'}. Um padrão semanal precisa de umas duas semanas para significar algo, então volte ${wait === 1 ? 'amanhã' : `daqui a ${String(wait)} dias`}.`,
  },
  pace: {
    onTrack: {
      heading: 'Seu peso está fazendo o que você pediu',
      detail: (rate: string, goal: string) =>
        `${rate} por semana, dentro da faixa para “${lower(goal)}”. Nada a mudar.`,
    },
    fast: {
      heading: 'Seu peso está mudando mais rápido do que o objetivo pede',
      detail: (rate: string, goal: string) =>
        `${rate} por semana. Mais rápido que a faixa para “${lower(goal)}”, o que costuma significar perder força no caminho, e o treino aqui serve para mantê-la.`,
    },
    slow: {
      heading: 'Seu peso quase não se mexe',
      detail: (rate: string, goal: string) =>
        `${rate} por semana, abaixo da faixa para “${lower(goal)}”. Não é o treino que muda isso.`,
    },
    wrongWay: {
      heading: 'Seu peso está indo na direção contrária',
      detail: (rate: string, down: boolean, goal: string) =>
        `${rate} por semana a ${down ? 'menos' : 'mais'}, e você pediu “${lower(goal)}”. Ou o objetivo mudou, ou a semana mudou; vale olhar as duas coisas.`,
    },
  },
  links: {
    rate: (perWeek: string) => `${perWeek} por semana`,
    attendance: {
      heading: (name: string) => `Seu ${lower(name)} travou, e o motivo são as sessões`,
      detail: (rate: string, target: number) =>
        `Você treinou ${rate} contra as ${String(target)} que definiu. Um exercício precisa aparecer com frequência para progredir; isso ainda não é um problema de programação.`,
    },
    deficit: {
      heading: (name: string) => `Seu ${lower(name)} travou, e o seu peso explica`,
      detail: (best: string, losing: string) =>
        `Sua melhor marca recente continua sendo ${best}, enquanto você perde ${losing} por semana. A força costuma estacionar em déficit; mantê-la já é a vitória, então é melhor deixar assim do que refazer o plano.`,
    },
    programming: {
      heading: (name: string) => `Seu ${lower(name)} travou, e nada mais explica`,
      detail: (best: string, sessions: number, advice: string) =>
        `Sua melhor marca recente continua sendo ${best} depois de mais ${String(sessions)} ${sessions === 1 ? 'sessão' : 'sessões'}, com os treinos acontecendo e seu peso onde você queria. Sobra o treino: ${advice}`,
      backOff:
        'recue uns dez por cento e volte a subir, algo que o plano faz por você depois de três sessões fracas.',
      yours:
        'acrescente uma série ou faça cada repetição mais devagar. O plano não ajusta isso por você, então a mudança é sua.',
    },
    shortfall: {
      heading: (slug: string) => `Falta treino de ${group(slug)} porque faltam sessões`,
      detail: (rate: string, target: number) =>
        `Treinando ${rate} contra as ${String(target)} que você definiu. Aumentar o volume de um plano que você não consegue cumprir não resolve; primeiro vem a frequência.`,
    },
    confirmed: {
      heading: 'Isso está funcionando',
      detail: (name: string, from: string, to: string, pace: string) =>
        `Seu ${lower(name)} foi de ${from} para ${to}, e seu peso está mudando ${pace} por semana, onde você queria. Nada aqui precisa mudar.`,
    },
  },
};
