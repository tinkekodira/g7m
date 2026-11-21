import { exercise as e } from '../entry.js';
import type { ExerciseText } from '../types.js';

export const exercises1: Readonly<Record<string, ExerciseText>> = {
  'ab-crunch': e(
    'Crunch',
    ['crunch addominale', 'addominali', 'crunch a terra'],
    [
      'Sdraiati sulla schiena con le ginocchia piegate e i piedi a terra, mani accanto alla testa o un disco sul petto.',
      'Stacca le spalle da terra arrotondando la parte alta della schiena, costole verso il bacino.',
      'Fai una pausa in alto e scendi con controllo finché le spalle toccano terra.',
    ],
    ['Costole verso il bacino', 'La zona lombare resta a terra', 'Espira salendo'],
    [
      'Tirare la testa con le mani',
      'Salire fino a sedersi, che sposta il lavoro sui flessori dell’anca',
    ],
  ),
  'ab-wheel-rollout': e(
    'Ruota per addominali',
    ['ab wheel', 'rotella addominali', 'rollout in ginocchio'],
    [
      'Mettiti in ginocchio su una superficie comoda con entrambe le mani sulla ruota sotto le spalle. Stringi i glutei e contrai l’addome.',
      'Rotola in avanti lentamente aprendo spalle e anche, costole basse e zona lombare stabile. Fermati prima di perdere questa posizione.',
      'Riporta la ruota verso le ginocchia con il busto contratto. Inizia con escursioni brevi e allungale man mano che il controllo migliora.',
    ],
    [
      'Costole basse e glutei stretti',
      'Fermati prima che la zona lombare si inarchi',
      'Muovi spalle e anche insieme',
    ],
    [
      'Rotolare più lontano di quanto l’addome controlli',
      'Piegarsi bruscamente alle anche per tornare',
    ],
  ),
  'air-bike': e(
    'Air bike',
    ['assault bike', 'echo bike', 'bici ad aria'],
    [
      'Regola la sella come su una bici normale.',
      'Spingi e tira le maniglie insieme ai pedali: più spingi, più la ventola resiste.',
      'Negli intervalli, a tutta nella fase di lavoro e pedalata leggera nel recupero.',
    ],
    ['Braccia e gambe insieme', 'Espira spingendo'],
    ['Partire a tutta e non avere più niente a metà intervallo'],
  ),
  'arnold-press': e(
    'Arnold press',
    ['distensioni Arnold', 'arnold press con manubri'],
    [
      'In piedi, piedi alla larghezza delle anche e ginocchia morbide. Tieni i manubri davanti alle spalle, palmi verso di te e gomiti piegati. Contrai addome e glutei.',
      'Spingi verso l’alto ruotando i palmi in avanti e aprendo i gomiti. Costole sopra il bacino, senza spinta delle gambe.',
      'Scendi lentamente invertendo la rotazione finché i manubri tornano davanti alle spalle. Usa un’escursione comoda senza forzare la rotazione.',
    ],
    ['Ruota in modo fluido mentre spingi', 'Costole basse', 'Polsi sopra gli avambracci'],
    ['Inarcare la zona lombare per finire', 'Forzare le spalle in una posizione bassa scomoda'],
  ),
  'back-extension': e(
    'Iperestensioni',
    ['hyperextension', 'estensioni lombari a 45 gradi'],
    [
      'Regola il cuscinetto appena sotto la piega dell’anca.',
      'Scendi piegandoti all’anca finché senti allungare i femorali.',
      'Risali finché il corpo forma una linea retta.',
    ],
    ['Fermati in linea, non inarcarti oltre', 'Stringi i glutei in alto'],
    ['Iperestendere la colonna in alto'],
  ),
  'barbell-back-squat': e(
    'Squat con bilanciere',
    ['squat', 'back squat', 'accosciata'],
    [
      'Appoggia il bilanciere sulla parte alta della schiena e contrai forte il busto.',
      'Sgancia, fai un passo indietro e allarga i piedi un po’ più delle anche.',
      'Siediti tra le anche finché le cosce sono almeno parallele, poi spingi su.',
    ],
    [
      'Respiro profondo, contrai',
      'Le ginocchia seguono le punte',
      'Spingi il pavimento con tutto il piede',
    ],
    [
      'Far cadere il petto in avanti uscendo dalla buca',
      'Accorciare la profondità quando il carico sale',
    ],
  ),
  'barbell-bench-press': e(
    'Panca piana con bilanciere',
    ['panca piana', 'panca', 'distensioni su panca'],
    [
      'Sdraiati con gli occhi sotto il bilanciere e i piedi a terra.',
      'Impugna un po’ più largo delle spalle e stringi il bilanciere.',
      'Sgancia, scendi con controllo a metà petto e spingi di nuovo su.',
    ],
    ['Petto alto', 'Gomiti a circa 45 gradi', 'Spingi il pavimento con i piedi'],
    ['Far rimbalzare il bilanciere sul petto', 'Aprire i gomiti del tutto di lato'],
  ),
  'barbell-calf-raise': e(
    'Calf raise con bilanciere',
    ['polpacci in piedi con bilanciere', 'calf raise sul disco'],
    [
      'Nel rack con le sicure regolate, metti un disco piatto e stabile sotto l’avampiede, talloni liberi oltre il bordo. Inizia con un bilanciere leggero sulla parte alta della schiena, sotto il collo.',
      'Contrai e sali sull’avampiede di entrambi i piedi più in alto che controlli, ginocchia morbidamente distese.',
      'Fai una pausa, poi abbassa i talloni lentamente fino a un allungamento comodo senza far oscillare il disco né rimbalzare. Riaggancia il bilanciere prima di scendere.',
    ],
    [
      'Avampiedi saldi sul disco',
      'Sali dritto dalle caviglie',
      'Controlla allungamento e contrazione',
    ],
    [
      'Stare su un disco che oscilla o scivola',
      'Rimbalzare in basso o piegare le ginocchia per sollevare il bilanciere',
    ],
  ),
  'barbell-curl': e(
    'Curl con bilanciere',
    ['curl bicipiti', 'curl bilanciere dritto'],
    [
      'In piedi, tieni il bilanciere alla larghezza delle spalle, braccia distese.',
      'Porta il bilanciere all’altezza delle spalle con i gomiti ai fianchi.',
      'Scendi con controllo fino alla completa estensione.',
    ],
    ['Gomiti incollati alle costole', 'Estensione completa in basso'],
    ['Dare un colpo d’anca per iniziare ogni ripetizione'],
  ),
  'barbell-front-squat': e(
    'Front squat',
    ['squat frontale', 'front squat con bilanciere'],
    [
      'Appoggia il bilanciere sulla parte anteriore delle spalle, gomiti alti.',
      'Scendi in squat tenendo il busto eretto.',
      'Risali senza far cadere i gomiti.',
    ],
    ['Gomiti alti', 'Petto alto'],
    ['Abbassare i gomiti, che fa scivolare il bilanciere in avanti'],
  ),
  'barbell-hip-thrust': e(
    'Hip thrust con bilanciere',
    ['hip thrust', 'spinta d’anca', 'ponte glutei con bilanciere'],
    [
      'Siediti con la parte alta della schiena contro una panca e il bilanciere sopra le anche.',
      'Spingi le anche in alto finché il busto è parallelo al pavimento.',
      'Scendi con controllo senza appoggiare il bilanciere a terra.',
    ],
    ['Mento in dentro, costole basse', 'Stringi forte i glutei in alto'],
    ['Iperestendere la zona lombare in alto invece di chiudere con i glutei'],
  ),
  'barbell-lunge': e(
    'Affondi con bilanciere',
    ['affondo con bilanciere', 'affondi frontali'],
    [
      'Sgancia un bilanciere sulla parte alta della schiena con presa chiusa e contrai. In piedi, piedi alla larghezza delle anche, con spazio libero davanti.',
      'Fai un passo avanti su un binario separato, alla larghezza delle anche. Piega entrambe le ginocchia con controllo, piede anteriore ben piantato e bacino in bolla.',
      'Spingi con il piede anteriore per tornare alla posizione iniziale. Alterna o completa un lato, e registra le ripetizioni per gamba.',
    ],
    [
      'Passo su due binari',
      'Il piede anteriore resta piantato',
      'Controlla il ritorno prima del passo successivo',
    ],
    [
      'Camminare come su una fune o far cedere il ginocchio anteriore verso l’interno',
      'Sbattere il ginocchio posteriore a terra',
    ],
  ),
  'barbell-preacher-curl': e(
    'Curl alla panca Scott (bilanciere)',
    ['curl Scott con bilanciere', 'panca Scott', 'preacher curl'],
    [
      'Regola il cuscinetto in modo che le ascelle poggino sul bordo superiore.',
      'Prendi un bilanciere dritto alla larghezza delle spalle, palmi in su, e sollevalo fermandoti prima della verticale.',
      'Scendi lentamente finché le braccia sono quasi distese.',
    ],
    ['I gomiti non si staccano dal cuscinetto', 'Polsi dritti, non piegati all’indietro'],
    [
      'Lasciar cadere il peso in basso, che sforza il gomito',
      'Caricarlo come il bilanciere EZ; la presa dritta è più dura per i polsi',
    ],
  ),
  'barbell-row': e(
    'Rematore con bilanciere',
    ['rematore a busto flesso', 'pendlay row', 'rematore bilanciere'],
    [
      'Piegati all’anca finché il busto è a circa 45 gradi, schiena piatta.',
      'Tira il bilanciere verso le costole basse.',
      'Scendi con controllo senza far arrotondare la schiena.',
    ],
    ['Schiena piatta per tutto il tempo', 'Gomiti oltre le costole'],
    ['Raddrizzarsi quando la serie si fa dura', 'Strattonare con la zona lombare'],
  ),
  'barbell-shrug': e(
    'Scrollate con bilanciere',
    ['scrollate', 'shrug', 'alzate di spalle'],
    [
      'Tieni il bilanciere a braccia distese davanti alle cosce.',
      'Solleva le spalle dritte verso le orecchie.',
      'Scendi con controllo fino al completo allungamento.',
    ],
    ['Su e giù in linea retta', 'Pausa in alto'],
    ['Ruotare le spalle, che non aggiunge niente e irrita l’articolazione'],
  ),
  'bench-dips': e(
    'Dip su panca',
    ['dip alla panca', 'dip per tricipiti su panca'],
    [
      'Siediti sul bordo di una panca stabile con le mani accanto alle anche, dita in avanti. Pianta i piedi e porta le anche appena oltre il bordo. Inizia con le ginocchia piegate.',
      'Piega i gomiti all’indietro e scendi con le anche vicino alla panca solo finché le spalle lo permettono comodamente.',
      'Spingi sui palmi per distendere i gomiti e sollevare le anche. Tieni il petto aperto e fermati se la posizione della spalla è scomoda.',
    ],
    ['Anche vicine alla panca', 'Spalle basse', 'Profondità ridotta e comoda'],
    [
      'Scendere con le spalle molto sotto i gomiti',
      'Lasciar scivolare la panca o allontanare molto le anche',
    ],
  ),
  'bicycle-crunch': e(
    'Crunch bicicletta',
    ['bicycle crunch', 'bicicletta addominali'],
    [
      'Sdraiati sulla schiena con le ginocchia piegate sopra le anche e le mani appoggiate leggere accanto alla testa. Stacca un po’ le scapole e contrai l’addome.',
      'Ruota il petto verso un ginocchio piegato mentre distendi la gamba opposta. Porta la spalla verso il ginocchio senza tirare la testa.',
      'Cambia lato lentamente con la zona lombare stabile. Ogni lato conta come una ripetizione.',
    ],
    [
      'Ruota il petto, non solo il gomito',
      'Mani appena appoggiate alla testa',
      'Distendi la gamba solo fin dove controlli',
    ],
    ['Tirare il collo in avanti con le mani', 'Pedalare veloce senza ruotare il busto'],
  ),
  'box-squat': e(
    'Box squat',
    ['squat al box', 'squat seduto sul box'],
    [
      'Metti un box stabile dietro di te dentro un rack con le sicure. Scegli un’altezza che raggiungi con controllo. Sgancia il bilanciere sulla parte alta della schiena e prendi posizione.',
      'Contrai e piega anche e ginocchia, sedendoti all’indietro verso il box con i piedi piantati e le ginocchia in linea con le punte.',
      'Appoggiati dolcemente e fai una breve pausa mantenendo la tensione del busto e la pressione dei piedi.',
      'Spingi con entrambi i piedi per alzarti senza oscillare in avanti né rimbalzare sul box.',
    ],
    ['Siediti piano e con controllo', 'Resta contratto sul box', 'Alzati senza oscillare'],
    [
      'Lasciarsi cadere sul box o rilassare la zona lombare',
      'Usare un box instabile o troppo basso',
    ],
  ),
  'bulgarian-split-squat': e(
    'Squat bulgaro',
    ['affondo bulgaro', 'split squat con piede rialzato', 'bulgaro'],
    [
      'Appoggia il piede posteriore su una panca dietro di te.',
      'Scendi finché la coscia anteriore è circa parallela.',
      'Risali spingendo con il piede anteriore.',
    ],
    ['Peso sul tallone anteriore', 'Busto leggermente in avanti per i glutei'],
    ['Stare troppo vicino alla panca, che costringe il ginocchio anteriore'],
  ),
  burpees: e(
    'Burpees',
    ['burpee'],
    [
      'In piedi, piedi alla larghezza delle spalle. Accovacciati e appoggia entrambi i palmi saldamente a terra davanti a te.',
      'Salta o porta indietro i piedi in un plank alto solido. Questa versione non include il piegamento; anche in linea con le spalle.',
      'Riporta i piedi all’esterno delle mani, solleva il petto e alzati con un piccolo salto verticale, braccia in alto.',
      'Atterra morbido e inizia la successiva con controllo. Accosciata, plank, ritorno e salto contano come una ripetizione.',
    ],
    [
      'Contrai prima di portare indietro i piedi',
      'Piedi all’esterno delle mani',
      'Atterra morbido e ricomponiti',
    ],
    ['Far cedere le anche nel plank', 'Riportare i piedi di fretta o atterrare a ginocchia rigide'],
  ),
  'cable-crunch': e(
    'Crunch ai cavi',
    ['crunch in ginocchio al cavo', 'crunch con corda'],
    [
      'Inginocchiati di schiena a un cavo alto con la corda accanto alla testa.',
      'Chiuditi verso il basso arrotondando la colonna, non piegando le anche.',
      'Torna su con controllo.',
    ],
    ['Le anche restano ferme', 'Arrotonda la colonna di proposito'],
    ['Trasformarlo in una flessione d’anca e far lavorare i flessori dell’anca'],
  ),
  'cable-curl': e(
    'Curl ai cavi',
    ['curl bicipiti al cavo', 'curl con corda'],
    [
      'In piedi di fronte a un cavo basso con bilanciere dritto o corda.',
      'Porta all’altezza delle spalle con i gomiti ai fianchi.',
      'Scendi finché le braccia sono distese mantenendo la tensione sul cavo.',
    ],
    ['Gomiti fermi', 'Contrai in alto'],
    ['Inclinarsi indietro per finire la ripetizione'],
  ),
  'cable-fly': e(
    'Croci ai cavi',
    ['croci al cavo', 'crossover', 'cable crossover'],
    [
      'Regola entrambi i cavi all’altezza delle spalle o più in alto.',
      'Fai un passo avanti in posizione divaricata con i gomiti leggermente piegati.',
      'Porta le maniglie insieme davanti al petto, poi torna con controllo.',
    ],
    ['Angolo del gomito fisso', 'Contrai al centro'],
    ['Trasformarle in una distensione piegando e distendendo i gomiti'],
  ),
  'cable-hammer-curl': e(
    'Hammer curl ai cavi',
    ['curl a martello con corda', 'curl presa neutra al cavo'],
    [
      'Aggancia una corda a un cavo basso. Di fronte alla macchina, tieni un capo per mano, palmi uno verso l’altro e pollici in su.',
      'In piedi, gomiti accanto alle costole, porta la corda verso le spalle senza muovere le braccia.',
      'Scendi lentamente quasi fino a distendere i gomiti, polsi neutri e pacco pesi sotto controllo.',
    ],
    ['Pollici in su', 'Gomiti accanto alle costole', 'Scendi senza slancio'],
    ['Inclinarsi indietro per muovere il peso', 'Piegare i polsi o portare avanti i gomiti'],
  ),
  'cable-kickback': e(
    'Kickback ai cavi',
    ['slanci glutei al cavo', 'kickback glutei', 'estensione d’anca al cavo'],
    [
      'Aggancia una cavigliera a un cavo basso attorno a una caviglia. Di fronte alla macchina, tieniti con entrambe le mani, ginocchio d’appoggio morbido.',
      'Contrai con una leggera inclinazione in avanti. Porta indietro la gamba con la cavigliera partendo dall’anca, bacino frontale e ginocchio leggermente piegato.',
      'Fermati prima che la zona lombare si inarchi e torna lentamente senza appoggiare il peso. Fai entrambi i lati e registra le ripetizioni per gamba.',
    ],
    ['Muoviti dall’anca', 'Bacino frontale', 'Fermati prima che la schiena si inarchi'],
    ['Slanciare la gamba o ruotare il bacino', 'Inarcare la schiena per alzare di più il piede'],
  ),
  'cable-lat-pullover': e(
    'Pullover ai cavi',
    ['pullover al cavo', 'pullover con corda', 'pullover dorsali'],
    [
      'Prendi una corda al cavo alto, fai un passo indietro e piegati in avanti finché le braccia sono sopra la testa.',
      'Con i gomiti morbidi e fissi, tira la corda in un arco verso il basso fino oltre le anche.',
      'Lasciala risalire finché senti i dorsali allungarsi.',
    ],
    ['Anche indietro, petto in giù', 'Chiudi con le mani accanto alle anche'],
    ['Piegare i gomiti e trasformarlo in un pushdown', 'Stare dritti, che accorcia l’allungamento'],
  ),
  'cable-lateral-raise': e(
    'Alzate laterali ai cavi',
    ['alzata laterale al cavo', 'alzate laterali a un braccio al cavo'],
    [
      'Mettiti di fianco a un cavo basso e prendi la maniglia con la mano più lontana, il cavo che incrocia davanti alle cosce. Usa la mano libera per stabilizzarti.',
      'Con il gomito leggermente e stabilmente piegato, alza il braccio di lato fino all’altezza della spalla, senza inclinarti né alzare la spalla.',
      'Scendi lentamente davanti al corpo mantenendo la tensione. Fai entrambi i lati e registra le ripetizioni per braccio.',
    ],
    ['Guida con il gomito', 'Busto fermo', 'Fermati all’altezza della spalla'],
    ['Oscillare allontanandosi dalla macchina', 'Alzare la spalla o cambiare l’angolo del gomito'],
  ),
  'cable-woodchop': e(
    'Woodchop ai cavi',
    ['taglialegna', 'woodchop', 'rotazione al cavo'],
    [
      'Regola un cavo all’altezza delle spalle e mettiti di fianco.',
      'Prendi la maniglia con entrambe le mani, braccia quasi distese.',
      'Ruota dal busto e tira attraverso il corpo, poi torna lentamente.',
    ],
    ['Ruota dalle costole, non dalle braccia', 'Le anche restano rivolte in avanti'],
    ['Tirare con le braccia invece di ruotare il busto'],
  ),
  'chest-dip': e(
    'Dip (focus petto)',
    ['dip', 'dip per il petto', 'dip alle parallele'],
    [
      'Sostieniti sulle parallele con le braccia distese.',
      'Inclina il busto in avanti di circa 30 gradi e lascia i gomiti aprirsi un po’.',
      'Scendi finché le braccia sono orizzontali, poi spingi su.',
    ],
    ['Inclinati in avanti per il petto', 'Spalle lontane dalle orecchie'],
    [
      'Scendere più di quanto tollerino le spalle',
      'Restare dritti, che lo trasforma in dip per tricipiti',
    ],
  ),
  'chest-supported-dumbbell-row': e(
    'Rematore con manubri con petto in appoggio',
    ['rematore su panca inclinata', 'rematore petto appoggiato'],
    [
      'Regola una panca tra 30 e 45 gradi e sdraiati a pancia in giù, petto sul cuscinetto.',
      'Lascia pendere un manubrio per mano.',
      'Porta entrambi i gomiti indietro oltre il busto, contrai, poi scendi fino al completo allungamento.',
    ],
    ['Il petto resta sul cuscinetto', 'Guida con i gomiti', 'Stringi le scapole'],
    ['Staccare il petto per strattonare il peso', 'Alzare le spalle verso le orecchie'],
  ),
  'chin-up': e(
    'Trazioni presa supina',
    ['chin up', 'trazioni supine', 'trazioni inverse'],
    [
      'Appenditi alla sbarra con presa supina alla larghezza delle spalle.',
      'Tirati su finché il mento supera la sbarra.',
      'Scendi con controllo fino a essere completamente appeso.',
    ],
    ['Porta i gomiti in basso e indietro', 'Appeso completo in basso'],
    ['Accorciare la parte bassa della ripetizione'],
  ),
  'clean-and-jerk': e(
    'Slancio',
    ['clean and jerk', 'girata e slancio', 'slancio olimpico'],
    [
      'Usa un’area libera con dischi bumper e impara separatamente girata, posizione front rack e slancio in sforbiciata con un bilanciere leggero prima di unirli. Bilanciere sopra il mesopiede, mani fuori dalle gambe, schiena contratta.',
      'Spingi il pavimento tenendo il bilanciere vicino al passaggio delle ginocchia. Estendi gambe e anche, poi tirati sotto per riceverlo sulla parte anteriore delle spalle, gomiti avanti.',
      'Alzati completamente dalla girata, sistema il bilanciere in front rack e contrai per lo slancio.',
      'Piegati in verticale di poco, spingi con le gambe verso l’alto e infilati sotto il bilanciere in una sforbiciata stabile con entrambi i gomiti bloccati. Piedi su binari separati alla larghezza delle anche.',
      'Esci dalla sforbiciata con passi controllati finché i piedi sono uniti e il bilanciere è stabile sopra la testa. Riporta giù il bilanciere in un modo collaudato e adatto al carico. Una girata più uno slancio è una ripetizione.',
    ],
    [
      'Bilanciere vicino nella girata',
      'Alzati e stabilizzati prima dello slancio',
      'Piegati in verticale e spingi con le gambe',
      'Ricevi lo slancio su due binari',
    ],
    [
      'Tirare presto con le braccia o allontanare il bilanciere',
      'Slanciare da un front rack instabile',
      'Ricevere con gomiti molli o piedi su una sola linea',
    ],
  ),
  'close-grip-bench-press': e(
    'Panca presa stretta',
    ['panca stretta', 'distensioni presa stretta'],
    [
      'Impugna il bilanciere circa alla larghezza delle spalle.',
      'Scendi verso la parte bassa del petto con i gomiti stretti.',
      'Spingi di nuovo su con i tricipiti.',
    ],
    ['Gomiti stretti a circa 30 gradi', 'Polsi sopra i gomiti'],
    ['Stringere tanto da far male ai polsi'],
  ),
  'close-grip-dumbbell-bench-press': e(
    'Distensioni con manubri presa stretta',
    ['squeeze press', 'panca manubri presa stretta'],
    [
      'Sdraiati su una panca piana con i piedi piantati e la parte alta della schiena appoggiata. Tieni due manubri vicini sopra il petto, palmi uno verso l’altro.',
      'Polsi dritti e gomiti vicini ai fianchi mentre abbassi i manubri verso la parte bassa del petto. I pesi restano in bolla e vicini.',
      'Spingi entrambi insieme fino a braccia distese senza bloccare di scatto. Mantieni la presa neutra e stretta per tutto il tempo.',
    ],
    ['Manubri vicini e in bolla', 'Polsi sopra gli avambracci', 'Gomiti vicini alle costole'],
    [
      'Lasciar inclinare un manubrio o farlo andare avanti',
      'Aprire i gomiti o perdere il polso neutro',
    ],
  ),
  'close-grip-incline-bench-press': e(
    'Panca inclinata presa stretta',
    ['panca inclinata stretta con bilanciere'],
    [
      'Regola una panca inclinata a circa 30 gradi in un rack con le sicure. Sdraiati con i piedi piantati e prendi il bilanciere con presa prona chiusa alla larghezza delle spalle.',
      'Sgancia sopra la parte alta del petto. Scendi con controllo verso di essa, polsi sopra gli avambracci e gomiti angolati verso il busto.',
      'Spingi sulla stessa traiettoria senza sollevare le anche. Usa un assistente o sicure ben regolate e riaggancia saldamente.',
    ],
    [
      'Presa chiusa alla larghezza delle spalle',
      'Parte alta della schiena sul cuscinetto',
      'Scendi con i polsi sopra gli avambracci',
    ],
    [
      'Stringere tanto da piegare i polsi di lato',
      'Aprire i gomiti o far rimbalzare il bilanciere sul petto',
    ],
  ),
  'close-grip-lat-pulldown': e(
    'Lat machine presa stretta',
    ['lat machine triangolo', 'lat machine presa neutra', 'pulldown stretto'],
    [
      'Aggancia un triangolo stretto alla lat machine e regola il cuscinetto delle cosce per bloccare bene le gambe. Prendi le due maniglie con i palmi uno verso l’altro e i pollici chiusi.',
      'Siedi dritto con una leggera inclinazione all’indietro fissa. Tira il triangolo verso la parte alta del petto portando i gomiti in basso accanto alle costole.',
      'Torna lentamente fino a braccia lunghe e un allungamento comodo, senza oscillare né far sbattere il pacco pesi.',
    ],
    ['Porta i gomiti in basso', 'Polsi dritti', 'Angolo del busto stabile'],
    [
      'Oscillare all’indietro per muovere il peso',
      'Tirare dietro la nuca o piegare i polsi verso l’interno',
    ],
  ),
  'concentration-curl': e(
    'Curl di concentrazione',
    ['curl concentrato', 'curl a un braccio seduto'],
    [
      'Siediti su una panca e appoggia il retro di un braccio contro l’interno della coscia.',
      'Porta il manubrio verso la spalla.',
      'Scendi con controllo finché il braccio è disteso, poi cambia lato.',
    ],
    ['Il braccio resta sulla coscia', 'Lento in discesa'],
    ['Spingere il braccio con la coscia'],
  ),
  'conventional-deadlift': e(
    'Stacco da terra',
    ['stacco', 'deadlift', 'stacco classico'],
    [
      'Metti il mesopiede sotto il bilanciere, tibie vicine.',
      'Piegati all’anca, impugna appena fuori dalle gambe e togli il gioco al bilanciere.',
      'Alzati spingendo via il pavimento e chiudi dritto.',
    ],
    [
      'Schiena piatta, petto alto',
      'Il bilanciere resta contro le gambe',
      'Stringi i glutei in alto',
    ],
    ['Arrotondare la zona lombare', 'Strappare il bilanciere da terra'],
  ),
  'decline-ab-crunch': e(
    'Crunch su panca declinata',
    ['crunch declinato', 'addominali su panca declinata'],
    [
      'Aggancia i piedi sotto i rulli di una panca declinata e sdraiati, mani accanto alla testa o un disco sul petto.',
      'Solleva le spalle arrotondando la parte alta della schiena, costole verso il bacino.',
      'Scendi con controllo e fermati prima che le spalle tocchino la panca, per tenere l’addome in tensione.',
    ],
    ['Arrotonda la colonna, non piegarti all’anca', 'Lento in discesa', 'Espira salendo'],
    [
      'Salire di slancio e lasciarsi cadere',
      'Salire fino a sedersi, che passa il lavoro ai flessori dell’anca',
    ],
  ),
  'decline-bench-press': e(
    'Panca declinata',
    ['panca declinata con bilanciere', 'distensioni su panca declinata'],
    [
      'Blocca le gambe su una panca leggermente declinata sotto un bilanciere agganciato. Regola le sicure o usa un assistente. Testa, schiena e anche appoggiate.',
      'Presa chiusa un po’ più larga delle spalle e sgancia. Abbassa il bilanciere lentamente verso la parte bassa del petto con i polsi sopra i gomiti.',
      'Spingi di nuovo sopra le spalle senza rimbalzare né sollevare le anche. Riaggancia saldamente prima di mollare il bilanciere o scendere dalla panca.',
    ],
    [
      'Blocca le gambe prima di sganciare',
      'Scendi verso la parte bassa del petto',
      'Spalle contro la panca',
    ],
    [
      'Far rimbalzare il bilanciere o aprire molto i gomiti',
      'Iniziare senza gambe bloccate o senza un modo sicuro per riagganciare',
    ],
  ),
  'decline-dumbbell-bench-press': e(
    'Panca declinata con manubri',
    ['distensioni declinate con manubri'],
    [
      'Blocca le gambe su una panca leggermente declinata e porta i manubri all’altezza del petto in modo controllato o con un assistente. Testa, spalle e anche appoggiate.',
      'Spingi i manubri sopra il petto con i polsi sopra i gomiti e i palmi in avanti o leggermente verso l’interno.',
      'Scendi lentamente fino a una posizione comoda all’altezza del petto, gomiti angolati indietro, e spingi di nuovo. Esci con controllo dopo l’ultima ripetizione.',
    ],
    ['Gambe ben bloccate', 'Polsi sopra i gomiti', 'Controlla entrata e uscita'],
    [
      'Aprire i gomiti o scendere oltre il comodo',
      'Provare a sedersi con manubri pesanti in posizione instabile',
    ],
  ),
  'decline-dumbbell-fly': e(
    'Croci su panca declinata',
    ['croci declinate con manubri'],
    [
      'Blocca le gambe su una panca leggermente declinata e porta manubri leggeri sopra il petto, palmi uno verso l’altro. Prevedi un’entrata e un’uscita controllate.',
      'Con i gomiti leggermente e stabilmente piegati, apri le braccia in un ampio arco. Fermati quando le braccia arrivano circa al livello del busto, o prima se serve.',
      'Riporta i manubri sopra il petto lungo lo stesso arco senza cambiare l’angolo del gomito né far sbattere i pesi.',
    ],
    [
      'Angolo del gomito fisso',
      'Carichi leggeri e controllati',
      'Fermati a un allungamento comodo del petto',
    ],
    [
      'Scendere con le braccia molto sotto il busto',
      'Piegare i gomiti e trasformarle in una distensione',
    ],
  ),
  'decline-push-up': e(
    'Piegamenti declinati',
    ['flessioni con piedi rialzati', 'piegamenti con piedi sulla panca'],
    [
      'Metti i piedi su una panca bassa e stabile e le mani a terra un po’ più larghe delle spalle.',
      'Contrai in linea retta dalle spalle ai talloni e scendi con il petto verso il pavimento, gomiti angolati indietro.',
      'Spingi via il pavimento fino a braccia distese, anche in linea con il busto.',
    ],
    ['Anche in linea con il busto', 'Porta il petto tra le mani', 'Inizia con un rialzo modesto'],
    ['Alzare o far cedere le anche', 'Usare un appoggio per i piedi instabile o troppo alto'],
  ),
  'decline-smith-bench-press': e(
    'Panca declinata al multipower',
    ['panca declinata smith', 'distensioni declinate al multipower'],
    [
      'Centra una panca leggermente declinata sotto il bilanciere del multipower, blocca le gambe e regola i fermi di sicurezza. Prova il bilanciere vuoto perché scenda verso la parte bassa del petto.',
      'Sdraiati con testa, spalle e anche appoggiate. Presa chiusa un po’ più larga delle spalle, sgancia i ganci e scendi lentamente.',
      'Spingi lungo le guide senza rimbalzare né sollevare le anche. Ruota il bilanciere su entrambi i ganci e controlla che sia fermo prima di mollare.',
    ],
    [
      'Prova la traiettoria prima di caricare',
      'Fermi sotto il tuo punto più basso',
      'Controlla entrambi i ganci prima di mollare',
    ],
    [
      'Mettere la panca in modo che il bilanciere vada verso il collo',
      'Saltare i fermi o mollare un bilanciere non agganciato',
    ],
  ),
  'diamond-push-ups': e(
    'Piegamenti a diamante',
    ['flessioni diamante', 'piegamenti presa stretta'],
    [
      'Parti in plank alto con le mani vicine sotto il petto. Pollici e indici formano un diamante se è comodo; altrimenti lascia un po’ di spazio per i polsi.',
      'Contrai il busto e piega i gomiti all’indietro per portare il petto verso le mani.',
      'Spingi fino a braccia distese con il corpo in linea. Tieni le ginocchia a terra se ti serve una versione più facile.',
    ],
    [
      'Gomiti angolati indietro',
      'Anche in linea',
      'Scegli una posizione delle mani comoda per i polsi',
    ],
    ['Aprire i gomiti o alzare le spalle', 'Far cedere la zona lombare per arrivare alle mani'],
  ),
  'dumbbell-bench-press': e(
    'Panca piana con manubri',
    ['distensioni con manubri', 'panca manubri'],
    [
      'Siediti con i manubri sulle cosce, poi portali su con una spinta delle ginocchia mentre ti sdrai.',
      'Scendi finché le braccia sono al livello del busto.',
      'Spingi in alto e leggermente verso il centro.',
    ],
    ['Polsi sopra i gomiti', 'Controlla la discesa'],
    ['Lasciare che i manubri si allontanino troppo in basso'],
  ),
  'dumbbell-curl': e(
    'Curl con manubri',
    ['curl bicipiti con manubri', 'curl alternato'],
    [
      'In piedi con un manubrio per mano, braccia distese e palmi in avanti.',
      'Porta all’altezza delle spalle con i gomiti ai fianchi.',
      'Scendi con controllo fino alla completa estensione, insieme o alternando.',
    ],
    ['Gomiti incollati alle costole', 'Estensione completa in basso'],
    ['Dare un colpo d’anca per iniziare ogni ripetizione', 'Lasciar avanzare i gomiti'],
  ),
  'dumbbell-preacher-curl': e(
    'Curl alla panca Scott (manubrio)',
    ['curl Scott con manubrio', 'curl Scott a un braccio'],
    [
      'Regola il cuscinetto in modo che un’ascella poggi sul bordo superiore, con il manubrio in quella mano.',
      'Sollevalo fermandoti prima della verticale per mantenere la tensione.',
      'Scendi lentamente finché il braccio è quasi disteso, poi cambia lato.',
    ],
    ['Il gomito resta sul cuscinetto', 'Ruota il mignolo verso l’alto in cima'],
    ['Lasciar cadere il peso in basso, che sforza il gomito'],
  ),
  'dumbbell-pullover': e(
    'Pullover con manubrio',
    ['pullover', 'pullover su panca'],
    [
      'Sdraiati per lungo o di traverso su una panca piana tenendo un manubrio sopra il petto.',
      'Portalo dietro la testa con i gomiti solo leggermente piegati.',
      'Riportalo sopra il petto senza far aprire le costole.',
    ],
    ['Costole basse', 'Fermati dove finisce l’allungamento, non dove cede la spalla'],
    [
      'Lasciar piegare i gomiti, che passa il lavoro ai tricipiti',
      'Scendere più di quanto la spalla gradisca per cercare escursione',
    ],
  ),
  'dumbbell-romanian-deadlift': e(
    'Stacco rumeno con manubri',
    ['rdl con manubri', 'stacco a gambe tese con manubri'],
    [
      'In piedi, piedi alla larghezza delle anche, un manubrio per mano davanti alle cosce. Ginocchia morbide e busto contratto.',
      'Spingi le anche indietro e lascia scendere i manubri vicino alle gambe a braccia distese. Colonna stabile e piegamento delle ginocchia quasi invariato.',
      'Fermati a un allungamento controllato dei femorali prima che la schiena si arrotondi, poi spingi le anche in avanti per risalire. I pesi non devono toccare terra.',
    ],
    [
      'Porta le anche indietro',
      'Pesi vicini alle gambe',
      'Chiudi dritto senza inclinarti indietro',
    ],
    [
      'Accovacciarsi piegando ogni volta le ginocchia',
      'Cercare il pavimento arrotondando la schiena',
    ],
  ),
  'dumbbell-shoulder-press': e(
    'Lento avanti con manubri',
    ['shoulder press con manubri', 'distensioni sopra la testa seduto'],
    [
      'Siediti con lo schienale e i manubri all’altezza delle orecchie.',
      'Spingi sopra la testa fino a distendere le braccia.',
      'Scendi con controllo fino all’altezza delle orecchie.',
    ],
    ['Polsi sopra i gomiti', 'Non inarcare la zona lombare'],
    ['Mezze ripetizioni che non arrivano mai all’altezza delle orecchie'],
  ),
};
