import { exercise as e } from '../entry.js';
import type { ExerciseText } from '../types.js';

export const exercises3: Readonly<Record<string, ExerciseText>> = {
  'pistol-squat': e(
    'Pistol squat',
    ['squat a una gamba', 'squat monopodalico'],
    [
      'In piedi su una gamba con l’altra distesa davanti e le braccia in avanti. Il piede d’appoggio resta tutto a terra.',
      'Piega ginocchio e anca della gamba d’appoggio e scendi lentamente con la gamba libera staccata da terra. Scendi solo fin dove controlli con il tallone giù.',
      'Spingi con il piede d’appoggio per risalire senza rimbalzare. Fai entrambi i lati e registra le ripetizioni per gamba. Esercitati con un appoggio stabile per le mani finché equilibrio ed escursione sono affidabili.',
    ],
    ['Tutto il piede d’appoggio a terra', 'Il ginocchio segue la punta', 'Escursione controllata'],
    [
      'Far cedere il ginocchio verso l’interno',
      'Cadere veloce e rimbalzare in basso',
      'Forzare la profondità alzando il tallone',
    ],
  ),
  plank: e(
    'Plank',
    ['plank sugli avambracci', 'tenuta addominale'],
    [
      'Appoggia gli avambracci a terra sotto le spalle.',
      'Contrai in modo che il corpo formi una linea retta.',
      'Mantieni respirando con calma.',
    ],
    ['Stringi i glutei', 'Costole basse, non cedere'],
    ['Tenere a tempo con la zona lombare che cede'],
  ),
  'preacher-curl': e(
    'Curl alla panca Scott (bilanciere EZ)',
    ['curl Scott con EZ', 'panca Scott'],
    [
      'Regola il cuscinetto in modo che le ascelle poggino sul bordo superiore.',
      'Prendi il bilanciere EZ sulle impugnature angolate e sollevalo fermandoti prima della verticale per mantenere la tensione.',
      'Scendi lentamente finché le braccia sono quasi distese.',
    ],
    ['I gomiti non si staccano dal cuscinetto', 'Controlla l’allungamento in basso'],
    ['Lasciar cadere il peso in basso, che sforza il gomito'],
  ),
  'preacher-curl-machine': e(
    'Curl alla panca Scott (macchina)',
    ['macchina curl Scott', 'macchina per bicipiti', 'curl alla macchina'],
    [
      'Regola il sedile in modo che il retro delle braccia sia piatto sul cuscinetto e le ascelle tocchino il bordo superiore.',
      'Prendi le maniglie con i palmi in su e portale verso le spalle.',
      'Scendi lentamente finché le braccia sono quasi distese, senza far toccare il pacco.',
    ],
    ['Le braccia restano sul cuscinetto', 'Contrai in alto', 'Lento in discesa'],
    [
      'Staccare i gomiti per finire la ripetizione',
      'Lasciar cadere il peso in basso, che sforza il gomito',
    ],
  ),
  'pull-up': e(
    'Trazioni alla sbarra',
    ['trazioni', 'trazioni presa prona', 'trazioni presa larga'],
    [
      'Appenditi alla sbarra con presa prona, mani più larghe delle spalle.',
      'Porta il petto verso la sbarra guidando con i gomiti.',
      'Scendi finché le braccia sono completamente distese.',
    ],
    ['Petto alla sbarra', 'Spalle basse, lontane dalle orecchie'],
    ['Fare kipping quando l’obiettivo è la forza', 'Fermarsi a metà discesa'],
  ),
  'push-up': e(
    'Piegamenti',
    ['flessioni', 'piegamenti sulle braccia', 'push-up'],
    [
      'Appoggia le mani un po’ più larghe delle spalle.',
      'Contrai il busto in modo che il corpo formi una linea retta.',
      'Porta il petto appena sopra il pavimento e spingi di nuovo su.',
    ],
    ['Stringi i glutei', 'Gomiti indietro, non aperti'],
    ['Far cedere le anche', 'Fermarsi prima del pavimento'],
  ),
  'rear-delt-fly': e(
    'Alzate posteriori',
    ['croci inverse', 'alzate a busto flesso'],
    [
      'Piegati all’anca con la schiena piatta.',
      'Lascia pendere i manubri con i gomiti leggermente piegati.',
      'Alza di lato guidando con i gomiti.',
    ],
    ['Pollici leggermente in giù', 'Non stringere forte le scapole'],
    ['Usare il trapezio superiore e trasformarle in scrollate'],
  ),
  'rear-delt-fly-machine': e(
    'Alzate posteriori alla macchina',
    ['pectoral machine inversa', 'reverse fly alla macchina', 'macchina deltoidi posteriori'],
    [
      'Siediti di fronte alla macchina con il petto contro il cuscinetto e regola il sedile perché le maniglie siano all’altezza delle spalle.',
      'Prendi le maniglie con i gomiti leggermente piegati e portale in fuori e indietro finché le braccia sono in linea con il corpo.',
      'Torna lentamente finché le maniglie quasi si toccano, senza far toccare il pacco.',
    ],
    ['Guida con i gomiti', 'Il petto resta sul cuscinetto', 'Lento al ritorno'],
    [
      'Alzare le spalle, che passa il lavoro al trapezio superiore',
      'Staccarsi dal cuscinetto per slanciare il peso',
    ],
  ),
  'recumbent-bike': e(
    'Cyclette reclinata',
    ['recumbent bike', 'bici reclinata'],
    [
      'Fai scorrere il sedile in modo che la gamba sia quasi distesa in fondo alla pedalata.',
      'Appoggiati allo schienale e mantieni un ritmo costante.',
      'Alza il livello invece della velocità quando diventa facile.',
    ],
    ['Schiena contro lo schienale', 'Cerchi fluidi, senza pestare'],
    ['Sedersi così vicino che le ginocchia sono compresse in alto'],
  ),
  'romanian-deadlift': e(
    'Stacco rumeno',
    ['rdl', 'stacco a gambe tese', 'stacco rumeno con bilanciere'],
    [
      'In piedi, eretto, con il bilanciere all’altezza delle anche.',
      'Spingi le anche indietro lasciando scivolare il bilanciere lungo le cosce.',
      'Fermati quando i femorali sono ben allungati, poi spingi le anche in avanti.',
    ],
    [
      'Flessione d’anca, non squat',
      'Ginocchia morbide, non bloccate',
      'Il bilanciere resta sulle gambe',
    ],
    ['Piegare tanto le ginocchia da farne uno stacco', 'Arrotondare la parte alta della schiena'],
  ),
  'rowing-machine': e(
    'Vogatore',
    ['remoergometro', 'canottaggio indoor', 'concept2'],
    [
      'Fissa i piedi con la cinghia sulla parte più larga del piede.',
      'Spingi con le gambe, inclinati leggermente indietro, poi tira la maniglia verso le costole.',
      'Torna in ordine inverso: braccia, busto, poi gambe.',
    ],
    ['Gambe, busto, braccia, e ritorno', 'Il ritorno dura il doppio della spinta'],
    [
      'Tirare con le braccia prima che le gambe abbiano finito',
      'Mettere la serranda su 10 perché sembra più duro',
    ],
  ),
  'russian-twists': e(
    'Russian twist',
    ['torsioni russe', 'rotazioni del busto da seduto'],
    [
      'Siediti con le ginocchia piegate e i talloni appoggiati leggeri. Inclinati un po’ indietro con la colonna lunga e unisci le mani davanti al petto.',
      'Ruota petto e spalle da un lato tenendo anche e ginocchia rivolte in avanti.',
      'Torna al centro e ruota dall’altro lato. Escursione comoda; ogni lato conta come una ripetizione. Inizia senza peso.',
    ],
    ['Ruota il petto con le mani', 'Colonna lunga', 'Anche rivolte in avanti'],
    ['Oscillare solo le braccia', 'Arrotondare la zona lombare o forzare la rotazione'],
  ),
  'scissor-kicks': e(
    'Sforbiciate',
    ['forbici', 'sforbiciate addominali'],
    [
      'Sdraiati sulla schiena con le braccia lungo il corpo. Contrai l’addome e solleva le gambe a un’altezza in cui la zona lombare resta stabile.',
      'Con le ginocchia morbidamente distese, alterna una gamba in su mentre l’altra scende, in una piccola sforbiciata verticale.',
      'Respira con calma e chiudi la serie prima che la schiena si inarchi. Ogni alternanza conta come una ripetizione.',
    ],
    [
      'Zona lombare stabile',
      'Sforbiciata piccola e controllata',
      'Alza le gambe se la schiena si inarca',
    ],
    [
      'Abbassare troppo le gambe e perdere il controllo del busto',
      'Trattenere il respiro o oscillare le gambe velocemente',
    ],
  ),
  'seated-cable-row': e(
    'Pulley basso',
    ['rematore al cavo basso', 'pulley', 'rematore seduto al cavo'],
    [
      'Siediti al cavo basso con i piedi sulla pedana e le ginocchia leggermente piegate.',
      'Tira la maniglia verso l’ombelico con i gomiti vicini al corpo.',
      'Torna al completo allungamento senza arrotondare la schiena.',
    ],
    ['Petto alto', 'Contrai alle costole'],
    ['Oscillare il busto avanti e indietro per muovere il peso'],
  ),
  'seated-calf-raise': e(
    'Calf raise da seduto',
    ['polpacci da seduto', 'soleo da seduto'],
    [
      'Siediti con il cuscinetto sulla parte bassa delle cosce e gli avampiedi sulla pedana.',
      'Abbassa i talloni per allungare.',
      'Sali sulle punte e contrai.',
    ],
    ['A ginocchia piegate lavora di più il soleo', 'Lento e su tutta l’escursione'],
    ['Usare un’escursione di due centimetri'],
  ),
  'seated-dip-machine': e(
    'Dip machine da seduto',
    ['dip alla macchina', 'macchina dip per tricipiti'],
    [
      'Regola il sedile per afferrare le maniglie accanto alle anche con i gomiti piegati e i polsi dritti. Schiena contro lo schienale e piedi piantati.',
      'Gomiti vicini ai fianchi, spingi le maniglie in basso finché le braccia sono quasi distese.',
      'Torna lentamente a un piegamento comodo del gomito senza alzare le spalle né far sbattere il pacco.',
    ],
    ['Schiena contro lo schienale', 'Spingi dai gomiti', 'Spalle basse'],
    [
      'Inclinarsi o alzarsi dal sedile per muovere il pacco',
      'Aprire i gomiti o bloccarli di scatto',
    ],
  ),
  'seated-leg-curl': e(
    'Leg curl da seduto',
    ['femorali da seduto', 'leg curl seduto'],
    [
      'Regola il cuscinetto delle cosce ben stretto e quello delle caviglie appena sopra i talloni.',
      'Porta le gambe in basso e indietro il più possibile.',
      'Torna con controllo.',
    ],
    ['Spingi le cosce nel cuscinetto', 'Pausa in basso'],
    ['Lasciar risalire il peso di scatto'],
  ),
  'seated-row-machine': e(
    'Rematore alla macchina',
    ['rematore seduto', 'row machine', 'rematore con petto in appoggio alla macchina'],
    [
      'Regola il sedile perché le maniglie siano all’altezza della parte bassa del petto e appoggiati al cuscinetto.',
      'Tira le maniglie indietro portando i gomiti oltre le costole.',
      'Lasciale tornare al completo allungamento senza staccarti dal cuscinetto.',
    ],
    ['Il petto resta sul cuscinetto', 'Stringi le scapole'],
    ['Staccare il petto per strappare le ultime ripetizioni'],
  ),
  'shoulder-press-machine': e(
    'Shoulder press alla macchina',
    ['shoulder press', 'lento avanti alla macchina'],
    [
      'Scegli un carico gestibile; sulle macchine a dischi, carica i due lati in modo uguale. Regola il sedile perché le maniglie partano circa all’altezza delle spalle e tu le raggiunga senza allungarti.',
      'Siediti con anche e parte alta della schiena contro i cuscinetti e i piedi piatti a terra. Contrai l’addome con le costole sopra le anche.',
      'Impugna le maniglie a mano piena. Polsi dritti e gomiti leggermente davanti al busto, avambracci nella direzione delle maniglie.',
      'Espira mentre spingi le maniglie in alto lungo la traiettoria della macchina. Schiena contro lo schienale; distendi senza bloccare i gomiti di scatto.',
      'Inspira scendendo lentamente alla posizione di partenza, o fin dove controlli comodamente. Spalle stabili e niente rimbalzi in basso.',
      'Ripeti con la stessa escursione e lo stesso ritmo. Dopo l’ultima, riporta dolcemente le maniglie ai fermi prima di mollare.',
    ],
    [
      'Schiena sul cuscinetto, costole basse',
      'Polsi dritti, gomiti sotto le maniglie',
      'Spingi fluido e controlla la discesa',
      'Escursione comoda senza forzare',
    ],
    [
      'Regolare il sedile troppo basso o alto, con le maniglie molto sotto o sopra le spalle',
      'Inarcare la zona lombare e staccarsi per muovere un carico troppo pesante',
      'Rimbalzare in basso o bloccare i gomiti di scatto in alto',
      'Piegare i polsi o forzare le maniglie sotto una posizione comoda della spalla',
    ],
  ),
  'single-arm-dumbbell-row': e(
    'Rematore con manubrio a un braccio',
    ['rematore manubrio', 'rematore a un braccio'],
    [
      'Appoggia una mano e il ginocchio dello stesso lato su una panca.',
      'Lascia pendere il manubrio e tiralo verso l’anca.',
      'Scendi fino al completo allungamento.',
    ],
    ['Tira verso l’anca, non verso la spalla', 'Non ruotare il busto'],
    ['Girare il corpo per strappare il peso'],
  ),
  'sissy-squat': e(
    'Sissy squat',
    ['squat sissy'],
    [
      'In piedi, piedi alla larghezza delle anche e braccia avanti per l’equilibrio. Inizia senza peso e usa un appoggio sicuro per le mani mentre impari.',
      'Sali sugli avampiedi e porta le ginocchia in avanti mentre busto e cosce si inclinano insieme all’indietro. Le anche restano distese invece di sedersi indietro.',
      'Scendi solo in un’escursione del ginocchio comoda e controllata, poi distendi le ginocchia per tornare su. Inizia poco profondo e fermati se il ginocchio fa male.',
    ],
    [
      'Anche distese',
      'Busto e cosce si muovono insieme',
      'Prima un’escursione breve e controllata',
    ],
    [
      'Sedersi indietro come in uno squat normale',
      'Rimbalzare in flessione profonda o perdere l’equilibrio sull’avampiede',
    ],
  ),
  'ski-erg': e(
    'SkiErg',
    ['ski erg', 'simulatore di sci di fondo'],
    [
      'In piedi, eretto, di fronte alla macchina con una maniglia per mano.',
      'Piegati all’anca e porta le maniglie in basso oltre le cosce.',
      'Lascia risalire le braccia mentre torni eretto.',
    ],
    ['Flessione d’anca, non squat', 'Chiudi con le mani oltre le anche'],
    ['Piegare molto le ginocchia e trasformarlo in uno squat'],
  ),
  'skull-crusher': e(
    'French press su panca',
    ['skull crusher', 'estensioni tricipiti da sdraiato', 'french press con EZ'],
    [
      'Sdraiati su una panca piana tenendo un bilanciere EZ sopra il petto.',
      'Braccia ferme, piega i gomiti e scendi verso la fronte.',
      'Distendi di nuovo senza far avanzare i gomiti.',
    ],
    ['Le braccia restano dove sono', 'Scendi dietro la testa, non verso il naso'],
    [
      'Trasformarlo in una distensione oscillando i gomiti',
      'Andare così pesante che subentrano le spalle',
    ],
  ),
  'smith-machine-bench-press': e(
    'Panca piana al multipower',
    ['panca al multipower', 'panca smith'],
    [
      'Centra una panca piana sotto il bilanciere del multipower perché scenda verso metà petto. Regola i fermi appena sotto il tuo punto più basso e prova la traiettoria a vuoto.',
      'Sdraiati con i piedi piantati, anche sulla panca e scapole dolcemente indietro e in basso. Impugna un po’ più largo delle spalle con i polsi dritti.',
      'Ruota il bilanciere per sganciare i ganci. Scendi lentamente verso metà petto, avambracci allineati con il bilanciere e gomiti sotto le spalle.',
      'Spingi fluido lungo le guide senza rimbalzare né sollevare le anche. Distendi le braccia senza bloccare i gomiti di scatto.',
      'Chiudi con il bilanciere sotto controllo, ruotalo su entrambi i ganci e controlla che sia fermo prima di mollare.',
    ],
    [
      'Scapole indietro e in basso',
      'Piedi piantati, anche sulla panca',
      'Scendi con controllo',
      'Controlla entrambi i ganci prima di mollare',
    ],
    [
      'Mettere la panca in modo che la traiettoria fissa porti il bilanciere al collo',
      'Aprire i gomiti o piegare i polsi all’indietro',
      'Rimbalzare sul petto o sollevare le anche',
      'Saltare i fermi o mollare un bilanciere non agganciato',
    ],
  ),
  'smith-machine-bulgarian-split-squat': e(
    'Squat bulgaro al multipower',
    ['affondo bulgaro al multipower', 'split squat smith'],
    [
      'Metti una panca stabile dietro il multipower e regola i fermi sotto la profondità prevista. Posiziona il bilanciere sulla parte alta della schiena e prova la posizione a vuoto.',
      'Appoggia il collo di un piede sulla panca dietro di te, piedi su binari separati alla larghezza delle anche. Pianta il piede anteriore abbastanza avanti da scendere comodo lungo le guide.',
      'Sgancia il bilanciere, contrai e piega ginocchio e anca anteriori per scendere con controllo. La maggior parte del peso resta sulla gamba anteriore.',
      'Spingi con il piede anteriore per risalire. Completa le ripetizioni di un lato, riaggancia in sicurezza, poi cambia lato. Registra le ripetizioni per gamba.',
    ],
    [
      'Il piede anteriore resta piantato',
      'Bacino in bolla',
      'Controlla la traiettoria fissa prima di caricare',
    ],
    [
      'Usare la gamba posteriore per spingere',
      'Mettere il piede anteriore in modo che le guide impongano una posizione scomoda a ginocchio o anca',
      'Saltare i fermi',
    ],
  ),
  'smith-machine-incline-bench-press': e(
    'Panca inclinata al multipower',
    ['panca inclinata smith', 'distensioni inclinate al multipower'],
    [
      'Regola una panca a un’inclinazione moderata, circa 30-45 gradi, e centrala sotto il bilanciere perché scenda verso la parte alta del petto. Regola i fermi appena sotto il tuo punto più basso e prova la traiettoria a vuoto.',
      'Sdraiati con testa, parte alta della schiena e anche appoggiate e i piedi piantati. Porta le scapole dolcemente indietro e in basso. Presa chiusa un po’ più larga delle spalle, polsi dritti.',
      'Ruota il bilanciere per sganciare i ganci. Scendi lentamente verso la parte alta del petto, avambracci allineati con il bilanciere e gomiti sotto le spalle. Fermati a una profondità che controlli comodamente.',
      'Spingi fluido lungo le guide con spalle e anche contro la panca. Distendi le braccia senza bloccare i gomiti di scatto.',
      'Dopo l’ultima ripetizione, ruota il bilanciere su entrambi i ganci e controlla che sia fermo prima di mollare.',
    ],
    [
      'Inclinazione moderata',
      'Scapole indietro e in basso',
      'Scendi con controllo verso il petto alto',
      'Controlla entrambi i ganci prima di mollare',
    ],
    [
      'Mettere la panca in modo che la traiettoria fissa porti il bilanciere al collo o al viso',
      'Aprire i gomiti o piegare i polsi all’indietro',
      'Staccare anche o spalle dalla panca o rimbalzare in basso',
      'Saltare i fermi o mollare un bilanciere non agganciato',
    ],
  ),
  'smith-machine-shrug': e(
    'Scrollate al multipower',
    ['scrollate smith'],
    [
      'Regola il bilanciere del multipower circa a metà coscia con i fermi appena sotto. Controlla il verso dei ganci e la traiettoria prima di caricare.',
      'In piedi di fronte al bilanciere, piedi alla larghezza delle anche. Presa prona appena fuori dalle cosce, alzati e sgancia i ganci.',
      'Braccia distese, solleva le spalle verso le orecchie senza ruotarle, spingere avanti la testa o inclinarti indietro.',
      'Fai una breve pausa in alto, poi abbassa le spalle lentamente fino a un allungamento comodo. Bilanciere vicino e busto fermo.',
      'Dopo l’ultima ripetizione, ruota il bilanciere su entrambi i ganci e controlla che sia fermo prima di mollare.',
    ],
    ['Spalle su e giù in linea retta', 'Braccia distese', 'Pausa in alto', 'Testa e busto fermi'],
    [
      'Ruotare le spalle',
      'Piegare i gomiti o rimbalzare con le gambe',
      'Spingere avanti la testa o inclinarsi indietro',
      'Lasciar cadere le spalle di colpo o mollare un bilanciere non agganciato',
    ],
  ),
  'smith-machine-squat': e(
    'Squat al multipower',
    ['squat smith', 'squat guidato'],
    [
      'Regola il bilanciere appena sotto l’altezza delle spalle e i fermi appena sotto la profondità prevista. Controlla posizione e traiettoria a vuoto.',
      'Appoggia il bilanciere sul trapezio superiore, lontano dal collo. Impugna da entrambi i lati, piedi alla larghezza delle spalle, e regola la loro posizione per tenere tutto il piede a terra durante tutto lo squat.',
      'Alzati per sganciare i ganci. Contrai l’addome, poi piega insieme ginocchia e anche, ginocchia in linea con le punte.',
      'Scendi con controllo fino a una profondità comoda con la colonna stabile e i talloni giù. Non forzare più in basso arrotondando la zona lombare.',
      'Spingi con tutto il piede per risalire con le ginocchia allineate. Ruota il bilanciere su entrambi i ganci e controlla che sia fermo prima di allontanarti.',
    ],
    [
      'Contrai prima di ogni ripetizione',
      'Tutto il piede a terra',
      'Le ginocchia seguono le punte',
      'Controlla la discesa e i ganci',
    ],
    [
      'Scegliere una posizione dei piedi che alza i talloni o impone una traiettoria scomoda',
      'Far cedere le ginocchia verso l’interno',
      'Arrotondare la zona lombare o rimbalzare in basso',
      'Saltare i fermi o allontanarsi prima che entrambi i ganci siano agganciati',
    ],
  ),
  'spider-curl-dumbbell': e(
    'Spider curl (manubri)',
    ['spider curl con manubri', 'curl a ragno'],
    [
      'Sdraiati a pancia in giù su una panca a circa 45 gradi con i piedi piantati dietro. Tieni un manubrio per mano con i palmi in avanti e le braccia che pendono libere accanto al cuscinetto.',
      'Porta entrambi i manubri verso le spalle senza muovere le braccia né staccare il petto.',
      'Scendi con controllo finché i gomiti sono quasi distesi, tenendo i manubri lontani dalla panca.',
    ],
    ['Petto appoggiato', 'Palmi in su mentre sali', 'Gomiti sotto le spalle'],
    ['Muovere le braccia per slanciare i manubri', 'Appoggiare i gomiti sul cuscinetto'],
  ),
  'spider-curl-ez-bar': e(
    'Spider curl (bilanciere EZ)',
    ['spider curl con EZ', 'curl a ragno'],
    [
      'Regola una panca a circa 45 gradi e sdraiati a pancia in giù con i piedi piantati. Prendi il bilanciere EZ sulle impugnature angolate e lascia pendere le braccia in verticale, libere dal cuscinetto.',
      'Porta il bilanciere verso le spalle con il petto appoggiato e le braccia ferme.',
      'Scendi lentamente finché i gomiti sono quasi distesi. Il bilanciere non tocca mai la panca.',
    ],
    ['Il petto resta sul cuscinetto', 'Braccia che pendono libere', 'Gomiti fermi'],
    [
      'Appoggiare i gomiti sul cuscinetto come nel curl Scott',
      'Oscillare le spalle o staccare il petto',
    ],
  ),
  'spin-bike': e(
    'Spin bike',
    ['spinning', 'indoor cycling', 'bici da spinning'],
    [
      'Regola la sella all’altezza dell’anca, in piedi accanto alla bici.',
      'Regola il manubrio all’altezza della sella o un po’ più su.',
      'Aumenta la resistenza con la manopola invece di pedalare più veloce senza.',
    ],
    ['Anche ferme sulla sella', 'Resistenza inserita prima di alzarti'],
    ['Rimbalzare sulla sella ad alta cadenza senza resistenza'],
  ),
  'stair-climber': e(
    'Stair climber',
    ['scala mobile da palestra', 'stairmaster', 'stepper'],
    [
      'Sali mentre i gradini scorrono lentamente, tenendo i corrimano.',
      'Lascia i corrimano quando hai preso il ritmo e stai dritto.',
      'Rallenta i gradini prima di scendere.',
    ],
    ['Tutto il piede su ogni gradino', 'Stai dritto, non appoggiarti ai corrimano'],
    ['Appoggiarsi ai corrimano, che toglie peso alle gambe'],
  ),
  'standing-calf-raise': e(
    'Calf raise in piedi',
    ['polpacci in piedi', 'calf raise alla macchina in piedi'],
    [
      'In piedi con gli avampiedi sulla pedana.',
      'Abbassa i talloni per un allungamento completo.',
      'Sali sulle punte più in alto che puoi.',
    ],
    ['Pausa in alto e in basso', 'Escursione completa, niente rimbalzi'],
    ['Rimbalzare nell’allungamento usando il tendine invece del muscolo'],
  ),
  'straight-arm-pulldown': e(
    'Pulldown a braccia tese',
    ['pullover al cavo in piedi', 'lat pushdown'],
    [
      'In piedi davanti a un cavo alto con bilanciere dritto o corda.',
      'Gomiti quasi bloccati e leggera inclinazione in avanti.',
      'Porta il bilanciere ad arco fino alle cosce, poi torna sopra la testa.',
    ],
    ['I gomiti restano fissi', 'Lo senti sotto l’ascella, non nei tricipiti'],
    ['Piegare i gomiti e trasformarlo in un pushdown'],
  ),
  'strict-curl': e(
    'Strict curl',
    ['curl al muro', 'curl rigoroso con EZ'],
    [
      'In piedi con la parte alta della schiena e le anche contro un muro o un appoggio verticale solido, piedi leggermente avanti. Tieni un bilanciere EZ sulle impugnature angolate con le braccia distese e i polsi dritti.',
      'Con schiena e anche a contatto con l’appoggio, porta il bilanciere verso le spalle senza portare avanti i gomiti.',
      'Scendi lentamente quasi fino alla completa estensione. Conta solo le ripetizioni fatte senza spinta d’anca né perdita di contatto.',
    ],
    [
      'Schiena e anche contro l’appoggio',
      'Gomiti accanto alle costole',
      'Un carico che sollevi senza oscillare',
    ],
    [
      'Spingere con le ginocchia o staccare le anche dall’appoggio',
      'Piegare i polsi per finire il curl',
    ],
  ),
  'sumo-deadlift': e(
    'Stacco sumo',
    ['sumo', 'stacco a gambe larghe'],
    [
      'Mettiti vicino a un bilanciere a terra con una posizione larga e le punte girate in fuori in modo comodo. Doppia presa prona chiusa all’interno delle ginocchia.',
      'Contrai, braccia distese, e porta le tibie verso il bilanciere con le ginocchia che seguono le punte. Togli il gioco prima di sollevare.',
      'Spingi via il pavimento e distendi insieme ginocchia e anche, bilanciere vicino alle gambe. Chiudi dritto senza inclinarti indietro.',
      'Riabbassa il bilanciere con controllo portando indietro le anche e piegando le ginocchia quando le supera. Ricomponi posizione e tensione prima della successiva.',
    ],
    ['Mani dentro le ginocchia', 'Bilanciere vicino', 'Spingi con tutto il piede'],
    [
      'Strappare il bilanciere da terra a braccia piegate',
      'Far cedere le ginocchia o inclinarsi indietro in chiusura',
    ],
  ),
  'sumo-squat': e(
    'Squat sumo',
    ['squat sumo a corpo libero', 'squat a gambe larghe'],
    [
      'In piedi più larghi delle spalle con le punte in fuori a un angolo comodo. Unisci le mani davanti al petto; questa versione è a corpo libero.',
      'Piega ginocchia e anche per scendere tra le gambe, talloni a terra e ginocchia allineate con le punte.',
      'Fermati a una profondità controllata e spingi con tutto il piede per risalire senza bloccare le ginocchia di colpo.',
    ],
    ['Le ginocchia seguono le punte', 'Talloni a terra', 'Scendi tra le anche'],
    [
      'Forzare una posizione o un’apertura delle punte eccessiva',
      'Far cedere le ginocchia o alzare i talloni',
    ],
  ),
  't-bar-row': e(
    'Rematore T-bar',
    ['T-bar row', 'rematore landmine', 'rematore con bilanciere a T'],
    [
      'Mettiti a cavallo del bilanciere con un’estremità fissata in un angolo o in un landmine, e impugna stretto sotto i dischi.',
      'Piegati in avanti con la schiena piatta e tira i dischi verso il petto.',
      'Scendi con controllo fino al completo allungamento.',
    ],
    ['Schiena piatta per tutto il tempo', 'Tira con i gomiti, non con le mani'],
    ['Raddrizzarsi quando la serie si fa dura', 'Strattonare con la zona lombare'],
  ),
  'trap-bar-deadlift': e(
    'Stacco con trap bar',
    ['stacco con bilanciere esagonale', 'trap bar deadlift'],
    [
      'Mettiti dentro la trap bar con i piedi alla larghezza delle anche.',
      'Piegati e afferra le maniglie.',
      'Alzati spingendo via il pavimento.',
    ],
    ['Petto alto prima di tirare', 'Spingi via il pavimento'],
    ['Lasciar salire per prime le anche'],
  ),
  'trap-bar-shrug': e(
    'Scrollate con trap bar',
    ['scrollate con bilanciere esagonale'],
    [
      'Mettiti dentro una trap bar carica, afferra le maniglie laterali e sollevala fino in piedi con la schiena contratta e una spinta delle gambe controllata.',
      'Braccia distese e busto fermo, solleva entrambe le spalle verso le orecchie. Breve pausa in alto.',
      'Abbassa le spalle lentamente fino a un allungamento comodo. Dopo la serie, piega anche e ginocchia per riportare il bilanciere a terra con controllo.',
    ],
    ['Solleva le spalle dritte', 'Gomiti distesi', 'Contrai mentre tieni il bilanciere'],
    [
      'Ruotare le spalle o piegare i gomiti',
      'Strappare il bilanciere da terra o arrotondare la schiena per appoggiarlo',
    ],
  ),
  treadmill: e(
    'Tapis roulant',
    ['corsa sul tapis roulant', 'camminata in salita', 'treadmill'],
    [
      'Mettiti a cavallo del nastro, avvialo lentamente, poi sali.',
      'Aumenta velocità e pendenza durante il primo minuto.',
      'Rallenta prima di scendere sui bordi laterali.',
    ],
    [
      'Appoggia il piede sotto le anche, non molto avanti',
      'Lascia i corrimano una volta in movimento',
    ],
    [
      'Tenersi ai corrimano in salita, che toglie gran parte del lavoro',
      'Scendere da un nastro in movimento',
    ],
  ),
  'triceps-dip': e(
    'Dip (focus tricipiti)',
    ['dip per tricipiti', 'dip', 'dip alle parallele busto eretto'],
    [
      'Sostieniti sulle parallele con le braccia distese.',
      'Busto eretto e gomiti indietro, vicini al corpo.',
      'Scendi finché i gomiti arrivano a circa 90 gradi, poi spingi fino a bloccare.',
    ],
    ['Petto alto, corpo verticale', 'Gomiti dritti indietro', 'Blocca in alto'],
    [
      'Inclinarsi in avanti, che lo trasforma in dip per il petto',
      'Lasciar aprire i gomiti di lato',
    ],
  ),
  'triceps-pushdown': e(
    'Pushdown ai cavi',
    ['tricipiti al cavo', 'pushdown con corda', 'spinte in basso al cavo'],
    [
      'Mettiti a un cavo alto con corda o bilanciere.',
      'Gomiti ai fianchi, distendi le braccia verso il basso.',
      'Torna finché gli avambracci superano l’orizzontale.',
    ],
    ['Gomiti fissi', 'Contrai a braccia distese'],
    ['Piegarsi sopra il peso e trasformarlo in una distensione'],
  ),
  'turkish-get-up': e(
    'Turkish get-up',
    ['alzata turca', 'TGU', 'get-up con kettlebell'],
    [
      'Sdraiati sulla schiena tenendo il kettlebell dritto sopra la spalla, ginocchio dello stesso lato piegato.',
      'Rotola sul gomito opposto, poi sulla mano, solleva le anche e porta la gamba sotto fino in ginocchio.',
      'Alzati, poi ripercorri ogni passaggio al contrario fino a terra, con lo sguardo sul kettlebell. Cambia lato.',
    ],
    [
      'Braccio bloccato e verticale per tutto il tempo',
      'Sguardo sul kettlebell',
      'Lento, un passaggio alla volta',
    ],
    ['Lasciar deviare o piegare il braccio', 'Affrettare i passaggi'],
  ),
  'upright-bike': e(
    'Cyclette',
    ['bici da camera', 'cyclette verticale', 'bici'],
    [
      'Regola la sella in modo che il ginocchio sia leggermente piegato in fondo alla pedalata.',
      'Scegli un livello che riesci a tenere per tutto il blocco.',
      'Rallenta nell’ultimo minuto invece di fermarti di colpo.',
    ],
    ['Ginocchia sopra i piedi', 'Spingi con tutto il piede'],
    ['Una sella così bassa che le ginocchia salgono oltre le anche'],
  ),
  'viking-press': e(
    'Viking press',
    ['distensione viking', 'macchina viking press'],
    [
      'Usa una macchina viking press dedicata. Regola i supporti di partenza perché le maniglie neutre siano all’altezza delle spalle, carica entrambi i manicotti in modo uguale e controlla i fermi prima di sollevare.',
      'In piedi con i piedi piantati, prendi entrambe le maniglie con i palmi uno verso l’altro e contrai il busto. Stacca il carico dai supporti.',
      'Spingi entrambe le maniglie in alto lungo l’arco della leva con le gambe ferme e le costole controllate. Chiudi a braccia distese senza inclinarti indietro.',
      'Scendi lentamente verso le spalle e riporta le leve in sicurezza sui supporti dopo la serie. Questa versione è una distensione rigorosa senza spinta delle gambe; registra sempre il peso dei dischi aggiunti allo stesso modo.',
    ],
    ['Gambe ferme', 'Polsi sopra gli avambracci', 'Riporta entrambe le leve in sicurezza'],
    [
      'Spingere con le ginocchia o inarcare la zona lombare',
      'Caricare i manicotti in modo diseguale o mancare i supporti',
    ],
  ),
  'walking-lunge': e(
    'Affondi camminati',
    ['affondi', 'affondi in camminata', 'walking lunges'],
    [
      'Fai un passo avanti in affondo finché il ginocchio posteriore quasi tocca terra.',
      'Spingi con il piede anteriore per alzarti e prosegui in avanti.',
      'Alterna le gambe durante la serie.',
    ],
    ['Busto eretto', 'Passo lungo per i glutei, corto per i quadricipiti'],
    ['Far cedere il ginocchio anteriore verso l’interno'],
  ),
  'wall-sit': e(
    'Wall sit',
    ['sedia al muro', 'squat isometrico al muro'],
    [
      'In piedi con la schiena piatta contro un muro, porta i piedi in avanti.',
      'Scivola in basso finché le cosce sono circa parallele al pavimento, ginocchia sopra le caviglie.',
      'Mantieni respirando con calma.',
    ],
    ['Schiena piatta contro il muro', 'Ginocchia sopra le caviglie, non oltre le punte'],
    ['Appoggiare le mani sulle cosce per scaricare il peso'],
  ),
  'wrist-curl-dumbbell': e(
    'Curl per i polsi (manubrio)',
    ['flessioni del polso', 'curl polsi con manubri'],
    [
      'Siediti su una panca con manubri leggeri e i palmi in su. Appoggia gli avambracci sulle cosce con i polsi appena oltre le ginocchia.',
      'Avambracci appoggiati, porta le mani in su piegando i polsi senza piegare i gomiti.',
      'Scendi lentamente in un’escursione del polso comoda mantenendo la presa chiusa.',
    ],
    ['Gli avambracci restano sulle cosce', 'Muovi solo i polsi', 'Movimenti piccoli e controllati'],
    [
      'Sollevare gli avambracci o trasformarlo in un curl per bicipiti',
      'Usare manubri pesanti o forzare l’escursione del polso',
    ],
  ),
};
