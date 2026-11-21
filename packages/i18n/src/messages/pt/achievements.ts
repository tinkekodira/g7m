import type { Messages } from '../en/index.js';

type Units = 'metric' | 'imperial';

const weight = (units: Units, kg: string, lb: string): string =>
  units === 'imperial' ? `${lb} lb` : `${kg} kg`;

const tonnage = (units: Units, tonnes: string, comparison: string): string =>
  `Levante ${tonnes} ${units === 'imperial' ? 'toneladas curtas' : 'toneladas'} no total, ${comparison}`;

export const achievements: Messages['achievements'] = {
  badges: {
    'day-one': { name: 'Dia um', description: 'Conclua seu primeiro treino' },
    'double-digits': { name: 'Dois dígitos', description: 'Conclua 10 treinos' },
    'quarter-century': { name: 'Quarto de século', description: 'Conclua 25 treinos' },
    'fifty-strong': { name: 'Cinquenta', description: 'Conclua 50 treinos' },
    centurion: { name: 'Centurião', description: 'Conclua 100 treinos' },
    'iron-veteran': { name: 'Veterano do ferro', description: 'Conclua 250 treinos' },
    lifer: { name: 'Para a vida toda', description: 'Conclua 500 treinos' },
    'record-breaker': { name: 'Quebra-recordes', description: 'Bata seu primeiro recorde pessoal' },
    'pr-machine': { name: 'Máquina de recordes', description: 'Bata 25 recordes pessoais' },
    'heavy-mover': {
      name: 'Peso pesado',
      description: (units: Units) => tonnage(units, '10', 'cerca de dois elefantes'),
    },
    'whale-of-a-time': {
      name: 'Baleia-azul',
      description: (units: Units) => tonnage(units, '100', 'cerca de uma baleia-azul'),
    },
    'mountain-mover': {
      name: 'Move montanhas',
      description: (units: Units) => tonnage(units, '1.000', 'mais que dois jumbos'),
    },
    'plate-club': {
      name: 'Clube da anilha',
      description: (units: Units) => `Supino com ${weight(units, '60', '135')}`,
    },
    'two-plate-bench': {
      name: 'Supino de duas anilhas',
      description: (units: Units) => `Supino com ${weight(units, '100', '225')}`,
    },
    'three-plate-bench': {
      name: 'Supino de três anilhas',
      description: (units: Units) => `Supino com ${weight(units, '140', '315')}`,
    },
    'two-plate-squat': {
      name: 'Agachamento de duas anilhas',
      description: (units: Units) => `Agachamento livre com ${weight(units, '100', '225')}`,
    },
    'three-plate-squat': {
      name: 'Agachamento de três anilhas',
      description: (units: Units) => `Agachamento livre com ${weight(units, '140', '315')}`,
    },
    'four-plate-squat': {
      name: 'Agachamento de quatro anilhas',
      description: (units: Units) => `Agachamento livre com ${weight(units, '180', '405')}`,
    },
    'three-plate-pull': {
      name: 'Terra de três anilhas',
      description: (units: Units) => `Levantamento terra com ${weight(units, '140', '315')}`,
    },
    'four-plate-pull': {
      name: 'Terra de quatro anilhas',
      description: (units: Units) => `Levantamento terra com ${weight(units, '180', '405')}`,
    },
    'five-plate-pull': {
      name: 'Terra de cinco anilhas',
      description: (units: Units) => `Levantamento terra com ${weight(units, '220', '495')}`,
    },
    'plate-overhead': {
      name: 'Anilha acima da cabeça',
      description: (units: Units) => `Desenvolvimento militar com ${weight(units, '60', '135')}`,
    },
    'total-club': {
      name: (units: Units) => (units === 'imperial' ? 'O clube das 1.000 lb' : 'O clube dos 500'),
      description: (units: Units) =>
        `Seus melhores supino, agachamento e terra somam ${weight(units, '500', '1.000')}`,
    },
    'bench-your-body': {
      name: 'Seu peso no supino',
      description: 'Faça supino com o seu próprio peso corporal',
    },
    'squat-and-a-half': {
      name: 'Agachamento e meio',
      description: 'Agachamento livre com 1,5 vez o seu peso corporal',
    },
    'double-trouble': {
      name: 'Dose dupla',
      description: 'Levantamento terra com o dobro do seu peso corporal',
    },
    'ten-clean': {
      name: 'Dez limpas',
      description: '10 barras fixas em uma série, sem ajuda',
    },
    'gym-rat': { name: 'Rato de academia', description: 'Conclua 5 treinos em uma semana' },
    'no-days-off': { name: 'Sem folga', description: 'Treine 7 dias seguidos' },
    'on-a-roll': {
      name: 'Embalado',
      description: 'Cumpra os dias do seu objetivo por 4 semanas seguidas',
    },
    'habit-formed': {
      name: 'Hábito formado',
      description: 'Cumpra os dias do seu objetivo por 12 semanas seguidas',
    },
    'half-year-hero': {
      name: 'Herói do semestre',
      description: 'Cumpra os dias do seu objetivo por 26 semanas seguidas',
    },
    'year-rounder': {
      name: 'O ano todo',
      description: 'Cumpra os dias do seu objetivo por 52 semanas seguidas',
    },
    'comeback-kid': {
      name: 'A volta',
      description: 'Volte depois de 30 dias ou mais parado',
    },
    'early-bird': { name: 'Madrugador', description: 'Comece a treinar antes das 6h' },
    'night-owl': { name: 'Coruja', description: 'Treine entre meia-noite e 4h' },
    'weekend-warrior': {
      name: 'Guerreiro de fim de semana',
      description: 'Treine no sábado e no domingo do mesmo fim de semana',
    },
    'new-year-same-me': { name: 'Ano novo, mesmo eu', description: 'Treine em 1º de janeiro' },
    'jingle-lifts': { name: 'Natal de ferro', description: 'Treine no dia de Natal' },
    'leap-lifter': { name: 'Ano bissexto', description: 'Treine em 29 de fevereiro' },
    'heart-starter': { name: 'Coração ligado', description: 'Registre seu primeiro cardio' },
    'the-2k': { name: 'Os 2K', description: 'Reme 2.000 m de uma vez' },
    'five-k-finisher': {
      name: '5K concluídos',
      description: 'Corra ou caminhe 5 km de uma vez na esteira',
    },
    marathoner: {
      name: 'Maratonista',
      description: 'Percorra 42,2 km de cardio no total, uma maratona',
    },
    'road-tripper': {
      name: 'Pé na estrada',
      description: (units: Units) =>
        `Percorra ${units === 'imperial' ? '60 milhas' : '100 km'} de cardio no total`,
    },
    everest: {
      name: 'Everest',
      description: 'Suba 8.849 m no simulador de escada e na inclinação da esteira',
    },
    furnace: { name: 'Fornalha', description: 'Queime 500 kcal de cardio em um treino' },
    'machine-collector': {
      name: 'Colecionador de máquinas',
      description: 'Use as cinco máquinas de cardio',
    },
    'hybrid-athlete': {
      name: 'Atleta híbrido',
      description: 'Faça musculação e cardio no mesmo treino',
    },
    explorer: { name: 'Explorador', description: 'Registre 25 exercícios diferentes' },
    'lit-up': {
      name: 'Aceso',
      description: 'Treine todos os grupos musculares em uma semana',
    },
    'birthday-pump': { name: 'Pump de aniversário', description: 'Treine no seu aniversário' },
  },
};
