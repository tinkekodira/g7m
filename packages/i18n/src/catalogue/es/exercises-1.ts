import { exercise as e } from '../entry.js';
import type { ExerciseText } from '../types.js';

export const exercises1: Readonly<Record<string, ExerciseText>> = {
  'ab-crunch': e(
    'Crunch abdominal',
    ['crunch', 'encogimiento abdominal', 'abdominales'],
    [
      'Túmbate boca arriba con las rodillas flexionadas y los pies apoyados, manos junto a la cabeza o un disco sobre el pecho.',
      'Despega los hombros del suelo redondeando la parte alta de la espalda, costillas hacia la cadera.',
      'Pausa arriba y baja con control hasta que los hombros toquen el suelo.',
    ],
    ['Costillas hacia la cadera', 'La zona lumbar se queda en el suelo', 'Suelta el aire al subir'],
    [
      'Tirar de la cabeza con las manos',
      'Subir del todo, lo que convierte el ejercicio en trabajo de flexores de cadera',
    ],
  ),
  'ab-wheel-rollout': e(
    'Rueda abdominal',
    ['rueda de abdominales', 'ab wheel', 'rollout de rodillas'],
    [
      'Arrodíllate sobre una superficie cómoda con las dos manos en la rueda bajo los hombros. Aprieta glúteos y abdomen.',
      'Rueda hacia delante despacio, abriendo hombros y cadera con las costillas abajo y la zona lumbar estable. Para antes de perder esa posición.',
      'Tira de la rueda hacia las rodillas con el tronco firme. Empieza con recorridos cortos y alárgalos a medida que ganes control.',
    ],
    [
      'Costillas abajo y glúteos apretados',
      'Para antes de arquear la zona lumbar',
      'Mueve hombros y cadera a la vez',
    ],
    [
      'Rodar más lejos de lo que el abdomen puede controlar',
      'Doblarse bruscamente por la cadera para volver',
    ],
  ),
  'air-bike': e(
    'Bicicleta de aire',
    ['assault bike', 'echo bike', 'air bike'],
    [
      'Ajusta el sillín como en una bicicleta normal.',
      'Empuja y tira de los manillares a la vez que pedaleas: cuanto más fuerte vas, más resistencia hace el ventilador.',
      'En intervalos, a tope en el trabajo y pedaleo suave en el descanso.',
    ],
    ['Brazos y piernas a la vez', 'Suelta el aire al empujar'],
    ['Empezar un intervalo a tope y quedarse sin nada a la mitad'],
  ),
  'arnold-press': e(
    'Press Arnold',
    ['press arnold con mancuernas', 'arnold press'],
    [
      'De pie, pies a la anchura de la cadera y rodillas sueltas. Sujeta las mancuernas delante de los hombros, palmas hacia ti y codos flexionados. Aprieta abdomen y glúteos.',
      'Empuja hacia arriba girando las palmas hacia delante y abriendo los codos. Costillas sobre la pelvis, sin impulso de piernas.',
      'Baja despacio deshaciendo el giro hasta que las mancuernas vuelvan delante de los hombros. Usa un recorrido cómodo sin forzar el giro.',
    ],
    ['Gira con suavidad al empujar', 'Costillas abajo', 'Muñecas sobre los antebrazos'],
    [
      'Arquear la zona lumbar para terminar el press',
      'Forzar los hombros en una posición incómoda abajo',
    ],
  ),
  'back-extension': e(
    'Hiperextensión',
    ['extensión lumbar', 'hiperextensiones', 'extensión de espalda a 45 grados'],
    [
      'Coloca el soporte justo debajo del pliegue de la cadera.',
      'Bájate flexionando la cadera hasta notar estiramiento en los isquiotibiales.',
      'Sube hasta que el cuerpo forme una línea recta.',
    ],
    ['Para en recto, no te arquees más', 'Aprieta los glúteos arriba'],
    ['Hiperextender la columna arriba'],
  ),
  'barbell-back-squat': e(
    'Sentadilla trasera con barra',
    ['sentadilla', 'sentadilla trasera', 'squat'],
    [
      'Coloca la barra en la parte alta de la espalda y aprieta fuerte el tronco.',
      'Saca la barra, da un paso atrás y separa los pies algo más que la cadera.',
      'Siéntate entre las caderas hasta que los muslos queden al menos paralelos y sube con fuerza.',
    ],
    ['Coge aire y aprieta', 'Rodillas en la línea de los pies', 'Empuja el suelo con todo el pie'],
    [
      'Dejar caer el pecho hacia delante al salir del fondo',
      'Recortar profundidad cuando sube el peso',
    ],
  ),
  'barbell-bench-press': e(
    'Press de banca con barra',
    ['press de banca', 'banca', 'press banca plano'],
    [
      'Túmbate con los ojos bajo la barra y los pies apoyados en el suelo.',
      'Agarra algo más ancho que los hombros y aprieta la barra.',
      'Saca la barra, bájala con control a la mitad del pecho y empuja de nuevo.',
    ],
    ['Pecho arriba', 'Codos a unos 45 grados', 'Empuja el suelo con los pies'],
    ['Rebotar la barra en el pecho', 'Abrir los codos totalmente hacia los lados'],
  ),
  'barbell-calf-raise': e(
    'Elevación de gemelos con barra',
    ['gemelos con barra', 'elevación de talones de pie con barra'],
    [
      'En un rack con las barras de seguridad puestas, coloca un disco plano y estable bajo la parte delantera de los pies, con los talones libres. Empieza con una barra ligera en la parte alta de la espalda, por debajo del cuello.',
      'Aprieta el tronco y sube sobre la parte delantera de los dos pies tan alto como controles, rodillas casi estiradas.',
      'Pausa y baja los talones despacio hasta un estiramiento cómodo, sin balancear el disco ni rebotar. Deja la barra en el rack antes de bajarte.',
    ],
    [
      'Antepiés firmes sobre el disco',
      'Sube en línea recta desde los tobillos',
      'Controla el estiramiento y la contracción',
    ],
    [
      'Apoyarse en un disco que se mueve o resbala',
      'Rebotar abajo o doblar las rodillas para subir la barra',
    ],
  ),
  'barbell-curl': e(
    'Curl con barra',
    ['curl de bíceps', 'curl barra recta'],
    [
      'De pie, sujeta la barra a la anchura de los hombros con los brazos estirados.',
      'Sube la barra hasta los hombros con los codos pegados al cuerpo.',
      'Baja con control hasta estirar del todo.',
    ],
    ['Codos pegados a las costillas', 'Extensión completa abajo'],
    ['Balancear la cadera para empezar cada repetición'],
  ),
  'barbell-front-squat': e(
    'Sentadilla frontal',
    ['front squat', 'sentadilla delantera'],
    [
      'Apoya la barra sobre la parte delantera de los hombros con los codos altos.',
      'Baja en sentadilla manteniendo el torso erguido.',
      'Sube sin dejar caer los codos.',
    ],
    ['Codos arriba', 'Pecho alto'],
    ['Bajar los codos, lo que hace caer la barra hacia delante'],
  ),
  'barbell-hip-thrust': e(
    'Hip thrust con barra',
    ['hip thrust', 'empuje de cadera', 'puente de glúteo con barra'],
    [
      'Siéntate con la parte alta de la espalda apoyada en un banco y la barra sobre la cadera.',
      'Sube la cadera hasta que el torso quede paralelo al suelo.',
      'Baja con control sin apoyar la barra en el suelo.',
    ],
    ['Barbilla recogida, costillas abajo', 'Aprieta fuerte los glúteos arriba'],
    ['Hiperextender la zona lumbar arriba en vez de terminar con los glúteos'],
  ),
  'barbell-lunge': e(
    'Zancada con barra',
    ['zancadas con barra', 'estocada con barra'],
    [
      'Saca una barra sobre la parte alta de la espalda con agarre cerrado y aprieta el tronco. De pie, pies a la anchura de la cadera y espacio libre delante.',
      'Da un paso al frente sobre un carril propio, a la anchura de la cadera. Flexiona ambas rodillas con control, el pie delantero bien apoyado y la pelvis nivelada.',
      'Empuja con el pie delantero para volver a la posición inicial. Alterna lados o termina uno primero, y registra repeticiones por pierna.',
    ],
    [
      'Pisa en dos carriles',
      'El pie delantero no se mueve',
      'Controla la vuelta antes del siguiente paso',
    ],
    [
      'Pisar como en una cuerda floja o dejar que la rodilla delantera caiga hacia dentro',
      'Golpear el suelo con la rodilla trasera',
    ],
  ),
  'barbell-preacher-curl': e(
    'Curl predicador (barra)',
    ['curl predicador con barra', 'curl scott', 'curl en banco scott'],
    [
      'Ajusta el soporte para que las axilas descansen en el borde superior.',
      'Coge una barra recta a la anchura de los hombros, palmas arriba, y súbela sin llegar a la vertical.',
      'Baja despacio hasta que los brazos estén casi estirados.',
    ],
    ['Los codos no se despegan del soporte', 'Muñecas rectas, sin doblarlas hacia atrás'],
    [
      'Dejar caer el peso abajo, lo que carga el codo',
      'Cargarla como la barra Z; el agarre recto es más duro para las muñecas',
    ],
  ),
  'barbell-row': e(
    'Remo con barra',
    ['remo inclinado', 'remo con barra inclinado', 'remo pendlay'],
    [
      'Inclínate desde la cadera hasta que el torso quede a unos 45 grados, espalda recta.',
      'Tira de la barra hacia las costillas bajas.',
      'Baja con control sin dejar que la espalda se redondee.',
    ],
    ['Espalda recta todo el tiempo', 'Codos más allá de las costillas'],
    ['Incorporarse cuando la serie se pone dura', 'Tirar a tirones con la zona lumbar'],
  ),
  'barbell-shrug': e(
    'Encogimientos con barra',
    ['encogimientos', 'encogimiento de hombros', 'shrugs'],
    [
      'Sujeta la barra con los brazos estirados delante de los muslos.',
      'Sube los hombros en línea recta hacia las orejas.',
      'Baja con control hasta el estiramiento completo.',
    ],
    ['Arriba y abajo en línea recta', 'Pausa arriba'],
    ['Hacer círculos con los hombros, que no aporta nada e irrita la articulación'],
  ),
  'bench-dips': e(
    'Fondos en banco',
    ['fondos de tríceps en banco', 'dips en banco'],
    [
      'Siéntate en el borde de un banco estable con las manos junto a la cadera y los dedos hacia delante. Apoya los pies y saca la cadera justo del borde. Empieza con las rodillas flexionadas.',
      'Dobla los codos hacia atrás y baja la cadera cerca del banco solo hasta donde los hombros lo permitan con comodidad.',
      'Empuja con las palmas para estirar los codos y subir la cadera. Mantén el pecho abierto y para si la posición del hombro resulta incómoda.',
    ],
    ['Cadera cerca del banco', 'Hombros abajo', 'Profundidad corta y cómoda'],
    [
      'Dejar los hombros muy por debajo de los codos',
      'Dejar que el banco resbale o que la cadera se aleje mucho',
    ],
  ),
  'bicycle-crunch': e(
    'Crunch bicicleta',
    ['bicicleta abdominal', 'crunch alterno en bicicleta'],
    [
      'Túmbate boca arriba con las rodillas flexionadas sobre la cadera y las manos apoyadas suavemente junto a la cabeza. Despega un poco las escápulas y aprieta el abdomen.',
      'Gira el pecho hacia una rodilla flexionada mientras estiras la pierna contraria. Acerca el hombro a la rodilla sin tirar de la cabeza.',
      'Cambia de lado despacio con la zona lumbar estable. Cada lado cuenta como una repetición.',
    ],
    [
      'Gira el pecho, no solo el codo',
      'Manos apenas apoyadas junto a la cabeza',
      'Estira la pierna solo hasta donde controles',
    ],
    ['Tirar del cuello hacia delante con las manos', 'Pedalear rápido sin girar el tronco'],
  ),
  'box-squat': e(
    'Sentadilla al cajón',
    ['box squat', 'sentadilla a cajón con barra'],
    [
      'Coloca un cajón estable detrás de ti dentro de un rack con barras de seguridad. Elige una altura que puedas controlar. Saca la barra sobre la parte alta de la espalda y colócate.',
      'Aprieta el tronco y flexiona cadera y rodillas, sentándote hacia atrás hacia el cajón con los pies firmes y las rodillas en la línea de los pies.',
      'Apóyate suavemente y pausa un instante sin perder la tensión del tronco ni la presión en los pies.',
      'Empuja con los dos pies para levantarte sin balancearte hacia delante ni rebotar en el cajón.',
    ],
    [
      'Siéntate suave y con control',
      'Mantén la tensión sobre el cajón',
      'Levántate sin balancearte',
    ],
    [
      'Dejarse caer en el cajón o relajar la zona lumbar',
      'Usar un cajón inestable o demasiado bajo',
    ],
  ),
  'bulgarian-split-squat': e(
    'Sentadilla búlgara',
    ['búlgara', 'zancada búlgara', 'split squat con pie elevado'],
    [
      'Apoya el pie trasero en un banco detrás de ti.',
      'Baja hasta que el muslo delantero quede más o menos paralelo.',
      'Sube empujando con el pie delantero.',
    ],
    ['Peso en el talón delantero', 'Torso un poco inclinado para los glúteos'],
    ['Ponerse demasiado cerca del banco, lo que agobia la rodilla delantera'],
  ),
  burpees: e(
    'Burpees',
    ['burpee'],
    [
      'De pie, pies a la anchura de los hombros. Ponte en cuclillas y apoya las dos palmas en el suelo delante de ti.',
      'Salta o lleva los pies atrás hasta una plancha alta firme. Esta versión no incluye flexión; la cadera en línea con los hombros.',
      'Trae los pies por fuera de las manos, levanta el pecho y ponte de pie con un pequeño salto vertical, brazos arriba.',
      'Aterriza suave y empieza la siguiente con control. Sentadilla, plancha, vuelta y salto cuentan como una repetición.',
    ],
    [
      'Aprieta antes de llevar los pies atrás',
      'Pies por fuera de las manos',
      'Aterriza suave y recoloca',
    ],
    ['Dejar caer la cadera en la plancha', 'Volver con prisa o aterrizar con las rodillas rígidas'],
  ),
  'cable-crunch': e(
    'Crunch en polea',
    ['crunch de rodillas en polea', 'crunch con cuerda'],
    [
      'Arrodíllate de espaldas a una polea alta con la cuerda junto a la cabeza.',
      'Encógete hacia abajo redondeando la columna, no doblando la cadera.',
      'Vuelve con control.',
    ],
    ['La cadera no se mueve', 'Redondea la columna a propósito'],
    ['Convertirlo en una bisagra de cadera y trabajar los flexores de cadera'],
  ),
  'cable-curl': e(
    'Curl en polea',
    ['curl de bíceps en polea', 'curl con cuerda'],
    [
      'De pie frente a una polea baja con barra recta o cuerda.',
      'Sube hasta los hombros con los codos pegados al cuerpo.',
      'Baja hasta estirar los brazos manteniendo la tensión del cable.',
    ],
    ['Codos quietos', 'Aprieta arriba'],
    ['Echarse hacia atrás para terminar la repetición'],
  ),
  'cable-fly': e(
    'Aperturas en polea',
    ['cruce de poleas', 'crossover', 'aperturas con cable'],
    [
      'Pon las dos poleas a la altura de los hombros o más arriba.',
      'Da un paso al frente en posición de zancada con los codos ligeramente flexionados.',
      'Junta los agarres delante del pecho y vuelve con control.',
    ],
    ['Ángulo del codo fijo', 'Aprieta en el centro'],
    ['Convertirlo en un press doblando y estirando los codos'],
  ),
  'cable-hammer-curl': e(
    'Curl martillo en polea',
    ['curl martillo con cuerda', 'curl agarre neutro en polea'],
    [
      'Engancha una cuerda a una polea baja. Mira hacia la máquina y coge un extremo con cada mano, palmas enfrentadas y pulgares arriba.',
      'De pie, codos junto a las costillas, sube la cuerda hacia los hombros sin mover los brazos.',
      'Baja despacio hasta casi estirar los codos, con las muñecas neutras y la pila de peso controlada.',
    ],
    ['Pulgares arriba', 'Codos junto a las costillas', 'Baja sin balanceo'],
    ['Echarse hacia atrás para mover el peso', 'Doblar las muñecas o adelantar los codos'],
  ),
  'cable-kickback': e(
    'Patada de glúteo en polea',
    ['patada de glúteo con cable', 'kickback en polea', 'extensión de cadera en polea'],
    [
      'Coloca una tobillera en una polea baja alrededor de un tobillo. Mira hacia la máquina, agárrate con las dos manos y suelta la rodilla de apoyo.',
      'Aprieta el tronco con una ligera inclinación. Lleva la pierna con la tobillera hacia atrás desde la cadera, pelvis recta y rodilla ligeramente flexionada.',
      'Para antes de arquear la zona lumbar y vuelve despacio sin apoyar el peso. Haz los dos lados y registra repeticiones por pierna.',
    ],
    ['Muévete desde la cadera', 'Pelvis recta', 'Para antes de arquear la espalda'],
    ['Balancear la pierna o girar la pelvis', 'Arquear la espalda para subir más el pie'],
  ),
  'cable-lat-pullover': e(
    'Pullover en polea',
    ['pullover con cuerda', 'pullover de dorsales', 'pullover'],
    [
      'Coge una cuerda en una polea alta, da un paso atrás e inclínate hasta tener los brazos por encima de la cabeza.',
      'Con los codos suaves y fijos, tira de la cuerda en arco hasta pasar la cadera.',
      'Deja que vuelva arriba hasta notar el estiramiento de los dorsales.',
    ],
    ['Cadera atrás, pecho abajo', 'Termina con las manos junto a la cadera'],
    [
      'Doblar los codos y convertirlo en un empuje de tríceps',
      'Ponerse recto, lo que acorta el estiramiento',
    ],
  ),
  'cable-lateral-raise': e(
    'Elevación lateral en polea',
    ['elevación lateral a una mano en polea', 'elevaciones laterales con cable'],
    [
      'Ponte de lado a una polea baja y coge el agarre con la mano más alejada; el cable cruza por delante de los muslos. Usa la otra mano para estabilizarte.',
      'Con una ligera flexión fija del codo, sube el brazo hacia el lado hasta la altura del hombro, sin inclinarte ni encoger el hombro.',
      'Baja despacio por delante del cuerpo manteniendo la tensión. Haz los dos lados y registra repeticiones por brazo.',
    ],
    ['Guía con el codo', 'Torso quieto', 'Para a la altura del hombro'],
    [
      'Balancearse alejándose de la máquina',
      'Encoger el hombro o cambiar la flexión del codo para mover la carga',
    ],
  ),
  'cable-woodchop': e(
    'Leñador en polea',
    ['leñador', 'woodchop', 'rotación en polea'],
    [
      'Pon un cable a la altura de los hombros y colócate de lado.',
      'Coge el agarre con las dos manos y los brazos casi estirados.',
      'Gira desde el tronco y tira cruzando el cuerpo; vuelve despacio.',
    ],
    ['Gira desde las costillas, no con los brazos', 'La cadera mira al frente'],
    ['Tirar con los brazos en vez de girar el tronco'],
  ),
  'chest-dip': e(
    'Fondos (énfasis pecho)',
    ['fondos', 'fondos de pecho', 'fondos en paralelas'],
    [
      'Sujétate en las barras con los brazos bloqueados.',
      'Inclina el torso unos 30 grados hacia delante y deja que los codos se abran un poco.',
      'Baja hasta que los brazos queden horizontales y vuelve a subir.',
    ],
    ['Inclínate para cargar el pecho', 'Hombros lejos de las orejas'],
    [
      'Bajar más de lo que toleran los hombros',
      'Quedarse recto, lo que lo convierte en fondos de tríceps',
    ],
  ),
  'chest-supported-dumbbell-row': e(
    'Remo con mancuernas con apoyo de pecho',
    ['remo con apoyo de pecho', 'remo en banco inclinado', 'remo foca con mancuernas'],
    [
      'Pon un banco a unos 30 o 45 grados y túmbate boca abajo, con el pecho en el respaldo.',
      'Deja colgar una mancuerna en cada mano.',
      'Lleva los dos codos hacia atrás más allá del torso, aprieta y baja hasta el estiramiento completo.',
    ],
    ['El pecho se queda en el respaldo', 'Guía con los codos', 'Junta las escápulas'],
    ['Despegar el pecho para subir el peso a tirones', 'Encoger los hombros hacia las orejas'],
  ),
  'chin-up': e(
    'Dominada supina',
    ['chin up', 'dominadas supinas', 'dominada con agarre supino'],
    [
      'Cuélgate de la barra con agarre supino a la anchura de los hombros.',
      'Sube hasta que la barbilla pase la barra.',
      'Baja con control hasta colgar del todo.',
    ],
    ['Lleva los codos abajo y atrás', 'Cuelga del todo abajo'],
    ['Recortar el final de la bajada'],
  ),
  'clean-and-jerk': e(
    'Dos tiempos',
    ['cargada y envión', 'clean and jerk', 'dos tiempos olímpico'],
    [
      'Usa una zona despejada con discos bumper y aprende por separado la cargada, la posición frontal y el envión en tijera con una barra ligera antes de unirlos. Ponte con la barra sobre el medio del pie, manos por fuera de las piernas y espalda firme.',
      'Empuja el suelo con la barra pegada al pasar las rodillas. Extiende piernas y cadera y métete debajo para recibir la barra sobre la parte delantera de los hombros, codos adelante.',
      'Ponte de pie del todo tras la cargada, asienta la barra en posición frontal y aprieta para el envión.',
      'Flexiona en vertical un poco, empuja con las piernas hacia arriba y métete bajo la barra en una tijera estable con los dos codos bloqueados. Pies en carriles separados, a la anchura de la cadera.',
      'Sal de la tijera con pasos controlados hasta juntar los pies con la barra estable arriba. Devuelve la barra de un modo practicado y adecuado a la carga y al espacio. Una cargada más un envión es una repetición.',
    ],
    [
      'Barra pegada en la cargada',
      'Ponte de pie y asienta antes del envión',
      'Flexión vertical e impulso con las piernas',
      'Recibe el envión en dos carriles',
    ],
    [
      'Tirar antes de tiempo con los brazos o alejar la barra',
      'Hacer el envión desde una posición frontal inestable',
      'Recibir con los codos flojos o los pies en una sola línea',
    ],
  ),
  'close-grip-bench-press': e(
    'Press de banca agarre cerrado',
    ['press cerrado', 'banca con agarre estrecho'],
    [
      'Agarra la barra más o menos a la anchura de los hombros.',
      'Bájala hacia la parte baja del pecho con los codos pegados.',
      'Empuja de nuevo, con el tríceps.',
    ],
    ['Codos pegados a unos 30 grados', 'Muñecas sobre los codos'],
    ['Agarrar tan cerrado que duelen las muñecas'],
  ),
  'close-grip-dumbbell-bench-press': e(
    'Press con mancuernas agarre cerrado',
    ['press squeeze', 'press cerrado con mancuernas', 'press de mancuernas juntas'],
    [
      'Túmbate en un banco plano con los pies apoyados y la espalda alta apoyada. Sujeta dos mancuernas juntas sobre el pecho, palmas enfrentadas.',
      'Muñecas rectas y codos cerca del cuerpo al bajar las mancuernas hacia la parte baja del pecho. Las pesas se mantienen niveladas y juntas.',
      'Empuja las dos a la vez hasta estirar los brazos sin bloquear de golpe. Mantén el agarre neutro y cerrado todo el tiempo.',
    ],
    [
      'Mancuernas juntas y niveladas',
      'Muñecas sobre los antebrazos',
      'Codos cerca de las costillas',
    ],
    [
      'Dejar que una mancuerna se incline o se adelante',
      'Abrir los codos o perder la muñeca neutra',
    ],
  ),
  'close-grip-incline-bench-press': e(
    'Press inclinado agarre cerrado',
    ['press inclinado cerrado con barra', 'press inclinado estrecho'],
    [
      'Pon un banco inclinado a unos 30 grados en un rack con seguros. Túmbate con los pies apoyados y coge la barra con agarre prono cerrado a la anchura de los hombros.',
      'Saca la barra sobre la parte alta del pecho. Baja con control hacia ella, muñecas sobre los antebrazos y codos en ángulo hacia el torso.',
      'Empuja por el mismo recorrido sin levantar la cadera. Usa un ayudante o seguros bien colocados y deja la barra con firmeza.',
    ],
    [
      'Agarre cerrado a la anchura de los hombros',
      'La espalda alta se queda en el respaldo',
      'Baja con las muñecas sobre los antebrazos',
    ],
    [
      'Agarrar tan cerrado que las muñecas se doblan hacia los lados',
      'Abrir los codos o rebotar la barra en el pecho',
    ],
  ),
  'close-grip-lat-pulldown': e(
    'Jalón agarre cerrado',
    ['jalón con agarre neutro', 'jalón con triángulo', 'jalón cerrado al pecho'],
    [
      'Engancha un agarre en V cerrado al jalón y ajusta el soporte de muslos para sujetar bien las piernas. Coge los dos agarres con las palmas enfrentadas y los pulgares cerrados.',
      'Siéntate erguido con una ligera inclinación atrás fija. Lleva el agarre hacia la parte alta del pecho bajando los codos junto a las costillas.',
      'Vuelve despacio hasta tener los brazos largos y un estiramiento cómodo, sin balancear el torso ni dejar que golpee la pila de peso.',
    ],
    ['Lleva los codos abajo', 'Muñecas rectas', 'Ángulo del torso estable'],
    [
      'Echarse atrás para mover el peso',
      'Tirar por detrás de la nuca o doblar las muñecas hacia dentro',
    ],
  ),
  'concentration-curl': e(
    'Curl concentrado',
    ['curl concentrado sentado', 'curl a una mano'],
    [
      'Siéntate en un banco y apoya la parte posterior de un brazo contra el interior del muslo.',
      'Sube la mancuerna hacia el hombro.',
      'Baja con control hasta estirar el brazo y cambia de lado.',
    ],
    ['El brazo se queda en el muslo', 'Lento al bajar'],
    ['Empujar el brazo con el muslo'],
  ),
  'conventional-deadlift': e(
    'Peso muerto convencional',
    ['peso muerto', 'deadlift'],
    [
      'Coloca el medio del pie bajo la barra con las espinillas cerca.',
      'Bájate flexionando la cadera, agarra justo por fuera de las piernas y tensa la barra.',
      'Levántate empujando el suelo y termina erguido.',
    ],
    ['Espalda recta, pecho arriba', 'La barra pegada a las piernas', 'Aprieta los glúteos arriba'],
    ['Redondear la zona lumbar', 'Arrancar la barra del suelo de un tirón'],
  ),
  'decline-ab-crunch': e(
    'Crunch declinado',
    ['crunch en banco declinado', 'abdominales declinados'],
    [
      'Engancha los pies bajo los rodillos de un banco declinado y túmbate, manos junto a la cabeza o un disco sobre el pecho.',
      'Sube los hombros redondeando la espalda alta, costillas hacia la cadera.',
      'Baja con control y para antes de apoyar los hombros para mantener la tensión en el abdomen.',
    ],
    ['Redondea la columna, no dobles la cadera', 'Lento al bajar', 'Suelta el aire al subir'],
    [
      'Subir con impulso y dejarse caer',
      'Subir del todo, lo que pasa el trabajo a los flexores de cadera',
    ],
  ),
  'decline-bench-press': e(
    'Press de banca declinado',
    ['press declinado con barra', 'banca declinada'],
    [
      'Sujeta las piernas en un banco ligeramente declinado bajo una barra en el rack. Pon los seguros o usa un ayudante. Cabeza, espalda y cadera apoyadas.',
      'Agarre cerrado algo más ancho que los hombros y saca la barra. Bájala despacio hacia la parte baja del pecho con las muñecas sobre los codos.',
      'Empuja de nuevo sobre los hombros sin rebotar ni levantar la cadera. Deja la barra en el rack antes de soltarla o levantarte.',
    ],
    [
      'Asegura los soportes de piernas antes de sacar la barra',
      'Baja hacia la parte baja del pecho',
      'Hombros pegados al banco',
    ],
    [
      'Rebotar la barra o abrir mucho los codos',
      'Empezar sin piernas bien sujetas o sin un plan seguro para dejar la barra',
    ],
  ),
  'decline-dumbbell-bench-press': e(
    'Press declinado con mancuernas',
    ['press de mancuernas declinado', 'banca declinada con mancuernas'],
    [
      'Sujeta las piernas en un banco ligeramente declinado y lleva las mancuernas a la altura del pecho de forma controlada o con ayuda. Cabeza, hombros y cadera apoyados.',
      'Empuja las mancuernas sobre el pecho con las muñecas sobre los codos y las palmas al frente o algo hacia dentro.',
      'Baja despacio hasta una posición cómoda a la altura del pecho, codos en ángulo hacia atrás, y vuelve a empujar. Sal con control tras la última repetición.',
    ],
    [
      'Soportes de piernas bien sujetos',
      'Muñecas sobre los codos',
      'Controla la entrada y la salida',
    ],
    [
      'Abrir los codos o bajar más de lo cómodo',
      'Intentar incorporarse con mancuernas pesadas en una posición inestable',
    ],
  ),
  'decline-dumbbell-fly': e(
    'Aperturas declinadas con mancuernas',
    ['aperturas en banco declinado'],
    [
      'Sujeta las piernas en un banco ligeramente declinado y lleva mancuernas ligeras sobre el pecho, palmas enfrentadas. Planea cómo entrar y salir con control.',
      'Con los codos ligeramente flexionados y fijos, abre los brazos en un arco amplio. Para cuando los brazos lleguen más o menos a la altura del torso, o antes si hace falta.',
      'Vuelve a llevar las mancuernas sobre el pecho por el mismo arco sin cambiar el ángulo del codo ni chocar las pesas.',
    ],
    [
      'Ángulo del codo fijo',
      'Cargas ligeras y controladas',
      'Para en un estiramiento cómodo del pecho',
    ],
    ['Bajar los brazos muy por debajo del torso', 'Doblar los codos y convertirlo en un press'],
  ),
  'decline-push-up': e(
    'Flexión declinada',
    ['flexiones con pies elevados', 'flexión declinada'],
    [
      'Pon los pies en un banco bajo y estable y las manos en el suelo algo más abiertas que los hombros.',
      'Aprieta en línea recta de hombros a talones y baja el pecho hacia el suelo con los codos hacia atrás en ángulo.',
      'Empuja el suelo hasta estirar los brazos, con la cadera alineada con el torso.',
    ],
    ['Cadera alineada con el torso', 'Baja el pecho entre las manos', 'Empieza con poca elevación'],
    ['Subir o hundir la cadera', 'Usar un apoyo de pies inestable o demasiado alto'],
  ),
  'decline-smith-bench-press': e(
    'Press declinado en máquina Smith',
    ['press declinado en smith', 'banca declinada en multipower'],
    [
      'Centra un banco ligeramente declinado bajo la barra de la Smith, sujeta las piernas y pon los topes de seguridad. Prueba la barra vacía para que baje hacia la parte baja del pecho.',
      'Túmbate con cabeza, hombros y cadera apoyados. Agarre cerrado algo más ancho que los hombros, suelta los ganchos y baja despacio.',
      'Empuja siguiendo las guías sin rebotar ni levantar la cadera. Gira la barra sobre los dos ganchos y comprueba que está fija antes de soltarla.',
    ],
    [
      'Prueba el recorrido antes de cargar',
      'Pon los topes por debajo de tu punto más bajo',
      'Comprueba los dos ganchos antes de soltar',
    ],
    [
      'Colocar el banco de modo que la barra vaya hacia el cuello',
      'Prescindir de los topes o soltar una barra sin enganchar',
    ],
  ),
  'diamond-push-ups': e(
    'Flexiones diamante',
    ['flexión diamante', 'flexiones cerradas'],
    [
      'Empieza en plancha alta con las manos juntas bajo el pecho. Pulgares e índices forman un diamante si es cómodo; si no, deja algo de espacio para las muñecas.',
      'Aprieta el tronco y dobla los codos hacia atrás para bajar el pecho hacia las manos.',
      'Empuja hasta estirar los brazos con el cuerpo en línea. Apoya las rodillas si necesitas una versión más fácil.',
    ],
    [
      'Codos hacia atrás en ángulo',
      'Cadera alineada',
      'Elige una posición de manos cómoda para las muñecas',
    ],
    ['Abrir los codos o encoger los hombros', 'Hundir la zona lumbar para llegar a las manos'],
  ),
  'dumbbell-bench-press': e(
    'Press de banca con mancuernas',
    ['press con mancuernas', 'banca con mancuernas'],
    [
      'Siéntate con las mancuernas sobre los muslos y súbelas con un golpe de rodilla mientras te tumbas.',
      'Baja hasta que los brazos queden a la altura del torso.',
      'Empuja hacia arriba y un poco hacia el centro.',
    ],
    ['Muñecas sobre los codos', 'Controla la bajada'],
    ['Dejar que las mancuernas se separen demasiado abajo'],
  ),
  'dumbbell-curl': e(
    'Curl con mancuernas',
    ['curl de bíceps con mancuernas', 'curl alterno'],
    [
      'De pie con una mancuerna en cada mano, brazos estirados y palmas al frente.',
      'Sube hasta los hombros con los codos pegados al cuerpo.',
      'Baja con control hasta estirar del todo, a la vez o alternando.',
    ],
    ['Codos pegados a las costillas', 'Extensión completa abajo'],
    ['Balancear la cadera para empezar cada repetición', 'Dejar que los codos se adelanten'],
  ),
  'dumbbell-preacher-curl': e(
    'Curl predicador (mancuerna)',
    ['curl predicador con mancuerna', 'curl scott con mancuerna', 'curl predicador a una mano'],
    [
      'Ajusta el soporte para que una axila descanse en el borde superior, con la mancuerna en esa mano.',
      'Súbela parando antes de la vertical para mantener la tensión.',
      'Baja despacio hasta que el brazo quede casi recto y cambia de lado.',
    ],
    ['El codo se queda en el soporte', 'Gira el meñique hacia arriba al final'],
    ['Dejar caer el peso abajo, lo que carga el codo'],
  ),
  'dumbbell-pullover': e(
    'Pullover con mancuerna',
    ['pullover', 'pullover en banco'],
    [
      'Túmbate a lo largo o atravesado en un banco plano con una mancuerna sobre el pecho.',
      'Llévala hacia atrás por encima de la cabeza con los codos apenas flexionados.',
      'Vuelve a traerla sobre el pecho sin que se abran las costillas.',
    ],
    ['Costillas abajo', 'Para donde acaba el estiramiento, no donde cede el hombro'],
    [
      'Dejar que se doblen los codos, lo que pasa el trabajo al tríceps',
      'Bajar más de lo cómodo para el hombro por buscar recorrido',
    ],
  ),
  'dumbbell-romanian-deadlift': e(
    'Peso muerto rumano con mancuernas',
    ['peso muerto rumano', 'rdl con mancuernas', 'peso muerto piernas rígidas con mancuernas'],
    [
      'De pie, pies a la anchura de la cadera, con una mancuerna en cada mano delante de los muslos. Rodillas sueltas y tronco firme.',
      'Lleva la cadera atrás y deja bajar las mancuernas pegadas a las piernas con los brazos estirados. Columna estable y flexión de rodilla casi sin cambiar.',
      'Para en un estiramiento controlado de isquiotibiales antes de redondear la espalda y empuja la cadera al frente para subir. Las pesas no tienen que tocar el suelo.',
    ],
    ['Lleva la cadera atrás', 'Pesas pegadas a las piernas', 'Termina erguido sin echarte atrás'],
    ['Agacharse doblando las rodillas una y otra vez', 'Buscar el suelo redondeando la espalda'],
  ),
  'dumbbell-shoulder-press': e(
    'Press de hombro con mancuernas',
    ['press militar con mancuernas', 'press de hombros sentado'],
    [
      'Siéntate con respaldo y las mancuernas a la altura de las orejas.',
      'Empuja por encima de la cabeza hasta estirar los brazos.',
      'Baja con control hasta la altura de las orejas.',
    ],
    ['Muñecas sobre los codos', 'No arquees la zona lumbar'],
    ['Medias repeticiones que nunca llegan a la altura de las orejas'],
  ),
};
