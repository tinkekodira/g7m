import type { Messages } from '../en/index.js';

export const tour: Messages['tour'] = {
  stops: [
    {
      title: 'Comece um treino',
      text: 'Pronto para treinar? Comece seu treino aqui ou volte a uma sessão em andamento.',
    },
    {
      title: 'Progresso e histórico',
      text: 'Abra Progresso no Início para revisar seu treino e rever treinos anteriores.',
    },
    {
      title: 'Biblioteca de exercícios',
      text: 'Explore os exercícios no Início para pesquisar a biblioteca completa e encontrar dicas para cada movimento.',
    },
    {
      title: 'Seu corpo 3D interativo',
      text: 'Encontre o corpo 3D em Aprender. Toque em um músculo para descobrir exercícios que o trabalham.',
    },
    {
      title: 'Treine com amigos',
      text: 'Adicione amigos aqui, comparem os treinos e desafiem uns aos outros.',
    },
  ],
  position: (index: number, total: number) => `${String(index)} de ${String(total)}`,
  skip: 'Pular tour',
  opening: 'Abrindo esta parada… Você pode continuar ou pular.',
  finish: 'Concluir tour',
  replay: 'Fazer o tour do app',
  invitationTitle: 'Conheça o app',
  invitationBody: 'Cinco paradas rápidas para descobrir suas ferramentas de treino.',
  take: 'Fazer um tour rápido',
  dismissLabel: 'Dispensar convite para o tour',
  dismiss: 'Dispensar',
};
