import type { Messages } from '../en/index.js';

export const library: Messages['library'] = {
  addExercise: 'Adicionar um exercício',
  exercises: 'Exercícios',
  superset: 'Superset',
  supersetOn: 'Escolha na ordem do treino.',
  supersetOff: 'Um atrás do outro, depois descanso.',
  search: 'Pesquisar',
  searchPlaceholder: 'Agachamento, supino, remada…',
  equipment: 'Equipamento',
  selected: (count: number) => ` · ${String(count)} selecionados`,
  equipmentHint:
    'Sem seleção, aparece tudo. Selecionando alguns, só aparece o que dá para fazer exatamente com eles: cada item de que um exercício precisa tem que estar marcado.',
  count: (count: number) => (count === 1 ? '1 exercício' : `${String(count)} exercícios`),
  bestMatches: 'Melhores resultados primeiro',
  mostUsed: 'Mais usados primeiro · Últimos 90 dias',
  chartKey:
    'Carga por treino · Últimas 6 sessões. Melhor série válida; + adicional, − assistência, PC peso corporal.',
  confirm: (count: number) => `Confirmar (${String(count)})`,
  cardio: 'Cardio',
  compound: 'Composto',
  isolation: 'Isolado',
  recommended: 'Recomendado',
  noneOnDevice:
    'Ainda não há exercícios neste dispositivo. Eles chegam com a primeira sincronização: abra o app uma vez com conexão e eles ficam para sempre.',
  noMatch: 'Nada corresponde a todos esses filtros.',
  clearFilters: 'Limpar filtros',
  muscleFilters: 'Filtros de músculos',
  all: 'Todos',
  favourite: 'Favorito',
  favouriteMark: '(favorito)',
  kit: {
    label: 'Com o que você treina',
    bodyweight: 'Peso corporal',
    both: 'Tudo',
    gym: 'Academia',
  },
  stepper: {
    decrease: (label: string) => `Diminuir ${label}`,
    increase: (label: string) => `Aumentar ${label}`,
  },
  detail: {
    missing: (slug: string) =>
      `Não há nenhum exercício chamado ${slug} neste dispositivo. Ele pode ter sido renomeado ou ainda não ter sido sincronizado.`,
    unknownMuscle: 'Músculo desconhecido',
    roles: { primary: 'Motor principal', secondary: 'Auxilia', stabilizer: 'Estabiliza' },
    alsoCalled: (aliases: string) => `Também chamado de ${aliases}`,
    difficulty: { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' },
    oneSide: 'Um lado de cada vez',
    timed: 'Mantido por tempo',
    startingPoint: 'Ponto de partida',
    seconds: ' s',
    suggestedHold: 'Tempo sugerido',
    suggestedReps: 'Repetições sugeridas',
    rest: 'Descanso entre séries',
    restCompound: 'Mais longo: é um composto',
    restIsolation: 'Mais curto: é um isolado',
    restMinutes: (minutes: number) => `${String(minutes)} min`,
    restSeconds: (seconds: number) => `${String(seconds)} s`,
    cues: 'Dicas',
    muscles: 'Músculos trabalhados',
    cardioMuscles:
      'O cardio trabalha o coração e os pulmões mais do que qualquer músculo, então não conta no mapa do corpo: vinte minutos numa máquina não são vinte séries de nada.',
    notRecorded: 'Não registrado para este exercício.',
    howTo: 'Como fazer',
    mistakes: 'Erros comuns',
    equipment: 'Equipamento',
    noEquipment: 'Nada.',
    whatYouLog: 'O que você registra',
    logged: (fields: string) =>
      `${fields} As calorias são estimadas a partir disso e do seu peso corporal, ou você pode digitar o número da máquina.`,
    itsTime: 'o tempo',
    eachBout: (fields: readonly string[]) => {
      const spoken =
        fields.length === 1
          ? fields[0]
          : `${fields.slice(0, -1).join(', ')} e ${fields.at(-1) ?? ''}`;
      return `Cada bloco registra ${spoken ?? ''}.`;
    },
    video: 'Vídeo',
    videoNeedsConnection: 'Precisa de conexão. Tudo acima desta linha, não.',
    oneRepMax: 'Seu 1RM estimado',
    on: (set: string, date: string) => `${set} em ${date}`,
    nothingRecent: (weeks: number, source: string) =>
      `Nada nas últimas ${String(weeks)} semanas, então esta é a sua melhor marca de todas, de ${source}.`,
    from: (source: string) => `De ${source}.`,
    bodyweightIncluded: ' Seu peso corporal está incluído.',
    bestEver: (estimate: string, source: string) => `Melhor de todas: ${estimate}, de ${source}.`,
    epley:
      'Calculado com a fórmula de Epley a partir da sua melhor série de 12 repetições ou menos. Uma estimativa para escolher cargas de trabalho, não um número para ir testar.',
    seeTrend: 'Ver a evolução',
    playDemo: 'Reproduzir demonstração',
    pauseDemo: 'Pausar demonstração',
    musclesLabel: (muscles: string) =>
      `Músculos trabalhados: ${muscles}. Vistas de frente e de costas.`,
    front: 'Frente',
    back: 'Costas',
  },
  learn: {
    title: 'Aprender',
    modes: { explore: 'Explorar', heatmap: 'O que treinei' },
    heatmapIntro: (weeks: number) => `O que você treinou em ${String(weeks)} semanas.`,
    exploreIntro: 'Toque em um músculo para ver o que o treina.',
    plates: 'Anilhas',
    noMuscles:
      'Ainda não há músculos neste dispositivo, então não dá para tocar em nada no modelo. Eles chegam com a primeira sincronização: abra o app uma vez com conexão e eles ficam para sempre.',
    bodyView: 'Visão do corpo',
    hint: 'Arraste para girar. Toque em um músculo.',
    chooseMuscle: 'Escolha um músculo',
    muscleExercises: 'Exercícios do músculo',
    explore: 'Explorar músculos',
    exploreHint: 'Toque no corpo ou escolha um músculo para encontrar exercícios.',
    browseAll: 'Ver todos os exercícios',
    worthAdding: 'Vale a pena acrescentar',
    lastWeeks: (weeks: number) => `Últimas ${String(weeks)} semanas`,
    worthAddingHint:
      'Os grupos mais atrasados em relação à meta semanal, e um exercício que trabalha cada um.',
    behind: (group: string, sets: number) => `${group} · faltam ${String(sets)} séries`,
    working: 'Calculando o que você treinou…',
    heatNote:
      'A cor é o volume em relação ao seu músculo mais trabalhado: o que você mais treinou, não se treinou o bastante.',
    heatEmpty: 'Nada registrado nas últimas quatro semanas. Conclua um treino e ele aparece aqui.',
    placeholderModel:
      'A figura é gerada a partir de origens e inserções: o modelo anatômico licenciado não está nesta versão. Todo o resto nesta tela é real.',
    sculptedModel: 'Um corpo esculpido, dividido entre os músculos que chegam à pele.',
    notInCatalogue: 'Esse músculo ainda não está no catálogo deste dispositivo.',
    clear: 'Limpar',
    nothingTrains: 'Nada no catálogo o treina ainda.',
    alsoWorked: 'Também trabalhados',
    alsoWorkedHint: 'Trabalhado aqui como músculo de apoio, não como o principal.',
  },
  plates: {
    title: 'Calculadora de anilhas',
    intro: 'O que vai em cada lado, nos tamanhos que você reconhece.',
    weightOnBar: 'Peso na barra',
    ezWeighs: 'A barra W desta academia pesa',
    hidden: (count: number) =>
      `${count === 1 ? 'Uma anilha está oculta' : `${String(count)} anilhas estão ocultas`} porque sua academia não ${count === 1 ? 'a' : 'as'} tem.`,
    bar: 'Barra',
    ezBar: 'Barra W',
    tooMuch:
      'É mais anilha do que a manga desta barra comporta. Tente menos anilhas, um peso menor ou uma barra mais longa.',
    justBar: (weight: string, unit: string) => `Só a barra: ${weight} ${unit}, sem nada.`,
    lighter: (weight: string, unit: string) =>
      `Mais leve que a barra sozinha, que pesa ${weight} ${unit}.`,
    eachEnd: 'Cada lado',
    onBar: (weight: string, unit: string) => `numa barra de ${weight} ${unit}`,
    closest: (total: string, short: string, unit: string) =>
      `: o mais perto que estas anilhas chegam é ${total} ${unit}, faltando ${short} ${unit}`,
    colours: 'As cores',
    coloursHint: 'Qual anilha é qual, na barra e no suporte.',
    available: 'Anilhas disponíveis',
    availableHint:
      'Quais anilhas esta academia tem. Uma anilha desmarcada fica fora da barra, da conta e das cores acima.',
  },
};
