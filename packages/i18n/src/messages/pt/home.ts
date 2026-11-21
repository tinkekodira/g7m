import type { Messages } from '../en/index.js';

type Region = 'legs' | 'arms' | 'shoulders' | 'back' | 'chest' | 'core';

const plural = (count: number, one: string, many: string): string =>
  `${String(count)} ${count === 1 ? one : many}`;

const REGION: Record<Region, string> = {
  legs: 'Pernas',
  arms: 'Braços',
  shoulders: 'Ombros',
  back: 'Costas',
  chest: 'Peito',
  core: 'Core',
};

export const home: Messages['home'] = {
  yourProfile: 'Seu perfil',
  thisMonth: 'Este mês',
  quickAccess: 'Acesso rápido',
  stillOpen: 'Ainda aberto',
  inProgress: 'Em andamento',
  openIt: 'Abrir',
  today: {
    label: 'Treino de hoje',
    noGoalTitle: 'Receba um plano feito para você',
    noGoalBody:
      'Escolha um objetivo e quantos dias você treina. Leva uns dez segundos, e cada sessão depois disso é montada a partir do que você registra.',
    chooseGoal: 'Escolher um objetivo',
    working: 'Montando a sessão de hoje…',
    minutes: (minutes: number) => `${String(minutes)} min`,
    sets: (sets: number) => `${String(sets)} ${sets === 1 ? 'série' : 'séries'}`,
    doneTitle: 'Pronto por hoje',
    trainedToday: (parts: string) => `Treinou hoje · ${parts}`,
    doneBody:
      'É no descanso que o trabalho de hoje vira progresso. A sessão de amanhã é montada a partir dele.',
    settingUp: 'Preparando…',
    trainAgain: 'Treinar de novo',
    weekTitle: 'Você fechou a semana',
    weekBody:
      'Tudo o que a sessão de hoje treinaria já teve suas séries nos últimos sete dias. Outra sessão agora custa mais recuperação do que rende.',
    trainAnyway: 'Treinar mesmo assim',
    summary: (exercises: number, sets: number) =>
      `${String(exercises)} exercícios · ${String(sets)} séries`,
    about: (minutes: number) => ` · cerca de ${String(minutes)} min`,
    muscleGroups: 'Grupos musculares',
    start: 'Começar treino',
    seePlan: 'Ver o plano',
  },
  tiles: {
    plan: 'Plano de hoje',
    planDetail: 'O que o app sugere',
    continue: 'Continuar seu treino',
    start: 'Começar um treino',
    continueDetail: 'Voltar à sua sessão',
    startDetail: 'Escolha uma rotina ou comece do zero',
    calendar: 'Calendário',
    calendarDetail: 'Os dias em que você treinou',
    browse: 'Ver exercícios',
    browseDetail: 'A biblioteca inteira',
    progress: 'Progresso',
    progressDetail: 'Como seu treino está indo',
  },
  sync: {
    lost: 'Algumas alterações não chegaram ao servidor',
    stopped: 'A sincronização parou',
    lostDetail: 'Elas estão neste celular, mas não serão sincronizadas.',
    stoppedDetail: 'Tudo continua salvo neste celular.',
    see: 'Ver o que aconteceu',
  },
  cards: {
    records: 'Recordes pessoais',
    workouts: 'Treinos',
    muscles: 'Grupos musculares',
    activity: 'Força e atividade',
    slide: (name: string, position: number, total: number) =>
      `${name}, ${String(position)} de ${String(total)}`,
    workoutsLabel: (total: number, heading: string, detail: string) =>
      `Treinos este mês: ${String(total)} concluídos. ${heading}. ${detail}`,
    yourWorkouts: 'Seus treinos',
    completed: 'concluídos',
    workoutsSummary: (total: number, current: string, previous: number, previousName: string) =>
      `${String(total)} treinos em ${current} até agora, contra ${String(previous)} até este dia em ${previousName}.`,
    musclesLabel: (sets: number, groups: number, heading: string, detail: string) =>
      `Grupos musculares este mês: ${String(sets)} ${sets === 1 ? 'série' : 'séries'} em ${String(groups)} ${groups === 1 ? 'grupo' : 'grupos'}. ${heading}. ${detail}`,
    groups: (count: number) => (count === 1 ? 'grupo' : 'grupos'),
    setsWord: (count: number) => (count === 1 ? 'série' : 'séries'),
    noSets: 'Nenhuma série este mês ainda.',
    activityLabel: (
      workouts: number,
      time: string,
      perWeek: string,
      lifted: string,
      range: string,
      heading: string,
      detail: string,
    ) =>
      `Força e atividade este mês: ${String(workouts)} ${workouts === 1 ? 'treino' : 'treinos'}, ${time} de treino, ${perWeek} por semana, ${lifted} levantados. Comparado com ${range}. ${heading}. ${detail}`,
    strengthActivity: 'Força e atividade',
    firstMonth: 'Primeiro mês',
    comparedWith: 'Comparado com',
    range: (month: string, through: number) => `1–${String(through)} de ${month}`,
    statWorkouts: 'Treinos',
    trainingTime: 'Tempo de treino',
    perWeek: 'Por semana',
    volumeLifted: 'Volume levantado',
    recordsLabel: (count: number, heading: string, detail: string) =>
      `Recordes pessoais este mês: ${String(count)} ${count === 1 ? 'nova marca' : 'novas marcas'}. ${heading}. ${detail}`,
    newBests: (count: number) => (count === 1 ? 'nova marca' : 'novas marcas'),
    exercise: 'Exercício',
    firstTime: 'Primeira vez',
    onYourBest: (weight: string) => `${weight} acima da sua melhor marca`,
    best: (weight: string) => `Melhor ${weight}`,
    sameAsLast: 'Igual ao mês passado',
    noneLast: 'Nenhum no mês passado',
    up: 'a mais',
    down: 'a menos',
    yourMonth: 'Seu mês',
    today: 'Hoje',
    monthStart: (month: string) => `1º de ${month}`,
    firstTitle: 'Seu primeiro treino começa o gráfico',
    firstBody:
      'Registre um e isto vai se preencher: com que frequência você treina, quais músculos trabalha e quanto levanta, mês a mês.',
    logWorkout: 'Registrar um treino',
  },
  insights: {
    workouts: {
      start: {
        heading: 'Seu mês começa com um treino',
        detail: 'Registre uma sessão e esta linha começa a subir.',
      },
      notYet: {
        heading: 'Nada registrado este mês ainda',
        detail: (previous: number) =>
          `No mês passado você fez ${plural(previous, 'treino', 'treinos')}. Hoje é um bom dia para começar.`,
      },
      firstMonth: {
        heading: 'Seu primeiro mês está em andamento',
        detail: (workouts: number) =>
          `${plural(workouts, 'treino', 'treinos')} até agora. O próximo mês vai ter este para superar.`,
      },
      ahead: {
        heading: 'Você está embalado',
        detail: (by: number) =>
          `${plural(by, 'treino', 'treinos')} a mais do que neste ponto do mês passado.`,
      },
      level: {
        heading: 'Empatado com o mês passado',
        detail: (workouts: number) =>
          `${plural(workouts, 'treino', 'treinos')}, o mesmo que até este dia no mês passado.`,
      },
      behind: {
        heading: 'Um pouco atrás do mês passado',
        detail: (by: number) => `${plural(by, 'treino', 'treinos')} a menos do que até este dia.`,
      },
    },
    muscles: {
      none: {
        heading: 'Nenhuma série registrada este mês ainda',
        detail: 'Cada série que você registrar aparece aqui, por grupo muscular.',
      },
      early: {
        heading: 'O quadro está se formando',
        detail: (sets: number) =>
          `${plural(sets, 'série', 'séries')} até agora. Mais alguns treinos e o equilíbrio aparece.`,
      },
      neglected: {
        atLeast: (region: Region, days: number) =>
          `${REGION[region]}: nada em ${String(days)} dias`,
        exactly: (region: Region, days: number) =>
          `${REGION[region]}: sem treino há ${String(days)} dias`,
        detail: 'Merece um lugar no seu próximo treino.',
      },
      lopsided: {
        heading: (region: Region, percent: number) =>
          `${REGION[region]}: ${String(percent)}% das suas séries`,
        detail: 'Distribuir o trabalho evita que o resto fique para trás.',
      },
      balanced: {
        heading: 'Bem equilibrado',
        detail: 'Você está treinando todos os grandes grupos musculares este mês.',
      },
      focused: {
        heading: (regions: readonly Region[]) =>
          `Principalmente ${regions.map((region) => REGION[region].toLowerCase()).join(' e ')} até agora`,
        detail: 'O resto terá sua vez ao longo do mês.',
      },
    },
    activity: {
      quiet: {
        heading: 'Seu mês está esperando',
        detail: 'Tempo, volume e ritmo aparecem depois do seu primeiro treino.',
      },
      stronger: {
        heading: 'Você está levantando mais',
        detail: (percent: number) =>
          `${String(percent)}% mais peso movido do que neste ponto do mês passado.`,
      },
      consistent: {
        heading: 'Ótima constância',
        detail: (perWeek: string) =>
          `Cerca de ${perWeek} por semana. Você está aparecendo, e dá para ver.`,
      },
      catchUp: {
        heading: (by: number) =>
          by === 1 ? 'Um treino fecha a diferença' : `${String(by)} treinos para recuperar`,
        detail: 'Atrás do ritmo do mês passado até este dia, com tempo para recuperar.',
      },
      steady: {
        heading: 'Um mês constante',
        detail: 'Continue assim e a tendência aparece aqui.',
      },
    },
    records: {
      oneLift: 'Um exercício',
      none: {
        heading: 'Nenhum exercício registrado este mês ainda',
        detail:
          'Suas séries mais pesadas do mês aparecem aqui, em comparação com sua melhor marca.',
      },
      new: {
        heading: (count: number) =>
          count === 1 ? 'Um novo recorde pessoal' : `${String(count)} novos recordes pessoais`,
        detail: (name: string) =>
          `${name}: mais pesado do que nunca. Você está ficando mais forte.`,
      },
      first: {
        heading: 'Suas primeiras marcas estão definidas',
        detail: (count: number) =>
          `${String(count)} ${count === 1 ? 'exercício' : 'exercícios'} para superar daqui em diante. Aumente a carga e eles aparecem como novos recordes.`,
      },
      close: {
        heading: (weight: string) => `A ${weight} da sua melhor marca`,
        detail: (name: string) => `${name} está quase lá. Um bom dia e entra no placar.`,
      },
      holding: {
        heading: 'Suas melhores marcas continuam de pé',
        detail: 'Uma série mais pesada em qualquer exercício este mês aparece aqui.',
      },
    },
  },
};
