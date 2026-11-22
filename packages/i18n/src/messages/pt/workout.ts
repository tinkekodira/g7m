import type { Messages } from '../en/index.js';

const plural = (count: number, one: string, many: string): string =>
  `${String(count)} ${count === 1 ? one : many}`;

const lower = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

export const workout: Messages['workout'] = {
  notOnDevice: 'Esse treino não está neste dispositivo.',
  progress: 'Progresso',
  editingClosed: 'Edição encerrada',
  editWindow: 'Os treinos podem ser editados por 2 horas após a conclusão.',
  details: 'Detalhes do treino',
  boutRemoved: 'Bloco removido.',
  titleEdit: 'Editar treino',
  titlePast: 'Treino anterior',
  title: 'Treino',
  elapsed: 'decorrido',
  lifted: (weight: string) => `${weight} levantados`,
  calendar: 'Calendário',
  editingHint:
    'Salve cada série alterada com Salvar ou com o check. A edição fecha 2 horas após a conclusão.',
  uncounted: (sets: number) =>
    `${sets === 1 ? 'Uma série não entra' : `${String(sets)} séries não entram`} no total: elas precisam de um peso corporal como referência.`,
  addExercise: '+ Adicionar um exercício',
  doneEditing: 'Concluir edição',
  finish: 'Concluir treino',
  confirmDiscard: 'Descartar este treino e tudo o que foi registrado nele?',
  discard: 'Descartar',
  removeTitle: (name: string | null) => `Remover ${name ?? 'este exercício'}?`,
  exercise: 'Exercício',
  removal: {
    nothing: 'Ainda não há nada registrado nele.',
    one: (bout: boolean) => `${bout ? 'O bloco registrado' : 'A série registrada'} sai junto.`,
    many: (count: number, bout: boolean) =>
      `${bout ? 'Os' : 'As'} ${String(count)} ${bout ? 'blocos registrados' : 'séries registradas'} saem junto.`,
  },
  removed: {
    drop: 'Drop removido.',
    set: 'Série removida.',
    setWithDrops: (drops: number) =>
      `Série removida, com ${String(drops)} ${drops === 1 ? 'drop' : 'drops'}.`,
    exercise: (name: string) => `${name} removido.`,
    exerciseWithSets: (name: string, sets: number) =>
      `${name} removido, com ${String(sets)} ${sets === 1 ? 'série' : 'séries'}.`,
  },
  superset: {
    label: 'Superset',
    heading: (count: number) => `Superset · ${String(count)} exercícios`,
    ungroup: 'Desagrupar',
    addRound: 'Adicionar rodada',
  },
  summary: {
    label: 'Resumo do treino',
    elapsed: (hours: number, minutes: number, seconds: number) =>
      `${String(hours)} ${hours === 1 ? 'hora' : 'horas'} ${String(minutes)} minutos ${String(seconds)} segundos decorridos`,
    completedSets: 'Séries válidas concluídas: ',
    sets: (count: number) => `${String(count)} ${count === 1 ? 'série' : 'séries'}`,
  },
  start: {
    title: 'Treinar',
    nothing:
      'Nada em andamento. Comece um treino e adicione exercícios conforme avança: tudo é salvo neste celular assim que você toca, com ou sem sinal.',
    button: 'Começar um treino',
  },
  bodyweight: {
    title: 'Quanto você pesa?',
    body: 'Uma barra fixa é você movendo o próprio peso corporal. Sem esse número, essas séries podem ser registradas mas não medidas, então não contariam para nada.',
    label: (unit: string) => `Peso corporal (${unit})`,
  },
  unknownExercise: 'Exercício desconhecido',
  thatLift: 'esse exercício',
  elsewhere: (gym: string | null, set: string) =>
    `Primeira vez nesta máquina aqui. Da última vez ${gym === null ? 'em outro lugar' : `na ${gym}`}: ${set}.`,
  noSets: 'Nenhuma série ainda.',
  advice: (reps: number, weight: string, next: string) =>
    `${String(reps)} reps com ${weight}: tente ${next} da próxima vez`,
  warmUp: 'Aquecimento',
  addSet: 'Adicionar série',
  ramp: (count: number, from: string, to: string) =>
    `Adiciona ${String(count)} ${count === 1 ? 'série' : 'séries'} de ${from} até ${to}`,
  effort: {
    question: 'Nessa última série, quantas mais você conseguiria fazer?',
    none: 'Nenhuma',
  },
  set: {
    deleteRow: (title: string) => `Excluir ${lower(title)}`,
    dropAfter: (title: string) => `Drop depois de ${lower(title)}`,
    drop: 'Drop',
    last: (set: string) => `Última: ${set}`,
    load: (title: string) => `Carga de ${lower(title)}`,
    bodyweight: 'Peso corporal',
    addedWeight: 'Peso adicional',
    durationFormat: (title: string) => `Formato de duração de ${lower(title)}`,
    seconds: 'Segundos',
    minSec: 'Min + s',
    minutes: 'Minutos',
    reps: 'Reps',
    saveRow: (title: string) => `Salvar ${lower(title)}`,
    markSkipped: 'Marcar como pulada',
    needsReps: 'Digite pelo menos 1 repetição para marcar esta série.',
    needsTime: 'Digite pelo menos 1 segundo para marcar esta série.',
  },
  check: {
    title: 'Está certo?',
    jump: (weight: string, best: string) =>
      `${weight} está muito acima do seu recorde de ${best}. Se registrar, vira um recorde pessoal.`,
    heavy: (weight: string) =>
      `${weight} é mais do que quase ninguém levanta. Se registrar, vira um recorde pessoal.`,
    reps: (reps: number) =>
      `${String(reps)} repetições em uma série é muito. Confira antes que conte.`,
    confirm: 'Registrar',
    fix: 'Corrigir',
  },
  rows: {
    warmup: (number: number) => `Aquecimento ${String(number)}`,
    set: (number: number) => `Série ${String(number)}`,
    drop: 'Drop',
    dropNumbered: (number: number) => `Drop ${String(number)}`,
    tickWarmup: (done: boolean, number: number) =>
      `${done ? 'Desfazer' : 'Concluir'} aquecimento ${String(number)}`,
    tickDrop: (done: boolean, number: number, parent: number) =>
      `${done ? 'Desfazer' : 'Concluir'} drop ${String(number)} da série ${String(parent)}`,
    tickSet: (done: boolean, number: number) =>
      `${done ? 'Desfazer' : 'Concluir'} série ${String(number)}`,
  },
  stillTraining: {
    title: 'Ainda treinando?',
    idle: (minutes: number) =>
      `Nada marcado há ${String(minutes)} ${minutes === 1 ? 'minuto' : 'minutos'}.`,
    keepGoing: 'Continuar',
    finish: 'Concluir',
  },
  rest: {
    over: 'Descanso encerrado',
    resting: 'Descansando',
    less: (label: string) => `${label} a menos de descanso`,
    more: (label: string) => `${label} a mais de descanso`,
    dismiss: 'Dispensar',
  },
  record: {
    badge: 'PR',
    heaviestShort: 'A mais pesada',
    heaviest: (name: string) => `${name}: sua série mais pesada`,
    heaviestDetail: (now: string, gain: string, unit: string) =>
      `${now} ${unit}: ${gain} ${unit} acima da sua melhor marca anterior.`,
    bestShort: 'Sua melhor série',
    best: (name: string) => `${name}: sua melhor série`,
    bestDetail: (now: string, before: string, unit: string, beforeUnit: string) =>
      `Máximo estimado ${now} ${unit}, antes ${before} ${beforeUnit}.`,
  },
  open: {
    past: 'Termine de registrar seu treino anterior',
    stale: 'Você deixou um treino aberto',
    continue: 'Continuar seu treino',
    exercises: (count: number) => plural(count, 'exercício', 'exercícios'),
    setsDone: (count: number) => plural(count, 'série feita', 'séries feitas'),
    justStarted: 'acabou de começar',
    openFor: (hours: number) => `aberto há ${plural(hours, 'hora', 'horas')}`,
    minutesIn: (minutes: number) => `há ${String(minutes)} min`,
    hoursIn: (hours: number, minutes: number) => `há ${String(hours)} h ${String(minutes)} min`,
  },
  autoFinish: {
    title: 'Encerramos seu treino',
    closed: (when: string) =>
      `Nada foi marcado por um tempo, então seu treino de ${when} foi encerrado para você.`,
    closedAt: (when: string, at: string) =>
      `Nada foi marcado por um tempo, então seu treino de ${when} foi encerrado na sua última série, às ${at}.`,
    allSaved: 'Tudo o que você registrou está salvo.',
    saved: (parts: string) => `Salvo: ${parts}.`,
    exercises: (count: number) => plural(count, 'exercício', 'exercícios'),
    sets: (count: number) => plural(count, 'série', 'séries'),
    bouts: (count: number) => plural(count, 'bloco', 'blocos'),
    minutes: (minutes: number) => `${String(minutes)} min`,
    okay: 'Ok',
    see: 'Ver',
  },
  cardio: {
    label: 'Cardio',
    needsBodyweight:
      'As calorias precisam do seu peso corporal. Adicione-o em Seu perfil e elas serão calculadas.',
    noBouts: 'Nenhum bloco ainda. Adicione um quando subir na máquina.',
    addBout: 'Adicionar bloco',
    timeFormat: 'O tempo é em minutos, ou minutos:segundos como 25:30.',
    notANumber: (field: string) => `${field} não é um número.`,
    bout: (number: number) => `Bloco ${String(number)}`,
    boutLabel: (number: number) => `bloco ${String(number)}`,
    time: 'Tempo',
    start: 'Iniciar',
    stop: 'Parar',
    calories: 'Calorias',
    fromMachine: 'Da máquina. Apague para usar a estimativa.',
    addTime: 'Adicione o tempo para estimá-las, ou digite o que a máquina mostra.',
    estimate: (calories: string, source: string) =>
      `${calories}. ${source} Digite o número da máquina para usá-lo no lugar.`,
    undo: (label: string) => `Desfazer ${label}`,
    complete: (label: string) => `Concluir ${label}`,
    saveWithoutTicking: 'Salvar sem marcar',
    fields: {
      distance: (unit: string) => `Distância (${unit})`,
      speed: (unit: string) => `Velocidade (${unit})`,
      incline: 'Inclinação (%)',
      level: 'Nível',
      watts: 'Watts médios',
      floors: 'Andares',
    },
    sources: {
      machine: 'Da máquina.',
      treadmill: 'Estimado pela velocidade e inclinação.',
      power: 'Estimado pelos watts.',
      pace: 'Estimado pelo seu ritmo.',
      stairs: 'Estimado pelos andares subidos.',
      met: (better: string) => `Uma estimativa aproximada só pelo tempo. ${better}`,
    },
    better: {
      treadmill: 'Adicione a velocidade para uma melhor.',
      bike: 'Adicione os watts para uma melhor.',
      rower: 'Adicione a distância ou os watts para uma melhor.',
      ski_erg: 'Adicione a distância ou os watts para uma melhor.',
      stair_climber: 'Adicione os andares para uma melhor.',
    },
    floors: (count: number) => `${String(count)} andares`,
    nothing: 'Nada registrado',
  },
  gym: {
    change: (name: string | null) => `${name ?? 'Nenhuma academia escolhida'}, trocar academia`,
    choose: 'Escolha uma academia',
    where: 'Onde você está treinando?',
    which: 'Qual academia',
    compared:
      'Máquinas e polias são comparadas com o próprio histórico em cada academia. Séries que você ainda não fez passam para os números da nova academia.',
    manage: 'Gerenciar academias',
  },
  startDialog: {
    title: 'Começar um treino',
    routines: 'Suas rotinas',
    chooseRoutine: 'Escolha uma rotina',
    loading: 'Carregando rotinas…',
    none: 'Nenhuma rotina ainda. Conclua um treino e salve como rotina para usar aqui da próxima vez.',
    settingUp: 'Preparando…',
    blank: 'Começar um treino em branco',
    dontShow: 'Não mostrar de novo',
    dontShowHint: 'Sempre começar treinos em branco. Mude isso em Ajustes.',
    saved: 'Rotinas salvas',
    page: (index: number, total: number) =>
      `Página de rotinas ${String(index)} de ${String(total)}`,
    start: (name: string) => `Começar ${name}`,
    choosePage: 'Escolher página de rotinas',
    showPage: (index: number, total: number) =>
      `Mostrar página de rotinas ${String(index)} de ${String(total)}`,
  },
  plates: {
    loaded: (plates: string) => `Uma barra com ${plates} em cada lado`,
    empty: (bar: string, unit: string) => `Uma barra vazia de ${bar} ${unit}`,
    bar: (weight: string, unit: string) => `Barra de ${weight} ${unit}`,
    lighter: (bar: string) => `Mais leve que uma ${lower(bar)}`,
    just: (bar: string) => `Só a ${lower(bar)}`,
    eachSide: 'Cada lado',
  },
  previousSet: {
    seconds: (reps: number) => `${String(reps)} s`,
    reps: (reps: number) => `${String(reps)} ${reps === 1 ? 'rep.' : 'reps.'}`,
  },
};
