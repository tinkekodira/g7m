import type { Messages } from '../en/index.js';

export const tour: Messages['tour'] = {
  stops: [
    {
      title: 'Empieza un entrenamiento',
      text: '¿Listo para entrenar? Empieza aquí tu entrenamiento o vuelve a una sesión en curso.',
    },
    {
      title: 'Progreso e historial',
      text: 'Abre Progreso desde Inicio para revisar tu entrenamiento y volver a sesiones anteriores.',
    },
    {
      title: 'Biblioteca de ejercicios',
      text: 'Explora los ejercicios desde Inicio para buscar en toda la biblioteca y encontrar consejos de técnica para cada movimiento.',
    },
    {
      title: 'Tu cuerpo 3D interactivo',
      text: 'Encuentra el cuerpo 3D en Aprender. Toca un músculo para descubrir ejercicios que lo trabajan.',
    },
    {
      title: 'Entrena con amigos',
      text: 'Añade amigos aquí, comparad vuestro entrenamiento y retaos.',
    },
  ],
  position: (index: number, total: number) => `${String(index)} de ${String(total)}`,
  skip: 'Saltar recorrido',
  opening: 'Abriendo esta parada… Puedes continuar o saltarla.',
  finish: 'Terminar recorrido',
  replay: 'Hacer el recorrido por la app',
  invitationTitle: 'Orientarte en la app',
  invitationBody: 'Cinco paradas rápidas para descubrir tus herramientas de entrenamiento.',
  take: 'Hacer un recorrido rápido',
  dismissLabel: 'Descartar la invitación al recorrido',
  dismiss: 'Descartar',
};
