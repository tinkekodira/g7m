import type { Messages } from '../en/index.js';

export const tour: Messages['tour'] = {
  stops: [
    {
      title: 'Training starten',
      text: 'Bereit? Starte hier dein Training oder kehre zu einer laufenden Einheit zurück.',
    },
    {
      title: 'Fortschritt & Verlauf',
      text: 'Öffne „Fortschritt“ auf der Startseite, um dein Training auszuwerten und frühere Einheiten anzusehen.',
    },
    {
      title: 'Übungsbibliothek',
      text: 'Durchsuche von der Startseite aus die ganze Bibliothek und finde Technik-Tipps zu jeder Bewegung.',
    },
    {
      title: 'Dein interaktiver 3D-Körper',
      text: 'Den 3D-Körper findest du unter „Lernen“. Tippe auf einen Muskel, um Übungen dafür zu entdecken.',
    },
    {
      title: 'Mit Freunden trainieren',
      text: 'Füge hier Freunde hinzu, vergleicht euer Training und fordert euch gegenseitig heraus.',
    },
  ],
  position: (index: number, total: number) => `${String(index)} von ${String(total)}`,
  skip: 'Tour überspringen',
  opening: 'Dieser Halt wird geöffnet… Du kannst weitermachen oder überspringen.',
  finish: 'Tour beenden',
  replay: 'App-Tour starten',
  invitationTitle: 'Finde dich zurecht',
  invitationBody: 'Fünf kurze Stationen zu deinen Trainingswerkzeugen.',
  take: 'Kurze Tour machen',
  dismissLabel: 'Einladung zur App-Tour schließen',
  dismiss: 'Schließen',
};
