import type { Messages } from '../en/index.js';

type Stat = 'workouts' | 'lifted' | 'sets' | 'minutes';
type Period = 'week' | 'month';

const STAT: Record<Stat, string> = {
  workouts: 'treinos',
  lifted: 'peso',
  sets: 'séries',
  minutes: 'tempo',
};
const WHEN: Record<Period, string> = { week: 'esta semana', month: 'este mês' };
const summary = (improved: boolean, period: Period): Record<Stat, string> => ({
  workouts: `${improved ? 'Maior evolução: ' : 'Mais '}${STAT.workouts} ${WHEN[period]}`,
  lifted: `${improved ? 'Maior evolução: ' : 'Mais '}${STAT.lifted} ${WHEN[period]}`,
  sets: `${improved ? 'Maior evolução: ' : 'Mais '}${STAT.sets} ${WHEN[period]}`,
  minutes: `${improved ? 'Maior evolução: ' : 'Mais '}${STAT.minutes} ${WHEN[period]}`,
});

export const friends: Messages['friends'] = {
  title: 'Amigos',
  nameless: 'Seu amigo',
  you: 'Você',
  unknownExercise: 'Exercício desconhecido',
  didNotGoThrough: 'Não deu certo.',
  didNotSave: 'Não foi salvo. Tente de novo.',
  couldNotLoad: 'Não foi possível carregar.',
  addFriend: 'Adicionar um amigo',
  profileUnavailable: 'Seu perfil não está disponível. Abra seu perfil e tente de novo.',
  resultDismissed: 'Este resultado já foi dispensado.',
  challengeHint: 'Desafie um amigo por uma semana: abra a página dele e escolha uma estatística.',
  tabs: {
    friends: 'Amigos',
    leaderboard: 'Ranking',
    requests: 'Solicitações',
    waiting: ' pendentes',
  },
  empty: {
    eyebrow: 'Amigos',
    title: 'Treine com amigos',
    body: 'Compartilhe seu código com quem treina com você. Quando a pessoa adicionar você, vocês vão ver aqui a semana, as melhores marcas e os treinos um do outro.',
  },
  card: {
    levelShort: (level: number) => `Nv ${String(level)}`,
    level: (level: number) => `Nível ${String(level)}`,
    workingOut: 'Treinando',
    notSharing: 'Não compartilha o treino',
    lastWorkout: 'Último treino',
    bestLifts: 'Melhores marcas',
    noLifts: 'Nenhum exercício registrado ainda',
    thisWeek: 'Esta semana',
    today: ' (hoje)',
    streak: 'Sequência: ',
    notLogged: (label: string, who: string) => `${label}: ${who} ainda não registrou`,
    youNotLogged: (label: string, who: string, theirs: string) =>
      `${label}: ${who} ${theirs}; você ainda não registrou`,
    levelWithYou: (label: string, who: string, theirs: string) =>
      `${label}: ${who} ${theirs}, empatado com você`,
    youAhead: (label: string, who: string, theirs: string, gap: string) =>
      `${label}: ${who} ${theirs}, você está ${gap} à frente`,
    youBehind: (label: string, who: string, theirs: string, gap: string) =>
      `${label}: ${who} ${theirs}, você está ${gap} atrás`,
  },
  status: {
    label: 'Compartilhar quando estou treinando',
    description: 'Seus amigos veem quando você está treinando.',
  },
  when: {
    justNow: 'Agora mesmo',
    minutesAgo: (minutes: number) => `Há ${String(minutes)} min`,
    hoursAgo: (hours: number) => `Há ${String(hours)} h`,
  },
  requests: {
    none: 'Nenhuma solicitação pendente. Quando alguém adicionar você com seu código ou desafiar você, aparece aqui para você aceitar.',
    accept: 'Aceitar',
    decline: 'Recusar',
    acceptLabel: (name: string) => `Aceitar ${name}`,
    declineLabel: (name: string) => `Recusar ${name}`,
  },
  code: {
    yours: 'Seu código',
    yoursLabel: (spelled: string) => `Seu código: ${spelled}`,
    copy: 'Copiar',
    share: 'Compartilhar',
    copied: 'Copiado.',
    copiedToPaste: 'Copiado, pronto para colar.',
    couldNotCopy: (code: string) => `Não foi possível copiar. Seu código é ${code}.`,
    couldNotShare: (code: string) => `Não foi possível compartilhar. Seu código é ${code}.`,
    shareTitle: 'Código de amigo do g7m',
    shareText: (code: string) => `Me adicione no g7m: meu código de amigo é ${code}`,
    theirs: 'Código da pessoa',
    sending: 'Enviando…',
    send: 'Enviar solicitação',
    typeFirst: 'Digite primeiro o código do seu amigo.',
    shape: 'Um código de amigo tem seis letras e números.',
    characters: 'Códigos de amigo nunca usam 0, O, 1, I ou L. Confira o código e tente de novo.',
    sent: 'Solicitação enviada.',
    sentTo: (who: string) => `Solicitação enviada para ${who}.`,
    nowFriends: (who: string | null) =>
      who === null
        ? 'A pessoa já tinha enviado uma solicitação, então agora vocês são amigos.'
        : `${who} já tinha enviado uma solicitação, então agora vocês são amigos.`,
    ownCode: 'Esse é o seu próprio código.',
    unknown: 'Ninguém tem esse código. Confira e tente de novo.',
    alreadyFriends: (who: string | null) =>
      who === null ? 'Vocês já são amigos.' : `Você já é amigo de ${who}.`,
    alreadyRequested: (who: string | null) =>
      who === null
        ? 'Você já enviou uma solicitação.'
        : `Você já enviou uma solicitação para ${who}.`,
    tooMany: 'São muitas solicitações em uma hora. Tente mais tarde.',
  },
  reference: {
    seconds: (who: string, reps: string) => `${who}: ${reps} s`,
    reps: (who: string, reps: string) => `${who}: ${reps} reps`,
    assisted: (who: string, reps: string, weight: string) =>
      `${who}: ${reps} × ${weight} de assistência`,
  },
  offline: {
    title: 'Você está offline',
    body: 'Amigos precisam de conexão. Todo o seu treino continua aqui, e isto será preenchido quando você estiver online de novo.',
  },
  name: {
    missingProfile: 'Seu perfil ainda não chegou a este celular. Espere um pouco e tente de novo.',
    title: 'Como seus amigos devem chamar você?',
    body: 'Seus amigos veem seu nome ao lado do seu treino. Você pode mudar depois em Seu perfil.',
    label: 'Seu nome',
  },
  page: {
    notSharing: 'Não está compartilhando o treino agora, ou não está mais na sua lista de amigos.',
    headToHead: 'Frente a frente',
    nothingToCompare:
      'Nada para comparar ainda. Quando vocês dois registrarem o mesmo exercício, ele aparece aqui.',
    exercise: 'Exercício',
    youAhead: (gap: string) => `Você está ${gap} à frente`,
    theyAhead: (who: string, gap: string) => `${who} está ${gap} à frente`,
    level: 'Empate',
    recent: 'Treinos recentes',
    noRecent: 'Nenhum treino concluído ainda.',
    achievementsPending: (name: string) => `Aparece quando ${name} abrir o app de novo`,
    noneEarned: 'Nenhuma obtida ainda',
    earnedOf: (earned: number, total: number) => `${String(earned)} de ${String(total)} obtidas`,
    training: (name: string) => `Treino de ${name}`,
    lastWeeks: (weeks: number) => `As últimas ${String(weeks)} semanas, no corpo.`,
    nothingLogged: (weeks: number) => `Nada registrado nas últimas ${String(weeks)} semanas.`,
    bestsDescription: (name: string) =>
      `O mais pesado que ${name} já moveu em cada exercício. Exercícios com peso corporal ficam de fora: o peso corporal continua privado.`,
    routines: 'Rotinas',
    noRoutines: 'Nenhuma rotina salva ainda.',
    showFewer: 'Mostrar menos',
    showAll: (count: number) => `Mostrar todas as ${String(count)}`,
    confirmRemove: (name: string) => `Remover ${name} dos seus amigos? A pessoa não será avisada.`,
    moreOptions: 'Mais opções',
    remove: 'Remover amigo',
    exercises: (count: number) => (count === 1 ? '1 exercício' : `${String(count)} exercícios`),
  },
  session: {
    gone: 'Este treino não está mais compartilhado com você.',
    label: (friend: string) => `Treino de ${friend}, abrir o perfil de ${friend}`,
    whose: (friend: string) => `Treino de ${friend}`,
    fromDevice: 'Salvo neste celular da última vez que você abriu.',
    settingUp: 'Preparando…',
    doIt: 'Fazer este treino',
    finishFirst: 'Conclua o treino aberto antes de começar este.',
    openIt: 'Abrir',
    explain:
      'Os exercícios e séries da pessoa, com os seus próprios pesos da última vez. Os números dela aparecem ao lado de cada exercício como referência.',
  },
  routine: {
    gone: 'Esta rotina não está mais compartilhada com você.',
    label: (name: string) => `Rotina de ${name}, abrir o perfil de ${name}`,
    whose: (name: string) => `Rotina de ${name}`,
    doIt: 'Fazer esta rotina',
    explain:
      'Os exercícios, séries e faixas de repetições da pessoa, com os seus próprios pesos da última vez.',
    empty: 'Ainda vazia.',
    superset: 'Superset',
  },
  board: {
    label: 'Ranking',
    rankBy: 'Classificar por',
    stat: 'Estatística',
    period: 'Período',
    done: 'Concluído',
    change: 'Mudar',
    nobody: 'Ninguém para competir ainda',
    nobodyBody:
      'Quando um amigo adicionar você, você vai ver quem treinou mais esta semana e este mês.',
    stats: { workouts: 'Treinos', lifted: 'Peso', sets: 'Séries', minutes: 'Tempo' },
    rankings: { most: 'Mais', improved: 'Maior evolução' },
    periods: { week: 'Esta semana', month: 'Este mês' },
    summary: {
      most: { week: summary(false, 'week'), month: summary(false, 'month') },
      improved: { week: summary(true, 'week'), month: summary(true, 'month') },
    },
    workouts: (count: string, n: number) => (n === 1 ? '1 treino' : `${count} treinos`),
    sets: (count: string, n: number) => (n === 1 ? '1 série' : `${count} séries`),
    ofTraining: (time: string) => `${time} de treino`,
    lifted: (amount: string) => `${amount} levantados`,
    behind: (amount: string, who: string) => `${amount} atrás de ${who}`,
    levelWith: (who: string) => `Empatado com ${who}`,
    ahead: (amount: string, who: string) => `${amount} à frente de ${who}`,
    ordinal: (rank: number): string => `${String(rank)}º`,
    lastDay: 'Último dia',
    daysLeft: (days: number) => `Faltam ${String(days)} dias`,
    crowned: (improved: boolean, period: 'week' | 'month') =>
      `${improved ? 'Maior evolução' : 'Venceu'} ${period === 'week' ? 'na semana passada' : 'no mês passado'}`,
    nothingYetToMeasure: 'Nada para comparar ainda',
    ofUsual: (score: number) => `${String(score)}% do habitual`,
    rowNew: (name: string) => `${name}: novo`,
    rowNewWhy: (name: string, period: 'week' | 'month') =>
      `${name}: novo, nada nas quatro semanas antes ${period === 'week' ? 'desta semana' : 'deste mês'} para comparar`,
    rowNothing: (name: string) => `${name}: nada ainda`,
    rowPlaced: (place: string, name: string, score: string) => `${place}, ${name}: ${score}`,
    moved: (up: boolean, by: number) =>
      `${up ? 'Subiu' : 'Caiu'} ${String(by)} ${by === 1 ? 'posição' : 'posições'} desde ontem`,
    new: 'Novo',
    usualWeek:
      '100% é uma semana habitual: um quarto do que cada pessoa fez nas quatro semanas anteriores.',
    usualMonth:
      '100% é um mês habitual: o que cada pessoa fez nas quatro semanas anteriores, ajustado à duração do mês.',
    weightCounts:
      'Peso × repetições nas séries válidas. Em exercícios com peso corporal, como barras e paralelas, só conta o peso adicional.',
    oneNotSharing: (name: string) => `${name} não compartilha o treino, então não está no ranking.`,
    manyNotSharing: (count: number) =>
      `${String(count)} amigos não compartilham o treino, então não estão no ranking.`,
    noPlace: 'Ainda sem posição',
    yourPlace: (rank: number) => `Você está em ${String(rank)}º`,
  },
  challenge: {
    title: {
      most: {
        workouts: 'Mais treinos',
        lifted: 'Mais peso levantado',
        sets: 'Mais séries',
        minutes: 'Mais tempo de treino',
      },
      improved: {
        workouts: 'Maior evolução: treinos',
        lifted: 'Maior evolução: peso levantado',
        sets: 'Maior evolução: séries',
        minutes: 'Maior evolução: tempo de treino',
      },
    },
    metric: {
      workouts: 'treinos',
      lifted: 'peso levantado',
      sets: 'séries',
      minutes: 'tempo de treino',
    },
    ofUsual: '% do habitual',
    underAnHour: 'Falta menos de uma hora',
    hoursLeft: (hours: number) => (hours === 1 ? 'Falta 1 hora' : `Faltam ${String(hours)} horas`),
    daysLeft: (days: number) => `Faltam ${String(days)} dias`,
    against: (title: string, name: string) => `${title}, contra ${name}`,
    sent: (when: string) => `Enviado ${when}`,
    ended: (when: string) => `Terminou ${when}`,
    waiting: (name: string) => `Esperando ${name} aceitar`,
    challengedYou: (name: string) =>
      `${name} desafiou você. Sete dias, a partir de quando você aceitar.`,
    youWon: 'Você venceu',
    theyWon: (name: string) => `${name} venceu`,
    draw: 'Empate',
    unavailable: 'Resultado indisponível',
    finalizing: 'Finalizando o resultado',
    sharingOff:
      'O compartilhamento do treino está desativado, então este desafio não pode ser pontuado.',
    finalizingNote:
      'Esperamos 24 horas para os treinos offline sincronizarem. Depois, as pontuações são definitivas.',
    recovered: 'Resultado recuperado · com base no treino disponível',
    excluded:
      'O treino não estava disponível quando as pontuações foram fechadas. Este resultado fica fora do seu histórico.',
    gotIt: 'Entendi',
    accept: 'Aceitar',
    decline: 'Recusar',
    acceptLabel: (name: string) => `Aceitar o desafio de ${name}`,
    declineLabel: (name: string) => `Recusar o desafio de ${name}`,
    takeBackLabel: (name: string) => `Retirar seu desafio a ${name}`,
    takeBack: 'Retirar',
    resultUnchanged:
      'O treino não estava disponível quando as pontuações foram fechadas. Seu histórico não muda.',
    resultOf: (i: number, n: number) => `Resultado ${String(i)} de ${String(n)}`,
    view: 'Ver desafio',
    nextResult: 'Próximo resultado',
    later: 'Depois',
    resultAgainst: (title: string, name: string) => `${title} contra ${name}`,
    heading: 'Desafios',
    challenge: (name: string) => `Desafiar ${name}`,
    fromAccept: (name: string) => `Sete dias, a partir de quando ${name} aceitar.`,
    explainImproved:
      'Sete dias, cada um contra as próprias últimas quatro semanas, para ser justo não importa quem treina mais.',
    explainMost: 'Sete dias. Quem fizer mais vence.',
    send: 'Enviar desafio',
    startsWhen: (name: string) => `Começa quando ${name} aceitar.`,
    problems: {
      already_live: (name: string) => `Você já tem um desafio com ${name}. Um de cada vez.`,
      not_sharing: (name: string) =>
        `${name} não compartilha o treino, então um desafio não pode ser pontuado.`,
      you_not_sharing: (_name: string) =>
        'Ative o compartilhamento do seu treino em Ajustes para participar de desafios.',
      no_usual: (name: string) =>
        `${name} não tem treinos nas últimas quatro semanas para comparar. Tente Mais.`,
      you_no_usual: (_name: string) =>
        'Você não tem treinos nas últimas quatro semanas para comparar. Tente Mais.',
      not_friends: (name: string) => `${name} não está mais na sua lista de amigos.`,
      not_found: (_name: string) => 'Esse desafio não existe mais.',
      too_many: (_name: string) => 'Desafios demais enviados. Tente mais tarde.',
      invalid: (_name: string) => 'Algo estava errado com esse desafio. Tente de novo.',
    },
  },
};
