import type { Messages } from '../en/index.js';

export const app: Messages['app'] = {
  accountReady: {
    title: 'Preparando sua conta',
    notArrived:
      'Seu perfil ainda não chegou a este dispositivo. Verifique sua conexão e tente de novo.',
  },
  update: {
    ready: 'Uma nova versão do g7m está pronta.',
  },
  tabs: {
    main: 'Principal',
    learn: 'Aprender',
    friends: 'Amigos',
    home: 'Início',
    profile: 'Perfil',
    settings: 'Ajustes',
    needsAttention: '(precisa de atenção)',
  },
  loadingStates: {
    account: 'Carregando sua conta…',
    train: 'Treinar',
    workout: 'Carregando treino…',
    yourProfile: 'Seu perfil',
    exercises: 'Exercícios',
    profile: 'Carregando seu perfil…',
    exerciseList: 'Carregando exercícios…',
    bodyView: 'Carregando a visão do corpo…',
    leaderboard: 'Carregando ranking…',
    requests: 'Carregando solicitações…',
    friends: 'Carregando amigos…',
    numbers: 'Carregando seus números…',
    thisMonth: 'Carregando este mês…',
  },
  crash: {
    updatedTitle: 'O g7m foi atualizado',
    updatedDetail:
      'Uma nova versão chegou enquanto esta tela estava aberta, e parte dela não está mais onde a versão antiga espera. Recarregue para concluir a atualização. Nada do que você registrou foi perdido.',
    bugTitle: 'Algo deu errado nesta tela',
    bugDetailInWorkout:
      'Seu treino está seguro. Cada série é salva neste dispositivo assim que você a marca, então você pode reabrir o treino no Início e continuar de onde parou.',
    bugDetail:
      'Tudo o que você registrou está salvo neste dispositivo, então nada foi perdido. Tente de novo ou volte ao Início.',
    goToHome: 'Ir para o Início',
    reloadApp: 'Recarregar o app',
    reportDetails: 'Detalhes para um relatório de erro',
    reportSafe: 'Nada aqui identifica você, então é seguro colar em uma mensagem.',
    copied: 'Copiado',
    copyDetails: 'Copiar detalhes',
    copyFailed:
      'Este navegador não permitiu copiar. Toque e segure o texto acima para selecioná-lo.',
  },
  serverErrors: {
    clockSkew:
      'O relógio deste dispositivo está adiantado em relação ao servidor, então o token de login parece vir do futuro. Ative Ajustes → Geral → Data e Hora → Definir Automaticamente e reabra o app.',
    sessionExpired: 'Sua sessão expirou. Saia e entre de novo.',
    offline:
      'Não foi possível acessar o servidor. Seus treinos estão salvos neste dispositivo e serão sincronizados quando você estiver online de novo.',
    noAccess: 'Você não tem acesso a isso. Se acabou de entrar, tente reabrir o app.',
    gone: 'Esse registro não existe mais.',
  },
};
