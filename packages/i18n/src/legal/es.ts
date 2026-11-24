/** Política de privacidad y eliminación de la cuenta, en español. Traducido de `en.ts`. ADR-0189. */
import { BACKUP_RETENTION, CONTACT_EMAIL, CONTROLLER_ADDRESS, CONTROLLER_NAME } from './details.js';
import type { LegalText } from './types.js';

export const legal: LegalText = {
  chrome: {
    back: 'Volver',
    openApp: 'Abrir g7m',
    updated: (date) => `Última actualización: ${date}`,
    contents: 'Contenido',
    inShort: 'En resumen',
    contact: 'Preguntas sobre tus datos',
    translationNote:
      'Esto es una traducción. Si difiere de la versión en inglés, prevalece la versión en inglés.',
  },

  privacy: {
    title: 'Política de privacidad',
    summary: [
      'g7m guarda lo que registras para mostrártelo en cada dispositivo en el que inicies sesión. No se usa para nada más.',
      'No hay anuncios, ni analíticas, ni seguimiento, y nada se vende ni se comparte con fines publicitarios.',
      'Tus datos se guardan en la UE, en Supabase (Fráncfort) y PowerSync (Irlanda).',
      'Desde Ajustes puedes descargarlo todo en un archivo y eliminar tu cuenta con todos sus datos cuando quieras.',
    ],
    sections: [
      {
        id: 'who',
        heading: 'Quién es responsable',
        blocks: [
          `g7m lo desarrolla ${CONTROLLER_NAME}, ${CONTROLLER_ADDRESS}, Croacia, responsable del tratamiento de tus datos personales según el Reglamento General de Protección de Datos de la UE (RGPD). Escribe a ${CONTACT_EMAIL} para cualquier duda sobre esta política.`,
          'Esta política cubre la app web de g7m y las apps de g7m para Android e iOS, que son la misma app.',
        ],
      },
      {
        id: 'collected',
        heading: 'Qué datos recogemos',
        blocks: [
          'Solo lo que introduces, más lo necesario para iniciar tu sesión y mantener tus dispositivos sincronizados:',
          {
            terms: [
              {
                term: 'Tu cuenta',
                detail:
                  'Tu correo electrónico y, si usas una, tu contraseña, guardada solo como hash irreversible. Si continúas con Google, Google nos indica tu correo y el ID de tu cuenta de Google, y puede enviar también tu nombre y tu foto de perfil, que la app no usa. También guardamos cuándo se creó la cuenta y cuándo iniciaste sesión por última vez.',
              },
              {
                term: 'Tu perfil',
                detail:
                  'El nombre que elijas y, si los indicas, tu fecha de nacimiento, sexo, país, peso corporal y nivel de experiencia. También tus ajustes: unidades, idioma, descansos, inicio de semana, ejercicios favoritos, gimnasios y qué logros ya has visto.',
              },
              {
                term: 'Tu entrenamiento',
                detail:
                  'Entrenamientos con sus horas, notas y gimnasio; los ejercicios y series que contienen (peso, repeticiones, esfuerzo y, en cardio, tiempo, distancia, velocidad, inclinación, resistencia, potencia, pisos y calorías); récords personales, rutinas, objetivos de entrenamiento y tu nivel.',
              },
              {
                term: 'Medidas corporales',
                detail:
                  'Pesajes, altura, porcentaje de grasa corporal, nivel de actividad y notas, solo si los introduces.',
              },
              {
                term: 'Amigos, si los usas',
                detail:
                  'Tu código de amigo, las solicitudes que envías y aceptas, los retos con amigos y sus resultados, tus dos interruptores para compartir, cuándo se abrió la app por última vez y si estás entrenando ahora mismo (como un ID opaco que caduca a los cinco minutos, nunca qué estás haciendo).',
              },
              {
                term: 'Comentarios que envías',
                detail:
                  'La categoría y el mensaje que escribes en Ajustes, con la versión de la app y el tipo de dispositivo.',
              },
              {
                term: 'Registros técnicos',
                detail:
                  'Como cualquier web, los servicios indicados abajo registran la dirección IP, el navegador o dispositivo y la hora de cada petición. Guardan esos registros poco tiempo, por seguridad y para corregir fallos, y no se usan para crear un perfil tuyo.',
              },
            ],
          },
          'No recogemos tu ubicación (el país lo eliges tú), tus contactos, tus fotos ni nada de otras apps.',
        ],
      },
      {
        id: 'why',
        heading: 'Para qué y con qué base legal',
        blocks: [
          {
            terms: [
              {
                term: 'Para ofrecer la app (art. 6.1.b RGPD, contrato)',
                detail:
                  'Tu cuenta, tu perfil y tu entrenamiento son la app: se guardan para que puedas registrar entrenamientos, ver tu historial y progreso, recibir planes y sugerencias y usar la misma cuenta en varios dispositivos. Las funciones de amigos solo funcionan cuando añades a un amigo, y solo muestran lo que permiten tus interruptores para compartir.',
              },
              {
                term: 'Medidas corporales y otros datos de salud (art. 9.2.a RGPD, consentimiento explícito)',
                detail:
                  'El peso, la altura y la grasa corporal pueden ser datos de salud. Son opcionales: das tu consentimiento al introducirlos y puedes retirarlo cuando quieras borrándolos o eliminando tu cuenta. Retirarlo no afecta a lo hecho antes.',
              },
              {
                term: 'Comentarios y seguridad (art. 6.1.f RGPD, interés legítimo)',
                detail:
                  'Leer lo que decides enviarnos para mejorar la app, y guardar registros técnicos breves para que el servicio sea seguro y funcione.',
              },
              {
                term: 'Obligaciones legales (art. 6.1.c RGPD)',
                detail:
                  'Responder a las solicitudes sobre tus derechos y dejar constancia de ello.',
              },
            ],
          },
          'No se toman decisiones automatizadas sobre ti con efectos jurídicos o similares. Los planes y sugerencias de entrenamiento son solo sugerencias.',
        ],
      },
      {
        id: 'no-tracking',
        heading: 'Sin anuncios ni seguimiento',
        blocks: [
          'g7m no muestra publicidad y no contiene código de analítica, publicidad ni seguimiento, ni informes de fallos de terceros. No vendemos tus datos, no los compartimos con fines publicitarios ni los usamos para perfilarte.',
          'La app no usa cookies. Guarda tu sesión y tus ajustes (tema, idioma, temporizador de descanso y similares) en el almacenamiento de tu navegador o teléfono, porque sin ellos no puede funcionar.',
        ],
      },
      {
        id: 'where',
        heading: 'Dónde están tus datos y quién los trata',
        blocks: [
          'Tus datos se guardan en tu dispositivo y en estos servicios, que los tratan por encargo nuestro, con contratos de encargo del tratamiento y solo para hacer funcionar g7m:',
          {
            terms: [
              {
                term: 'Supabase',
                detail:
                  'La base de datos y el inicio de sesión. Servidores en Fráncfort, Alemania. Supabase también envía los correos para confirmar la cuenta y restablecer la contraseña.',
              },
              {
                term: 'PowerSync',
                detail:
                  'Mantiene sincronizada la copia de tu dispositivo con la base de datos, que es lo que permite usar la app sin conexión. Servidores en Irlanda. Guarda una copia de tus datos sincronizados para entregarlos a tus dispositivos.',
              },
              {
                term: 'GitHub Pages',
                detail:
                  'Aloja los archivos de la app web. GitHub (EE. UU.) recibe tu dirección IP cuando cargas la app. Ningún dato de la cuenta pasa por ahí.',
              },
              {
                term: 'Google',
                detail:
                  'Solo si eliges «Continuar con Google»: Google confirma quién eres y nos indica tu correo. Tu cuenta de Google se rige por la política de privacidad de Google.',
              },
              {
                term: 'Apple',
                detail:
                  'Iniciar sesión con Apple llegará pronto. Si lo usas, Apple nos indica tu correo, o una dirección de reenvío privada si decides ocultarlo, y, si lo permites, tu nombre. Tu cuenta de Apple se rige por la política de privacidad de Apple.',
              },
            ],
          },
          'Si instalas g7m desde Google Play o la App Store, la tienda gestiona la descarga según su propia política; la app no recibe nada de ella.',
          'Algunas de estas empresas tienen su sede fuera del Espacio Económico Europeo. Cuando tus datos puedan ser accesibles desde fuera, la transferencia está protegida por las cláusulas contractuales tipo de la Comisión Europea o por el Marco de Privacidad de Datos UE-EE. UU.',
          'Tus amigos ven tu nombre, tu nivel y tus logros y, mientras compartir el entrenamiento esté activado, tus entrenamientos, mejores marcas y rutinas. Nadie más ve tus datos.',
        ],
      },
      {
        id: 'retention',
        heading: 'Cuánto tiempo los guardamos',
        blocks: [
          {
            list: [
              'Tu cuenta y todo su contenido: hasta que elimines la cuenta. Las cuentas no se eliminan por inactividad.',
              'Cuando eliminas tu cuenta, se borra de la base de datos al instante, toda de una vez, y de PowerSync con ella. Tus otros dispositivos borran su copia la próxima vez que se sincronicen o que alguien inicie sesión en ellos.',
              `Las copias de seguridad de Supabase caducan según su propio calendario, en un plazo de ${BACKUP_RETENTION}.`,
              'Comentarios: hasta que elimines tu cuenta, o antes si ya se han atendido.',
              'Registros técnicos: cada servicio los guarda poco tiempo, normalmente días.',
              'En tu dispositivo: hasta que cierres sesión (si no queda nada por subir) o elimines la cuenta. Borrar los datos del sitio o desinstalar la app también los elimina.',
            ],
          },
        ],
      },
      {
        id: 'rights',
        heading: 'Tus derechos',
        blocks: [
          'Según el RGPD tienes derecho a:',
          {
            list: [
              'acceder a tus datos y obtener una copia: Ajustes → Tus datos lo descarga todo en un archivo;',
              'llevarlos a otro servicio (portabilidad): ese archivo es JSON;',
              'rectificarlos: todo lo que introdujiste se puede editar en la app;',
              'suprimirlos: Ajustes → Eliminar tu cuenta, o por correo (consulta la página de eliminación de la cuenta);',
              'limitar u oponerte a su tratamiento, y retirar en cualquier momento el consentimiento que diste.',
            ],
          },
          `Para ejercerlos, usa la app o escribe a ${CONTACT_EMAIL} desde el correo de tu cuenta. Respondemos en un plazo de un mes.`,
          'Si crees que tus datos se han tratado mal, puedes reclamar ante una autoridad de protección de datos. En Croacia es la Agencia de Protección de Datos Personales (Agencija za zaštitu osobnih podataka, AZOP), Selska cesta 136, 10000 Zagreb, azop.hr. También puedes acudir a la autoridad del lugar donde vives o trabajas.',
        ],
      },
      {
        id: 'security',
        heading: 'Seguridad',
        blocks: [
          'Todo viaja por conexiones cifradas (HTTPS). La base de datos solo permite a cada cuenta leer y escribir sus propias filas, y el entrenamiento de un amigo solo se lee tras comprobar que la amistad existe y que compartir está activado. Las contraseñas nunca se guardan, solo sus hashes.',
        ],
      },
      {
        id: 'children',
        heading: 'Menores',
        blocks: [
          'g7m no está pensada para menores de 13 años, y la app no acepta una fecha de nacimiento que te haga más joven. Si tienes menos de 16, úsala solo con permiso de tu madre, padre o tutor.',
        ],
      },
      {
        id: 'changes',
        heading: 'Cambios en esta política',
        blocks: [
          'Cuando esta política cambie, la fecha de arriba cambiará con ella. Si un cambio afecta a qué se recoge o para qué, la app te avisará antes de que se aplique.',
        ],
      },
    ],
  },

  deletion: {
    title: 'Eliminar tu cuenta de g7m',
    intro:
      'Puedes eliminar tu cuenta de g7m con todos sus datos cuando quieras, de una de estas dos formas. No necesitas instalar la app para pedirlo.',
    inApp: {
      heading: 'En la app: al instante',
      steps: (labels) => [
        'Inicia sesión en g7m, en la app web o en tu teléfono.',
        `Abre ${labels.settings} y, en ${labels.account}, toca «${labels.open}».`,
        `Escribe ${labels.word} y confirma. Necesitas conexión a internet.`,
      ],
      action: 'Abrir Ajustes → Eliminar cuenta',
    },
    byEmail: {
      heading: 'Por correo',
      body: `Escribe a ${CONTACT_EMAIL} desde el correo con el que te registraste y pide que se elimine tu cuenta. Si escribes desde otra dirección, primero te pediremos que lo confirmes desde la de la cuenta, para que nadie más que tú pueda eliminarla. La eliminamos en un plazo máximo de un mes, normalmente en pocos días, y te respondemos cuando esté hecho.`,
      action: `Escribir a ${CONTACT_EMAIL}`,
      subject: 'Eliminar mi cuenta de g7m',
    },
    sections: [
      {
        id: 'deleted',
        heading: 'Qué se elimina',
        blocks: [
          'Todo, de una vez: o se elimina todo o, si algo falla, nada:',
          {
            list: [
              'tu acceso: tu correo, tu contraseña, el vínculo con Google o Apple y todas las sesiones, así que se cierra tu sesión en todas partes;',
              'tu perfil y tus ajustes;',
              'todos los entrenamientos, ejercicios y series, tus récords personales, rutinas, gimnasios, objetivos y nivel;',
              'tus pesajes y demás medidas corporales;',
              'los comentarios que enviaste desde la app;',
              'tu código de amigo, amistades, solicitudes y retos, que también desaparecen de las apps de tus amigos.',
            ],
          },
          'La app también vacía el dispositivo desde el que eliminas la cuenta. En tus otros dispositivos se cierra la sesión, y borran su copia la próxima vez que se sincronicen o que alguien inicie sesión en ellos. Para borrarla al momento, desinstala la app allí o borra los datos del sitio.',
        ],
      },
      {
        id: 'kept',
        heading: 'Qué se conserva',
        blocks: [
          {
            list: [
              `Nada en la base de datos activa. Las copias de seguridad de Supabase caducan en un plazo de ${BACKUP_RETENTION}, y no se restauran cuentas desde ellas.`,
              'Los registros técnicos breves de los servicios (direcciones IP y horas) caducan solos, normalmente en pocos días.',
              'Si lo pediste por correo, guardamos ese correo el tiempo necesario para demostrar que se atendió la solicitud.',
              'Los archivos que descargaste con «Tus datos» siguen donde los guardaste.',
            ],
          },
        ],
      },
      {
        id: 'before',
        heading: 'Antes de eliminar',
        blocks: [
          'La eliminación no se puede deshacer. Si quieres una copia de tu entrenamiento, usa antes Ajustes → Tus datos → Descargar.',
        ],
      },
    ],
  },
};
