import { exercise as e } from '../entry.js';
import type { ExerciseText } from '../types.js';

export const exercises2: Readonly<Record<string, ExerciseText>> = {
  'dumbbell-shrug': e(
    'Encogimientos con mancuernas',
    ['encogimientos', 'encogimiento de hombros con mancuernas'],
    [
      'De pie, pies a la anchura de la cadera, con una mancuerna en cada mano a los lados y las palmas hacia los muslos.',
      'Pecho alto, cabeza neutra y brazos estirados. Sube los dos hombros hacia las orejas sin doblar los codos ni girar los hombros.',
      'Pausa breve arriba y baja los hombros despacio hasta un estiramiento cómodo.',
      'Repite con el torso quieto y el mismo recorrido controlado en ambos lados. Deja las mancuernas con control al terminar.',
    ],
    ['Hombros arriba y abajo en línea recta', 'Brazos estirados', 'Pausa arriba', 'Cabeza neutra'],
    [
      'Hacer círculos con los hombros',
      'Doblar los codos o rebotar con las piernas',
      'Adelantar la cabeza',
      'Usar una carga que impide subir los hombros con control',
    ],
  ),
  'ez-bar-curl': e(
    'Curl con barra Z',
    ['curl barra Z', 'curl de bíceps con barra Z'],
    [
      'De pie, sujeta la barra Z por los agarres inclinados con los brazos estirados.',
      'Sube la barra hasta los hombros con los codos pegados al cuerpo.',
      'Baja con control hasta estirar del todo.',
    ],
    ['Codos pegados a las costillas', 'Extensión completa abajo'],
    ['Balancear la cadera para empezar cada repetición'],
  ),
  'face-pull': e(
    'Face pull',
    ['jalón a la cara', 'face pull con cuerda'],
    [
      'Pon una cuerda más o menos a la altura de la cara.',
      'Tira de la cuerda hacia la cara separando los extremos.',
      'Termina con las manos junto a las orejas y los codos altos.',
    ],
    ['Codos por encima de las muñecas', 'Separa, no solo tires hacia atrás'],
    ['Poner tanto peso que el torso se balancea hacia atrás'],
  ),
  'farmer-carry': e(
    'Paseo del granjero',
    ['farmer walk', 'caminata del granjero', 'transporte de carga'],
    [
      'Coge una mancuerna o kettlebell pesada en cada mano.',
      'Ponte erguido con los hombros atrás.',
      'Camina en línea recta por distancia o por tiempo.',
    ],
    ['Postura alta, sin inclinarte', 'Aprieta fuerte los agarres'],
    ['Dejar que los hombros se redondeen bajo la carga'],
  ),
  'flat-bench-dumbbell-fly': e(
    'Aperturas en banco plano',
    ['aperturas con mancuernas', 'aperturas de pecho'],
    [
      'Túmbate en un banco plano con los pies apoyados. Sujeta mancuernas ligeras sobre el pecho, palmas enfrentadas y codos un poco flexionados.',
      'Abre los brazos en un arco amplio manteniendo esa flexión. Para en un estiramiento cómodo del pecho con los brazos más o menos alineados con el torso.',
      'Vuelve a llevar las mancuernas sobre el pecho por el mismo arco de abrazo sin convertirlo en un press.',
    ],
    [
      'Flexión del codo suave y fija',
      'Abre y cierra como un abrazo',
      'Estiramiento cómodo del pecho',
    ],
    ['Bajar las pesas muy por debajo del torso', 'Estirar del todo los codos o empujar las pesas'],
  ),
  'goblet-squat': e(
    'Sentadilla goblet',
    ['goblet squat', 'sentadilla copa', 'sentadilla con kettlebell'],
    [
      'Sujeta una mancuerna o kettlebell a la altura del pecho.',
      'Baja en sentadilla entre las rodillas con el pecho alto.',
      'Sube empujando con todo el pie.',
    ],
    ['Codos por dentro de las rodillas abajo', 'Pecho orgulloso'],
    ['Dejar que los talones se levanten del suelo'],
  ),
  'hack-squat': e(
    'Hack squat',
    ['sentadilla hack', 'hack en máquina'],
    [
      'Coloca los hombros bajo las almohadillas con los pies en el centro de la plataforma.',
      'Baja hasta que los muslos queden al menos paralelos.',
      'Vuelve a subir empujando con todo el pie.',
    ],
    ['Espalda plana contra el respaldo', 'Rodillas en la línea de los pies'],
    ['Rebotar al salir del fondo'],
  ),
  'hammer-curl': e(
    'Curl martillo',
    ['curl martillo con mancuernas', 'curl agarre neutro'],
    [
      'Sujeta las mancuernas con las palmas enfrentadas.',
      'Sube hasta los hombros sin girar las muñecas.',
      'Baja con control.',
    ],
    ['Pulgares arriba todo el tiempo', 'Codos quietos'],
    ['Girar a un curl normal a mitad de recorrido'],
  ),
  'handstand-push-ups': e(
    'Flexiones en pino',
    ['flexiones en parada de manos', 'HSPU', 'flexión en pino libre'],
    [
      'Esta es una flexión en pino libre y estricta. Primero domina un pino estable y practica una salida controlada en una zona despejada; usa progresiones en pica o con apoyo mientras aprendes.',
      'Ponte en pino con las palmas a la anchura de los hombros, dedos separados y tronco firme. Piernas juntas sobre la cadera.',
      'Dobla los codos con control llevando la cabeza hacia un punto algo por delante de las manos. Baja solo hasta donde puedas volver sin cargar peso en la cabeza.',
      'Empuja con fuerza con las palmas hasta estirar los brazos y recupera el equilibrio. No patees con las piernas para terminar; sal del pino antes de perder el control.',
    ],
    ['Separa los dedos y empuja con las palmas', 'Tronco firme', 'Nada de peso en la cabeza'],
    [
      'Hundirse sobre la cabeza o el cuello',
      'Impulsarse con las piernas o intentarlo sin una salida controlada',
    ],
  ),
  'hanging-knee-raise': e(
    'Elevación de rodillas colgado',
    ['elevación de rodillas en barra', 'encogimientos colgado'],
    [
      'Cuélgate de una barra segura con agarre prono cerrado y los brazos largos. Activa los hombros y deja que el cuerpo se quede quieto.',
      'Dobla las rodillas y súbelas hacia el pecho, enrollando un poco la pelvis en vez de subir solo los muslos.',
      'Baja despacio hasta colgar sin balancearte. Subir y bajar las dos rodillas cuenta como una repetición.',
    ],
    [
      'Empieza cada repetición sin balanceo',
      'Enrolla la pelvis hacia las costillas',
      'Baja las rodillas despacio',
    ],
    [
      'Usar un balanceo de péndulo para subir las rodillas',
      'Dejar caer las piernas o hundirse en los hombros',
    ],
  ),
  'hanging-leg-raise': e(
    'Elevación de piernas colgado',
    ['elevación de piernas en barra', 'leg raise colgado'],
    [
      'Cuélgate de una barra con los hombros activos.',
      'Sube las piernas hasta que la cadera se enrolle un poco.',
      'Baja con control, sin balancearte.',
    ],
    ['Enrolla la pelvis arriba', 'Sin balanceo entre repeticiones'],
    ['Usar impulso y moverse solo desde la cadera'],
  ),
  'hip-abduction-machine': e(
    'Máquina de abductores',
    ['abductores', 'abducción de cadera', 'máquina de glúteo medio'],
    [
      'Siéntate con la espalda contra el respaldo y las rodillas contra las almohadillas exteriores.',
      'Separa las rodillas hasta donde sea cómodo.',
      'Vuelve a juntarlas con control en vez de dejar que el peso tire de ellas.',
    ],
    [
      'Siéntate erguido; inclinarte cambia qué parte del glúteo trabaja',
      'Pausa en el punto más abierto',
    ],
    ['Poner toda la pila y moverla dos dedos', 'Balancear el torso para ganar los últimos grados'],
  ),
  'hip-adduction-machine': e(
    'Máquina de aductores',
    ['aductores', 'aducción de cadera', 'máquina de cara interna'],
    [
      'Siéntate con la espalda contra el respaldo y las rodillas contra las almohadillas interiores.',
      'Junta las rodillas hasta que las almohadillas casi se toquen.',
      'Déjalas abrir de nuevo con control, solo hasta donde el estiramiento sea cómodo.',
    ],
    ['Aprieta, no balancees', 'Para la vuelta donde empieza el estiramiento, no donde duele'],
    [
      'Cargar tanto que la vuelta se convierte en una caída',
      'Abrir más de lo que la cadera tiene calentado',
    ],
  ),
  'incline-barbell-press': e(
    'Press inclinado con barra',
    ['press inclinado', 'banca inclinada'],
    [
      'Pon el banco a unos 30 grados.',
      'Saca la barra y bájala a la parte alta del pecho.',
      'Empuja hacia arriba y un poco hacia atrás sobre los hombros.',
    ],
    ['Firme contra el banco', 'Barra a la clavícula, no al cuello'],
    ['Poner el banco demasiado vertical, lo que lo convierte en press de hombro'],
  ),
  'incline-cable-curl': e(
    'Curl inclinado en polea',
    ['curl en banco inclinado con poleas'],
    [
      'Centra un banco con poca inclinación entre dos poleas bajas, con la cabecera hacia la máquina. Coge un agarre en cada mano y recuéstate con los pies apoyados, palmas al frente.',
      'Brazos colgando junto o un poco por detrás del torso; sube los dos agarres hacia los hombros. Que los cables no rocen el banco ni el cuerpo.',
      'Baja despacio hasta casi estirar los codos sin despegar la espalda ni adelantar los brazos.',
    ],
    ['Espalda en el respaldo', 'Cables libres', 'Brazos quietos'],
    [
      'Colocar el banco de modo que los cables rocen la estructura o el cuerpo',
      'Levantar los hombros para balancear los agarres',
    ],
  ),
  'incline-dumbbell-curl': e(
    'Curl inclinado con mancuernas',
    ['curl inclinado', 'curl en banco inclinado'],
    [
      'Recuéstate en un banco a unos 45 grados con los brazos colgando rectos.',
      'Sube las mancuernas sin adelantar los codos.',
      'Baja del todo hasta el estiramiento.',
    ],
    ['Los codos se quedan detrás del cuerpo', 'Controla el estiramiento abajo'],
    ['Despegar los hombros del banco para subir el peso con impulso'],
  ),
  'incline-dumbbell-fly': e(
    'Aperturas inclinadas con mancuernas',
    ['aperturas en banco inclinado'],
    [
      'Pon un banco con poca inclinación, unos 30 grados. Túmbate con los pies apoyados y mancuernas ligeras sobre la parte alta del pecho, palmas enfrentadas.',
      'Mantén una flexión suave y fija del codo y abre los brazos en arco hasta que queden más o menos a la altura del torso o el pecho se estire cómodo.',
      'Junta las mancuernas sobre la parte alta del pecho por el mismo arco, sin chocarlas ni cambiar el ángulo del codo.',
    ],
    ['Inclinación moderada', 'Ángulo del codo fijo', 'Controla el estiramiento abajo'],
    ['Bajar los brazos muy por detrás del torso', 'Empujar en vez de abrir o usar demasiado peso'],
  ),
  'incline-dumbbell-press': e(
    'Press inclinado con mancuernas',
    ['press inclinado mancuernas', 'banca inclinada con mancuernas'],
    [
      'Pon el banco a unos 30 grados.',
      'Baja las mancuernas a la altura del pecho con los codos bajo las muñecas.',
      'Empuja hasta estirar los brazos.',
    ],
    ['Costillas abajo', 'No choques las mancuernas arriba'],
    ['Encoger los hombros hacia las orejas'],
  ),
  'incline-hammer-curl': e(
    'Curl martillo inclinado',
    ['curl martillo en banco inclinado'],
    [
      'Siéntate en un banco a unos 45 o 60 grados con los pies apoyados. Deja colgar las mancuernas a los lados con las palmas hacia dentro.',
      'Brazos quietos, sube las mancuernas hacia los hombros sin girar las palmas hacia arriba.',
      'Baja despacio hasta casi estirar los codos con la espalda contra el respaldo.',
    ],
    ['Palmas hacia dentro', 'Brazos quietos', 'Espalda apoyada'],
    ['Echar los hombros hacia delante', 'Girar las palmas hacia arriba o recortar abajo'],
  ),
  'incline-machine-chest-press': e(
    'Press inclinado en máquina',
    ['máquina de press inclinado', 'press de pecho inclinado en máquina'],
    [
      'Elige una carga manejable. En máquina de discos, carga los dos lados por igual. Ajusta el asiento o el respaldo para que los agarres empiecen junto a la parte alta del pecho.',
      'Apóyate en el respaldo inclinado con los pies firmes y la cadera apoyada. Lleva las escápulas suavemente atrás y abajo.',
      'Agarra completo con las muñecas rectas. Codos un poco por debajo de los hombros y antebrazos alineados con los agarres.',
      'Suelta el aire y empuja los agarres hacia delante y arriba siguiendo el recorrido de la máquina. Hombros y espalda contra el respaldo; estira sin bloquear los codos de golpe.',
      'Coge aire mientras bajas despacio hasta que los agarres vuelvan junto a la parte alta del pecho, o a la posición más profunda que controles con comodidad. Sin rebotar ni forzar el estiramiento.',
      'Repite con el mismo recorrido y ritmo. Devuelve los agarres suavemente a sus topes antes de soltar.',
    ],
    [
      'Escápulas atrás y abajo',
      'Espalda y cadera en los respaldos',
      'Empuja suave y controla la vuelta',
      'Muñecas rectas, codos por debajo de los hombros',
    ],
    [
      'Ajustar de modo que los agarres empiecen cerca del cuello en vez del pecho alto',
      'Despegar cadera u hombros para mover demasiado peso',
      'Abrir los codos a la altura de los hombros o doblar las muñecas hacia atrás',
      'Rebotar abajo, forzar la profundidad o bloquear los codos de golpe',
    ],
  ),
  'incline-push-up': e(
    'Flexión inclinada',
    ['flexiones con manos elevadas', 'flexión en banco'],
    [
      'Apoya las manos algo más abiertas que los hombros en un banco estable o una superficie elevada fija. Retrocede hasta que el cuerpo forme una línea recta de la cabeza a los talones.',
      'Aprieta el abdomen y dobla los codos para bajar el pecho hacia el borde, con los codos a unos 30 o 45 grados del torso.',
      'Empuja con las palmas hasta estirar los brazos sin dejar caer la cadera. Un apoyo más alto lo hace más fácil.',
    ],
    [
      'Línea recta pasando por la cadera',
      'Lleva el pecho hacia el apoyo',
      'Usa un apoyo que no resbale ni vuelque',
    ],
    ['Dejar caer la zona lumbar', 'Abrir los codos o apoyar solo la punta de los dedos'],
  ),
  'jm-press': e(
    'JM press',
    ['press JM', 'press JM de tríceps'],
    [
      'Túmbate en un banco plano bajo una barra en el rack con los pies apoyados. Pon los seguros y agarra cerrado a la anchura de los hombros. Aprende el recorrido con la barra vacía o muy ligera.',
      'Saca la barra sobre la parte alta del pecho. Dobla los codos manteniéndolos altos y hacia los pies mientras la barra va hacia el espacio entre barbilla y pecho alto.',
      'Para en la flexión de codo que controles, con la barra lejos de la cara y el cuello. Estira los codos para volver a llevar la barra sobre el pecho.',
      'La espalda alta se queda en el banco todo el tiempo; deja la barra en el rack con seguridad tras la serie.',
    ],
    [
      'Empieza ligero y aprende el recorrido del codo',
      'Barra lejos de la cara y el cuello',
      'Codos altos durante la bajada',
    ],
    [
      'Bajar la barra al cuello o la cara',
      'Convertir cada repetición en un press cerrado',
      'Forzar la flexión del codo o cargar más de lo que controlas',
    ],
  ),
  'jumping-jacks': e(
    'Saltos de tijera',
    ['jumping jacks', 'saltos abriendo piernas y brazos'],
    [
      'De pie, pies juntos y brazos a los lados. Deja espacio libre para estirar los brazos por encima de la cabeza.',
      'Da un pequeño salto para separar los pies mientras subes los brazos por los lados por encima de la cabeza. Aterriza suave con las rodillas en la línea de los pies.',
      'Salta de nuevo a pies juntos mientras los brazos vuelven a los lados. Abrir y cerrar es una repetición; para menos impacto, saca un pie cada vez.',
    ],
    [
      'Aterrizajes pequeños y suaves',
      'Rodillas alineadas con los pies',
      'Abrir y cerrar cuenta como una repetición',
    ],
    [
      'Aterrizar con las rodillas bloqueadas',
      'Saltar más abierto o más rápido de lo que controlas',
    ],
  ),
  'kettlebell-clean': e(
    'Cargada con kettlebell',
    ['clean con kettlebell', 'cargada a una mano con kettlebell'],
    [
      'Empieza como en un swing a una mano, con la kettlebell atrás entre las piernas.',
      'Empuja la cadera al frente y tira de la kettlebell pegada al cuerpo, dejando que gire alrededor de la muñeca.',
      'Recíbela suave en posición de rack y déjala caer de nuevo a la bisagra. Termina el lado y cambia.',
    ],
    [
      'Kettlebell pegada, como subiendo una cremallera',
      'La cadera hace el trabajo',
      'Recepción suave',
    ],
    ['Abrir la kettlebell hacia fuera para que golpee el antebrazo'],
  ),
  'kettlebell-deadlift': e(
    'Peso muerto con kettlebell',
    ['peso muerto kettlebell'],
    [
      'Ponte de pie con la kettlebell entre los pies, bajo el medio del pie.',
      'Lleva la cadera atrás con la espalda recta y agarra el asa con las dos manos.',
      'Levántate empujando la cadera al frente y bájala de la misma forma.',
    ],
    ['Espalda recta', 'Empuja el suelo', 'Cadera y hombros suben a la vez'],
    ['Redondear la zona lumbar para llegar a la kettlebell', 'Convertirlo en una sentadilla'],
  ),
  'kettlebell-press': e(
    'Press con kettlebell',
    ['press kettlebell a una mano', 'press por encima de la cabeza con kettlebell'],
    [
      'Lleva la kettlebell a la posición de rack: sobre el antebrazo, contra el pecho, muñeca recta.',
      'Aprieta el tronco y los glúteos.',
      'Empújala por encima de la cabeza hasta bloquear y bájala al rack. Termina el lado y cambia.',
    ],
    ['Muñeca recta, nudillos al techo', 'Costillas abajo', 'Bíceps junto a la oreja arriba'],
    ['Echarse hacia atrás para empujar', 'Dejar que la muñeca se doble bajo la kettlebell'],
  ),
  'kettlebell-snatch': e(
    'Arrancada con kettlebell',
    ['snatch con kettlebell', 'arrancada a una mano'],
    [
      'Empieza como en un swing a una mano, con la kettlebell atrás entre las piernas.',
      'Empuja la cadera al frente y sube la kettlebell pegada al cuerpo.',
      'Mete la mano a través mientras sube para que aterrice suave sobre la cabeza con el brazo bloqueado. Bájala de nuevo a la bisagra.',
    ],
    ['Mete la mano arriba', 'Pegada al subir', 'Bloquea el brazo arriba'],
    [
      'Dejar que la kettlebell caiga de golpe sobre el antebrazo',
      'Empujarla hacia arriba con el brazo',
    ],
  ),
  'kettlebell-swing': e(
    'Swing con kettlebell',
    ['swing ruso', 'swing a dos manos', 'swing'],
    [
      'De pie con los pies a la anchura de los hombros y la kettlebell en el suelo a un palmo largo delante de ti.',
      'Haz la bisagra, coge el asa con las dos manos y llévala atrás entre las piernas.',
      'Lanza la cadera al frente para que la kettlebell flote hasta la altura del pecho con los brazos rectos, y deja que vuelva a caer a la bisagra.',
    ],
    [
      'Es una bisagra, no una sentadilla',
      'La cadera explota, los brazos solo sujetan',
      'Glúteos apretados arriba',
    ],
    [
      'Subir la kettlebell con los brazos o los hombros',
      'Hacer sentadilla en vez de bisagra',
      'Echarse hacia atrás arriba',
    ],
  ),
  'lat-pulldown': e(
    'Jalón al pecho',
    ['jalón', 'jalón dorsal', 'polea al pecho'],
    [
      'Ajusta el soporte de muslos para quedarte sentado.',
      'Agarra más abierto que los hombros e inclínate un poco atrás.',
      'Lleva la barra a la parte alta del pecho y vuelve al estiramiento completo.',
    ],
    ['Pecho arriba, barra a la clavícula', 'Deja que las escápulas suban arriba'],
    ['Inclinarse tanto que se convierte en un remo', 'Tirar por detrás de la nuca'],
  ),
  'lateral-raise': e(
    'Elevaciones laterales',
    ['elevación lateral', 'elevaciones laterales con mancuernas', 'pájaros laterales'],
    [
      'De pie con las mancuernas a los lados y los codos un poco flexionados.',
      'Sube hacia los lados hasta que los brazos queden a la altura de los hombros.',
      'Baja despacio.',
    ],
    ['Guía con los codos', 'Para a la altura de los hombros'],
    ['Subir el peso con impulso de la zona lumbar', 'Ir demasiado pesado'],
  ),
  'leg-extension': e(
    'Extensión de cuádriceps',
    ['extensiones de pierna', 'sillón de cuádriceps'],
    [
      'Pon el rodillo justo por encima de los tobillos.',
      'Estira las rodillas hasta que las piernas queden rectas.',
      'Baja con control sin dejar descansar el peso.',
    ],
    ['Pausa breve arriba', 'Lento al bajar'],
    ['Balancear el torso para empezar cada repetición'],
  ),
  'leg-press': e(
    'Prensa de piernas',
    ['prensa', 'leg press'],
    [
      'Siéntate con los pies a la anchura de los hombros en la plataforma.',
      'Baja hasta que las rodillas lleguen a unos 90 grados.',
      'Empuja de nuevo sin bloquear las rodillas con fuerza.',
    ],
    ['Que la zona lumbar no se despegue del respaldo', 'Controla la bajada'],
    ['Bajar tanto las rodillas que la pelvis se mete hacia dentro'],
  ),
  'log-press': e(
    'Press de log',
    ['log press', 'press con tronco de strongman'],
    [
      'Usa un log de strongman con asas neutras interiores y una zona despejada. Llévalo a una posición frontal estable con una cargada practicada o desde soportes adecuados, y aprieta con los pies a la anchura de los hombros.',
      'Con el torso erguido, flexiona un poco las rodillas, empuja con las piernas y lleva el log por encima de la cabeza con las palmas enfrentadas.',
      'Termina con brazos y rodillas estirados y el log equilibrado sobre los hombros y el medio del pie. No te eches atrás arqueando la zona lumbar.',
      'Baja a la posición frontal con control, amortiguando con las rodillas. Recolócate antes del siguiente press y devuelve el log de un modo practicado. Cada press por encima de la cabeza es una repetición.',
    ],
    [
      'Agarra firme las asas interiores',
      'Flexión e impulso vertical',
      'Termina con el log equilibrado arriba',
    ],
    [
      'Empujar desde una posición frontal inestable',
      'Echarse muy atrás en vez de meterse bajo el log',
      'Soltar el log sin una zona de caída despejada',
    ],
  ),
  'lying-leg-curl': e(
    'Curl femoral tumbado',
    ['curl de isquiotibiales', 'curl femoral', 'femoral tumbado'],
    [
      'Túmbate boca abajo con el rodillo justo por encima de los talones.',
      'Lleva los talones hacia los glúteos.',
      'Baja despacio hasta el estiramiento completo.',
    ],
    ['La cadera se queda en el banco', 'Negativa lenta'],
    ['Levantar la cadera para subir el peso con impulso'],
  ),
  'lying-leg-raise': e(
    'Elevación de piernas tumbado',
    ['elevación de piernas en el suelo', 'elevaciones de piernas'],
    [
      'Túmbate boca arriba con la cabeza y las escápulas apoyadas, brazos junto a la cadera y palmas abajo. Aprieta el abdomen y mantén la zona lumbar suave contra el suelo.',
      'Sube las dos piernas juntas con las rodillas casi estiradas. Al acercarte a la vertical, enrolla suavemente la pelvis hacia las costillas sin balancearte.',
      'Baja despacio solo hasta donde la espalda siga estable. Dobla las rodillas o acorta la bajada si la zona lumbar se arquea.',
    ],
    ['Cabeza y hombros apoyados', 'Zona lumbar estable', 'Controla el recorrido de bajada'],
    [
      'Arquear la espalda cuando los talones se acercan al suelo',
      'Balancear las piernas o levantar la cabeza para compensar',
    ],
  ),
  'machine-chest-press': e(
    'Press de pecho en máquina',
    ['máquina de press de pecho', 'press en máquina'],
    [
      'Ajusta el asiento para que los agarres queden a mitad del pecho.',
      'Empuja hasta estirar los brazos sin bloquear con fuerza.',
      'Vuelve con control hasta notar estiramiento.',
    ],
    ['Escápulas atrás y abajo', 'Recorrido completo, sin rebotes'],
    ['Asiento demasiado alto, lo que lo convierte en un press inclinado'],
  ),
  'machine-lateral-raise': e(
    'Elevación lateral en máquina',
    ['máquina de elevaciones laterales'],
    [
      'Ajusta el asiento para que los hombros queden alineados con el eje de la máquina y las almohadillas por fuera de los brazos, por encima de los codos.',
      'Siéntate erguido con los pies apoyados y los codos un poco flexionados. Sube los brazos hacia los lados hasta la altura de los hombros.',
      'Baja las almohadillas despacio sin dejar que la pila de peso choque.',
    ],
    [
      'Guía con los brazos',
      'Hombros lejos de las orejas',
      'Termina cómodo a la altura de los hombros',
    ],
    [
      'Encoger los hombros o balancear el torso',
      'Ajustar el asiento con el eje muy por encima o por debajo de los hombros',
    ],
  ),
  'machine-shrug': e(
    'Encogimientos en máquina',
    ['máquina de encogimientos'],
    [
      'Ponte en la máquina de encogimientos con los pies firmes y agarra cerrado las asas laterales. Ajusta los topes antes de cargar.',
      'Brazos estirados y torso quieto mientras subes los dos hombros hacia las orejas.',
      'Pausa breve y baja los hombros con control hasta un estiramiento cómodo.',
    ],
    ['Sube los hombros en línea recta', 'Codos estirados', 'Cabeza alineada con el torso'],
    ['Hacer círculos con los hombros', 'Doblar los codos o rebotar con las rodillas'],
  ),
  'machine-triceps-extension': e(
    'Extensión de tríceps en máquina',
    ['máquina de tríceps', 'extensión de brazos en máquina'],
    [
      'Ajusta el asiento para que los brazos descansen en la almohadilla delantera y los codos queden alineados con el eje. Agarra las dos asas con las muñecas rectas.',
      'Brazos sobre la almohadilla, estira los codos para mover las asas por el recorrido de la máquina.',
      'Vuelve despacio a una flexión de codo cómoda sin levantar los brazos ni dejar que la pila choque.',
    ],
    [
      'Los brazos se quedan en la almohadilla',
      'Muévete desde los codos',
      'Termina sin bloquear los codos de golpe',
    ],
    [
      'Levantar hombros o brazos para mover las asas',
      'Usar impulso o forzar el estiramiento abajo',
    ],
  ),
  'mountain-climbers': e(
    'Escaladores',
    ['mountain climbers', 'escalador'],
    [
      'Empieza en plancha alta con las manos bajo los hombros y el cuerpo en línea recta.',
      'Lleva una rodilla hacia el pecho sin subir la cadera y devuelve el pie mientras la otra rodilla avanza.',
      'Alterna a un ritmo que te deje mantener los hombros sobre las manos y el tronco quieto. Cada rodilla cuenta como una repetición.',
    ],
    ['Cadera nivelada', 'Hombros sobre las manos', 'Controla cada rodilla'],
    [
      'Botar con la cadera o hundir la zona lumbar',
      'Ir tan rápido que pies y tronco pierden el control',
    ],
  ),
  'muscle-up': e(
    'Muscle up',
    ['muscle up en barra', 'bar muscle up'],
    [
      'Usa una barra recta segura con espacio de sobra por encima y alrededor para la transición y el balanceo. Empieza con agarre prono cerrado y hombros activos. Esta versión usa un kip controlado.',
      'Crea un pequeño balanceo de hueco a arco, luego empuja la cadera y tira de la barra hacia el pecho bajo, manteniéndola cerca.',
      'Cuando el torso sube por encima de la barra, pasa los dos codos a la vez e inclina el pecho al frente hasta un fondo estable en barra.',
      'Empuja hasta el apoyo con los brazos rectos. Invierte la transición con control y recoloca el balanceo antes de la siguiente. Practica por separado el tirón, la transición y el fondo en barra antes de unirlos.',
    ],
    [
      'Barra cerca en la transición',
      'Pasa los dos codos a la vez',
      'Controla el balanceo y la bajada',
    ],
    [
      'Pasar un codo antes que el otro',
      'Intentar la transición sin una dominada y un fondo en barra fuertes',
      'Usar una barra con poco espacio arriba o para el balanceo',
    ],
  ),
  'neck-curl': e(
    'Flexión de cuello',
    ['curl de cuello tumbado', 'flexión cervical'],
    [
      'Túmbate boca arriba en un banco plano con escápulas y torso apoyados, pies firmes y la cabeza justo fuera del extremo. Empieza sin peso añadido.',
      'Mete la barbilla con suavidad y levanta la cabeza un poco con la parte delantera del cuello. Los hombros se quedan en el banco.',
      'Baja despacio a una posición cómoda sin dejar caer la cabeza hacia atrás. Usa un recorrido pequeño y sin dolor, y para si notas dolor de cuello o mareo.',
    ],
    ['Empieza sin peso añadido', 'Hombros apoyados', 'Movimiento lento y corto'],
    [
      'Convertirlo en un abdominal',
      'Dejarse caer en un estiramiento profundo o forzar la barbilla al frente',
    ],
  ),
  'one-arm-cable-bicep-curl': e(
    'Curl de bíceps a una mano en polea',
    ['curl a una mano en polea', 'curl unilateral en polea'],
    [
      'Engancha un agarre a una polea baja y sujétalo con una mano, palma al frente. Mira a la máquina con una postura estable y el codo junto a las costillas.',
      'Sube el agarre hacia el hombro que trabaja con el brazo quieto y la muñeca recta. La mano libre en la cadera o relajada.',
      'Baja despacio hasta casi estirar el brazo sin girar el torso. Haz los dos lados y registra repeticiones por brazo.',
    ],
    ['Palma hacia arriba', 'Codo junto a las costillas', 'Torso quieto'],
    ['Girar el torso para mover el agarre', 'Doblar la muñeca o adelantar el brazo'],
  ),
  'one-arm-pull-ups': e(
    'Dominadas a una mano',
    ['dominada a una mano', 'dominada a un brazo'],
    [
      'Usa una barra segura con espacio para bajar con control. Es una dominada a una mano sin ayuda con agarre prono; domina antes progresiones asistidas controladas.',
      'Agarra cerrado con una mano y activa el hombro con los pies sin tocar el suelo. La otra mano queda libre, sin sujetar la muñeca ni la barra.',
      'Lleva el codo hacia las costillas hasta que la barbilla pase la barra, sin patadas. Permite una pequeña rotación cómoda del cuerpo en vez de forzar el hombro.',
      'Baja con control hasta el brazo largo sin dejarte caer en el hombro. Para antes de que fallen el agarre o el control del hombro. Entrena los dos lados y registra repeticiones por brazo.',
    ],
    [
      'Hombro que trabaja activo',
      'La mano libre fuera de la barra y la muñeca',
      'Controla toda la bajada',
    ],
    [
      'Dejarse caer de golpe a colgar pasivo de un brazo',
      'Patear o contar como libres repeticiones ayudadas con la muñeca',
    ],
  ),
  'one-arm-push-ups': e(
    'Flexiones a una mano',
    ['flexión a una mano', 'flexión a un brazo'],
    [
      'Apoya una palma firme bajo el pecho y abre los pies bastante más que los hombros para tener estabilidad. Pon la mano libre a la espalda y aprieta el tronco.',
      'Dobla el codo de apoyo hacia las costillas para bajar el pecho con control. Que la cadera no se hunda; una pequeña rotación natural del torso es aceptable.',
      'Empuja con la palma de apoyo hasta estirar el brazo sin girarte bruscamente. Haz los dos lados y registra repeticiones por brazo. Practica con la mano en una superficie elevada estable antes de hacerlo en el suelo.',
    ],
    [
      'Pies abiertos y estables',
      'Aprieta contra el exceso de rotación',
      'Codo que trabaja cerca de las costillas',
    ],
    [
      'Usar una postura estrecha antes de controlar la rotación',
      'Hundir la zona lumbar o empujar con la mano libre',
    ],
  ),
  'one-arm-seated-cable-row': e(
    'Remo sentado en polea a una mano',
    ['remo en polea baja a una mano', 'remo unilateral sentado'],
    [
      'Pon un agarre en la polea de remo sentado. Siéntate con los dos pies firmes en las plataformas, rodillas un poco flexionadas y pecho erguido. Sujeta el agarre con una mano en posición neutra.',
      'Pelvis y torso de frente mientras llevas el codo hacia la cadera y el agarre hacia las costillas bajas. La mano libre sobre el muslo.',
      'Estira el brazo despacio dejando que la escápula avance cómoda sin redondear la zona lumbar. Haz los dos lados y registra repeticiones por brazo.',
    ],
    [
      'Torso de frente',
      'Lleva el codo hacia la cadera',
      'Deja que la escápula se mueva con control',
    ],
    [
      'Girar o balancear el torso para mover el peso',
      'Encoger el hombro o redondear la zona lumbar',
    ],
  ),
  'overhead-press': e(
    'Press militar',
    ['press por encima de la cabeza', 'press militar de pie', 'press de hombro con barra'],
    [
      'Coge la barra a la altura de la clavícula con agarre a la anchura de los hombros.',
      'Aprieta el tronco y los glúteos.',
      'Empuja por encima de la cabeza retirando un poco la cabeza y vuelve a meterla al final.',
    ],
    ['Costillas abajo', 'Barra cerca de la cara', 'Termina con la barra sobre las orejas'],
    ['Echarse hacia atrás hasta convertirlo en un press inclinado'],
  ),
  'overhead-squat': e(
    'Sentadilla overhead',
    ['sentadilla con barra por encima de la cabeza', 'OHS'],
    [
      'Aprende con un palo o barra ligera en una zona despejada y practica una salida segura antes de cargar. Usa un agarre ancho de arrancada y lleva la barra arriba con una técnica que ya domines.',
      'Coloca los pies en una postura de sentadilla cómoda. Aprieta y sostén activamente la barra sobre el medio del pie con los codos estirados.',
      'Baja despacio con todo el pie apoyado y las rodillas en la línea de los pies. Baja solo hasta donde la barra siga equilibrada arriba.',
      'Ponte de pie manteniendo el mismo soporte arriba. Devuelve la barra con seguridad con tu técnica practicada; para la serie si los codos ceden o pierdes el equilibrio.',
    ],
    [
      'Barra equilibrada sobre el medio del pie',
      'Empuja hacia arriba contra la barra',
      'Todo el pie apoyado',
    ],
    [
      'Forzar la profundidad mientras la barra se va hacia delante',
      'Doblar los codos o cargar más de lo que controlas arriba',
    ],
  ),
  'overhead-triceps-extension': e(
    'Extensión de tríceps por encima de la cabeza',
    [
      'press francés',
      'extensión overhead',
      'extensión de tríceps en polea por encima de la cabeza',
    ],
    [
      'De espaldas a una polea baja, o sujeta una mancuerna por encima de la cabeza.',
      'Brazos junto a las orejas, baja por detrás de la cabeza.',
      'Estira de nuevo hasta recto.',
    ],
    ['Los brazos no se mueven', 'Busca un buen estiramiento abajo'],
    ['Dejar que los codos se abran mucho'],
  ),
  'pec-deck': e(
    'Contractor de pecho',
    ['pec deck', 'máquina de aperturas', 'mariposa'],
    [
      'Ajusta el asiento para que los agarres queden a la altura del pecho.',
      'Junta las almohadillas delante de ti.',
      'Vuelve hasta notar estiramiento sin dejar descansar el peso.',
    ],
    ['Pecho alto', 'Pausa breve al apretar'],
    ['Encoger los hombros al final de cada repetición'],
  ),
  'pike-push-up': e(
    'Flexión en pica',
    ['pike push up', 'flexión pica'],
    [
      'Empieza apoyado en manos y pies con las manos a la anchura de los hombros. Sube la cadera formando una V invertida con la cabeza entre los brazos.',
      'Dobla los codos hacia atrás y baja la cabeza hacia un punto algo por delante de las manos con la cadera alta.',
      'Empuja el suelo hasta estirar los brazos y vuelve a la V invertida. La cabeza no toca el suelo.',
    ],
    [
      'Cadera alta',
      'Codos hacia atrás en ángulo',
      'Controla la trayectoria de la cabeza por delante de las manos',
    ],
    [
      'Bajar la cadera hasta una flexión normal',
      'Apoyar el peso en la cabeza o abrir mucho los codos',
    ],
  ),
};
