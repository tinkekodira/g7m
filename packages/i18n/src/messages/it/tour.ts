import type { Messages } from '../en/index.js';

export const tour: Messages['tour'] = {
  stops: [
    {
      title: 'Inizia un allenamento',
      text: 'Pronto ad allenarti? Inizia qui il tuo allenamento o torna a una sessione in corso.',
    },
    {
      title: 'Progressi e storico',
      text: 'Apri Progressi dalla Home per rivedere il tuo allenamento e gli allenamenti passati.',
    },
    {
      title: 'Libreria esercizi',
      text: 'Sfoglia gli esercizi dalla Home per cercare nell’intera libreria e trovare consigli per ogni movimento.',
    },
    {
      title: 'Il tuo corpo 3D interattivo',
      text: 'Trovi il corpo 3D in Impara. Tocca un muscolo per scoprire gli esercizi che lo allenano.',
    },
    {
      title: 'Allenati con gli amici',
      text: 'Aggiungi amici qui, confrontate gli allenamenti e sfidatevi.',
    },
  ],
  position: (index: number, total: number) => `${String(index)} di ${String(total)}`,
  skip: 'Salta il tour',
  opening: 'Apertura di questa tappa… Puoi continuare o saltarla.',
  finish: 'Termina il tour',
  replay: 'Fai il tour dell’app',
  invitationTitle: 'Orientati nell’app',
  invitationBody: 'Cinque tappe veloci per scoprire i tuoi strumenti di allenamento.',
  take: 'Fai un tour veloce',
  dismissLabel: 'Ignora l’invito al tour',
  dismiss: 'Ignora',
};
