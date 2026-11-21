import { exercise as e } from '../entry.js';
import type { ExerciseText } from '../types.js';

export const exercises2: Readonly<Record<string, ExerciseText>> = {
  'dumbbell-shrug': e(
    'Scrollate con manubri',
    ['scrollate', 'shrug con manubri'],
    [
      'In piedi, piedi alla larghezza delle anche, un manubrio per mano lungo i fianchi, palmi verso le cosce.',
      'Petto alto, testa neutra e braccia distese. Solleva entrambe le spalle verso le orecchie senza piegare i gomiti né ruotare le spalle.',
      'Fai una breve pausa in alto, poi abbassa le spalle lentamente fino a un allungamento comodo.',
      'Ripeti con il busto fermo e la stessa escursione controllata su entrambi i lati. Appoggia i manubri con controllo alla fine.',
    ],
    ['Spalle su e giù in linea retta', 'Braccia distese', 'Pausa in alto', 'Testa neutra'],
    [
      'Ruotare le spalle',
      'Piegare i gomiti o rimbalzare con le gambe',
      'Spingere la testa in avanti',
      'Usare un carico che impedisce un sollevamento controllato',
    ],
  ),
  'ez-bar-curl': e(
    'Curl con bilanciere EZ',
    ['curl EZ', 'curl bicipiti bilanciere EZ'],
    [
      'In piedi, tieni il bilanciere EZ sulle impugnature angolate, braccia distese.',
      'Porta il bilanciere all’altezza delle spalle con i gomiti ai fianchi.',
      'Scendi con controllo fino alla completa estensione.',
    ],
    ['Gomiti incollati alle costole', 'Estensione completa in basso'],
    ['Dare un colpo d’anca per iniziare ogni ripetizione'],
  ),
  'face-pull': e(
    'Face pull',
    ['tirate al viso', 'face pull con corda'],
    [
      'Regola una corda circa all’altezza del viso.',
      'Tira la corda verso il viso allargando le estremità.',
      'Chiudi con le mani accanto alle orecchie e i gomiti alti.',
    ],
    ['Gomiti sopra i polsi', 'Allarga, non tirare solo indietro'],
    ['Mettere un peso così alto che il busto oscilla all’indietro'],
  ),
  'farmer-carry': e(
    'Farmer walk',
    ['camminata del contadino', 'trasporto carichi'],
    [
      'Prendi un manubrio o un kettlebell pesante per mano.',
      'Stai dritto con le spalle indietro.',
      'Cammina in linea retta per distanza o tempo.',
    ],
    ['Postura alta, non inclinarti', 'Stringi forte le impugnature'],
    ['Lasciar arrotondare le spalle sotto il carico'],
  ),
  'flat-bench-dumbbell-fly': e(
    'Croci su panca piana',
    ['croci con manubri', 'aperture su panca piana'],
    [
      'Sdraiati su una panca piana con i piedi piantati. Tieni manubri leggeri sopra il petto, palmi uno verso l’altro e gomiti leggermente piegati.',
      'Apri le braccia in un ampio arco mantenendo quel piegamento. Fermati a un allungamento comodo del petto con le braccia circa in linea con il busto.',
      'Riporta i manubri sopra il petto lungo lo stesso arco, come un abbraccio, senza trasformarlo in una distensione.',
    ],
    [
      'Gomiti leggermente e stabilmente piegati',
      'Apri e chiudi come un abbraccio',
      'Allungamento comodo del petto',
    ],
    ['Scendere con i pesi molto sotto il busto', 'Distendere del tutto i gomiti o spingere i pesi'],
  ),
  'goblet-squat': e(
    'Goblet squat',
    ['squat a calice', 'squat con kettlebell'],
    [
      'Tieni un manubrio o un kettlebell all’altezza del petto.',
      'Scendi in squat tra le ginocchia mantenendo il petto alto.',
      'Risali spingendo con tutto il piede.',
    ],
    ['Gomiti dentro le ginocchia in basso', 'Petto fiero'],
    ['Lasciar sollevare i talloni da terra'],
  ),
  'hack-squat': e(
    'Hack squat',
    ['hack squat alla macchina'],
    [
      'Metti le spalle sotto i cuscinetti con i piedi al centro della pedana.',
      'Scendi finché le cosce sono almeno parallele.',
      'Risali spingendo con tutto il piede.',
    ],
    ['Schiena piatta contro lo schienale', 'Le ginocchia seguono le punte'],
    ['Rimbalzare uscendo dal basso'],
  ),
  'hammer-curl': e(
    'Hammer curl',
    ['curl a martello', 'curl presa neutra'],
    [
      'Tieni i manubri con i palmi uno verso l’altro.',
      'Porta all’altezza delle spalle senza ruotare i polsi.',
      'Scendi con controllo.',
    ],
    ['Pollici in su per tutto il tempo', 'Gomiti fermi'],
    ['Ruotare in un curl normale a metà salita'],
  ),
  'handstand-push-ups': e(
    'Piegamenti in verticale',
    ['handstand push-up', 'HSPU', 'piegamenti in verticale libera'],
    [
      'Questo è un piegamento in verticale libera e rigoroso. Sviluppa prima una verticale stabile e pratica un’uscita controllata in uno spazio libero; usa progressioni pike o con appoggio mentre impari.',
      'Sali in verticale con i palmi alla larghezza delle spalle, dita aperte e busto contratto. Gambe unite sopra le anche.',
      'Piega i gomiti con controllo portando la testa verso un punto appena davanti alle mani. Scendi solo fin dove puoi risalire senza appoggiare peso sulla testa.',
      'Spingi forte sui palmi fino a braccia distese e ritrova l’equilibrio. Non calciare con le gambe per finire; esci dalla verticale prima di perdere il controllo.',
    ],
    ['Apri le dita e spingi sui palmi', 'Busto contratto', 'Niente peso sulla testa'],
    [
      'Crollare sulla testa o sul collo',
      'Slanciarsi con le gambe o tentare senza un’uscita controllata',
    ],
  ),
  'hanging-knee-raise': e(
    'Sollevamento ginocchia alla sbarra',
    ['ginocchia al petto alla sbarra', 'knee raise alla sbarra'],
    [
      'Appenditi a una sbarra sicura con presa prona chiusa e braccia lunghe. Attiva le spalle e lascia che il corpo si fermi.',
      'Piega entrambe le ginocchia e portale verso il petto, arrotolando leggermente il bacino invece di sollevare solo le cosce.',
      'Scendi lentamente fino ad appeso senza oscillare. Salita e discesa delle due ginocchia contano come una ripetizione.',
    ],
    [
      'Inizia ogni ripetizione senza oscillare',
      'Arrotola il bacino verso le costole',
      'Abbassa le ginocchia lentamente',
    ],
    [
      'Usare un’oscillazione a pendolo per sollevare le ginocchia',
      'Lasciar cadere le gambe o sprofondare nelle spalle',
    ],
  ),
  'hanging-leg-raise': e(
    'Sollevamento gambe alla sbarra',
    ['leg raise alla sbarra', 'gambe tese alla sbarra'],
    [
      'Appenditi a una sbarra con le spalle attive.',
      'Solleva le gambe finché le anche si arrotolano leggermente.',
      'Scendi con controllo, senza oscillare.',
    ],
    ['Arrotola il bacino in alto', 'Nessuna oscillazione tra le ripetizioni'],
    ['Usare lo slancio e muoversi solo all’anca'],
  ),
  'hip-abduction-machine': e(
    'Macchina abduttori',
    ['abduttori', 'abduzione d’anca', 'macchina per glutei'],
    [
      'Siediti con la schiena contro lo schienale e le ginocchia contro i cuscinetti esterni.',
      'Allarga le ginocchia fin dove è comodo.',
      'Riportale con controllo invece di farle chiudere dal peso.',
    ],
    ['Siedi dritto; inclinarti cambia quale parte del gluteo lavora', 'Pausa nel punto più aperto'],
    [
      'Usare tutto il pacco e muoverlo di cinque centimetri',
      'Oscillare il busto per guadagnare gli ultimi gradi',
    ],
  ),
  'hip-adduction-machine': e(
    'Macchina adduttori',
    ['adduttori', 'adduzione d’anca', 'interno coscia'],
    [
      'Siediti con la schiena contro lo schienale e le ginocchia contro i cuscinetti interni.',
      'Stringi le ginocchia finché i cuscinetti quasi si toccano.',
      'Lasciale riaprire con controllo, solo fin dove l’allungamento è comodo.',
    ],
    ['Stringi, non oscillare', 'Ferma il ritorno dove inizia l’allungamento, non dove fa male'],
    [
      'Caricare così tanto che il ritorno diventa una caduta',
      'Aprire più di quanto le anche siano riscaldate',
    ],
  ),
  'incline-barbell-press': e(
    'Panca inclinata con bilanciere',
    ['panca inclinata', 'distensioni su panca inclinata'],
    [
      'Regola la panca a circa 30 gradi.',
      'Sgancia e abbassa il bilanciere sulla parte alta del petto.',
      'Spingi in alto e leggermente indietro sopra le spalle.',
    ],
    ['Resta saldo contro la panca', 'Bilanciere alla clavicola, non alla gola'],
    ['Inclinare troppo la panca, che la trasforma in uno shoulder press'],
  ),
  'incline-cable-curl': e(
    'Curl inclinato ai cavi',
    ['curl su panca inclinata ai cavi'],
    [
      'Centra una panca poco inclinata tra due cavi bassi, testa verso la macchina. Prendi una maniglia per mano e appoggiati con i piedi piantati, palmi in avanti.',
      'Braccia che pendono accanto o un po’ dietro il busto; porta entrambe le maniglie verso le spalle. I cavi non toccano la panca né il corpo.',
      'Scendi lentamente quasi fino a distendere i gomiti senza staccare la schiena né portare avanti le braccia.',
    ],
    ['Schiena sul cuscinetto', 'Cavi liberi', 'Braccia ferme'],
    [
      'Posizionare la panca in modo che i cavi sfreghino sul telaio o sul corpo',
      'Alzare le spalle per slanciare le maniglie',
    ],
  ),
  'incline-dumbbell-curl': e(
    'Curl su panca inclinata',
    ['curl inclinato', 'curl con manubri su panca inclinata'],
    [
      'Appoggiati su una panca a circa 45 gradi con le braccia che pendono dritte.',
      'Porta su i manubri senza portare avanti i gomiti.',
      'Scendi fino in fondo all’allungamento.',
    ],
    ['I gomiti restano dietro il corpo', 'Controlla l’allungamento in basso'],
    ['Staccare le spalle dalla panca per slanciare il peso'],
  ),
  'incline-dumbbell-fly': e(
    'Croci su panca inclinata',
    ['croci inclinate con manubri'],
    [
      'Regola una panca poco inclinata, circa 30 gradi. Sdraiati con i piedi piantati e manubri leggeri sopra la parte alta del petto, palmi uno verso l’altro.',
      'Mantieni i gomiti leggermente e stabilmente piegati e apri le braccia ad arco finché sono circa al livello del busto o il petto è allungato comodamente.',
      'Riunisci i manubri sopra la parte alta del petto lungo lo stesso arco, senza farli sbattere né cambiare l’angolo del gomito.',
    ],
    ['Inclinazione moderata', 'Angolo del gomito fisso', 'Controlla l’allungamento in basso'],
    [
      'Scendere con le braccia molto dietro il busto',
      'Spingere invece di aprire o usare troppo peso',
    ],
  ),
  'incline-dumbbell-press': e(
    'Panca inclinata con manubri',
    ['distensioni inclinate con manubri'],
    [
      'Regola la panca a circa 30 gradi.',
      'Abbassa i manubri all’altezza del petto con i gomiti sotto i polsi.',
      'Spingi fino a braccia distese.',
    ],
    ['Costole basse', 'Non far sbattere i manubri in alto'],
    ['Alzare le spalle verso le orecchie'],
  ),
  'incline-hammer-curl': e(
    'Hammer curl su panca inclinata',
    ['curl a martello inclinato'],
    [
      'Siediti contro una panca tra 45 e 60 gradi con i piedi piantati. Lascia pendere i manubri ai lati, palmi verso l’interno.',
      'Braccia ferme, porta i manubri verso le spalle senza ruotare i palmi verso l’alto.',
      'Scendi lentamente quasi fino a distendere i gomiti con la schiena contro lo schienale.',
    ],
    ['Palmi verso l’interno', 'Braccia ferme', 'Schiena appoggiata'],
    ['Slanciare le spalle in avanti', 'Ruotare i palmi in su o accorciare in basso'],
  ),
  'incline-machine-chest-press': e(
    'Chest press inclinata',
    ['panca inclinata alla macchina', 'distensioni inclinate alla macchina'],
    [
      'Scegli un carico gestibile. Su una macchina a dischi, carica i due lati in modo uguale. Regola sedile o schienale perché le maniglie partano accanto alla parte alta del petto.',
      'Appoggiati allo schienale inclinato con i piedi piantati e le anche appoggiate. Porta le scapole dolcemente indietro e in basso.',
      'Impugna a mano piena con i polsi dritti. Gomiti un po’ sotto l’altezza delle spalle e avambracci allineati con le maniglie.',
      'Espira e spingi le maniglie in avanti e in alto lungo la traiettoria della macchina. Spalle e schiena contro lo schienale; distendi senza bloccare i gomiti di scatto.',
      'Inspira scendendo lentamente finché le maniglie tornano accanto alla parte alta del petto, o alla posizione più profonda che controlli comodamente. Niente rimbalzi né allungamenti forzati.',
      'Ripeti con la stessa escursione e lo stesso ritmo. Riporta dolcemente le maniglie ai fermi prima di mollare.',
    ],
    [
      'Scapole indietro e in basso',
      'Schiena e anche sui cuscinetti',
      'Spingi fluido e controlla il ritorno',
      'Polsi dritti, gomiti sotto le spalle',
    ],
    [
      'Regolare in modo che le maniglie partano vicino al collo invece che al petto alto',
      'Staccare anche o spalle per muovere troppo peso',
      'Aprire i gomiti all’altezza delle spalle o piegare i polsi all’indietro',
      'Rimbalzare in basso, forzare la profondità o bloccare i gomiti di scatto',
    ],
  ),
  'incline-push-up': e(
    'Piegamenti inclinati',
    ['flessioni con mani rialzate', 'piegamenti sulla panca'],
    [
      'Appoggia le mani un po’ più larghe delle spalle su una panca stabile o una superficie rialzata fissa. Arretra finché il corpo forma una linea retta dalla testa ai talloni.',
      'Contrai l’addome e piega i gomiti per portare il petto verso il bordo, gomiti a circa 30-45 gradi dal busto.',
      'Spingi sui palmi fino a braccia distese senza far cedere le anche. Un appoggio più alto rende il movimento più facile.',
    ],
    [
      'Linea retta che passa per le anche',
      'Porta il petto verso l’appoggio',
      'Usa un appoggio che non scivoli né si ribalti',
    ],
    ['Far cedere la zona lombare', 'Aprire i gomiti o appoggiare solo la punta delle dita'],
  ),
  'jm-press': e(
    'JM press',
    ['distensioni JM', 'JM press per tricipiti'],
    [
      'Sdraiati su una panca piana sotto un bilanciere agganciato con i piedi piantati. Regola le sicure e impugna chiuso alla larghezza delle spalle. Impara la traiettoria con il bilanciere scarico o molto leggero.',
      'Sgancia sopra la parte alta del petto. Piega i gomiti tenendoli alti e rivolti verso i piedi mentre il bilanciere va verso lo spazio tra mento e petto alto.',
      'Fermati al piegamento del gomito che controlli, con il bilanciere lontano da viso e gola. Distendi i gomiti per riportare il bilanciere sopra il petto.',
      'Tieni la parte alta della schiena sulla panca per tutto il tempo e riaggancia il bilanciere in sicurezza dopo la serie.',
    ],
    [
      'Inizia leggero e impara la traiettoria dei gomiti',
      'Bilanciere lontano da viso e gola',
      'Gomiti alti durante la discesa',
    ],
    [
      'Abbassare il bilanciere sulla gola o sul viso',
      'Trasformare ogni ripetizione in una panca stretta',
      'Forzare il piegamento del gomito o caricare oltre il controllo',
    ],
  ),
  'jumping-jacks': e(
    'Jumping jacks',
    ['salti divaricati', 'jumping jack'],
    [
      'In piedi, piedi uniti e braccia lungo i fianchi. Lascia abbastanza spazio per distendere le braccia sopra la testa.',
      'Fai un piccolo salto per divaricare i piedi mentre porti le braccia di lato sopra la testa. Atterra morbido con le ginocchia in linea con le punte.',
      'Salta di nuovo a piedi uniti mentre le braccia tornano ai fianchi. Apertura e chiusura contano come una ripetizione; per meno impatto, porta fuori un piede alla volta.',
    ],
    [
      'Atterraggi piccoli e morbidi',
      'Ginocchia allineate con le punte',
      'Apertura più chiusura è una ripetizione',
    ],
    ['Atterrare a ginocchia bloccate', 'Saltare più largo o più veloce di quanto controlli'],
  ),
  'kettlebell-clean': e(
    'Clean con kettlebell',
    ['girata con kettlebell', 'clean a un braccio'],
    [
      'Parti come in uno swing a una mano, con il kettlebell spinto indietro tra le gambe.',
      'Spingi le anche in avanti e tira il kettlebell vicino al corpo, lasciandolo ruotare attorno al polso.',
      'Ricevilo morbido in posizione rack, poi lascialo ricadere nella flessione d’anca. Finisci il lato, poi cambia.',
    ],
    [
      'Kettlebell vicino, come chiudere una zip',
      'Il lavoro lo fanno le anche',
      'Ricezione morbida',
    ],
    ['Allargare il kettlebell in modo che sbatta sull’avambraccio'],
  ),
  'kettlebell-deadlift': e(
    'Stacco con kettlebell',
    ['stacco kettlebell', 'deadlift con kettlebell'],
    [
      'In piedi con il kettlebell tra i piedi, sotto il mesopiede.',
      'Porta le anche indietro con la schiena piatta e afferra la maniglia con entrambe le mani.',
      'Alzati spingendo le anche in avanti, poi riabbassalo allo stesso modo.',
    ],
    ['Schiena piatta', 'Spingi via il pavimento', 'Anche e spalle salgono insieme'],
    ['Arrotondare la zona lombare per raggiungere il kettlebell', 'Trasformarlo in uno squat'],
  ),
  'kettlebell-press': e(
    'Distensione con kettlebell',
    ['press con kettlebell', 'lento avanti con kettlebell a un braccio'],
    [
      'Porta il kettlebell in posizione rack: sull’avambraccio, contro il petto, polso dritto.',
      'Contrai il busto e stringi i glutei.',
      'Spingilo sopra la testa fino a bloccare, poi riportalo in rack. Finisci il lato, poi cambia.',
    ],
    [
      'Polso dritto, nocche verso il soffitto',
      'Costole basse',
      'Bicipite accanto all’orecchio in alto',
    ],
    ['Inclinarsi indietro per spingere', 'Lasciar piegare il polso sotto il kettlebell'],
  ),
  'kettlebell-snatch': e(
    'Strappo con kettlebell',
    ['snatch con kettlebell', 'strappo a un braccio'],
    [
      'Parti come in uno swing a una mano, con il kettlebell spinto indietro tra le gambe.',
      'Spingi le anche in avanti e porta su il kettlebell vicino al corpo.',
      'Infila la mano mentre sale così che arrivi morbido sopra la testa con il braccio bloccato. Riabbassalo nella flessione d’anca.',
    ],
    ['Infila la mano in alto', 'Vicino al corpo in salita', 'Blocca il braccio sopra la testa'],
    [
      'Lasciar ribaltare il kettlebell e farlo sbattere sull’avambraccio',
      'Spingerlo su con il braccio',
    ],
  ),
  'kettlebell-swing': e(
    'Swing con kettlebell',
    ['swing russo', 'swing a due mani', 'swing'],
    [
      'In piedi con i piedi alla larghezza delle spalle e il kettlebell a terra una trentina di centimetri davanti.',
      'Piegati all’anca, afferra la maniglia con entrambe le mani e spingilo indietro tra le gambe.',
      'Fai scattare le anche in avanti perché il kettlebell salga all’altezza del petto a braccia distese, poi lascialo ricadere nella flessione d’anca.',
    ],
    [
      'È una flessione d’anca, non uno squat',
      'Scatto d’anca, le braccia tengono soltanto',
      'Glutei stretti in alto',
    ],
    [
      'Sollevare il kettlebell con le braccia o le spalle',
      'Accovacciarsi invece di piegarsi all’anca',
      'Inclinarsi indietro in alto',
    ],
  ),
  'lat-pulldown': e(
    'Lat machine',
    ['lat machine avanti', 'pulldown', 'trazioni alla lat machine'],
    [
      'Regola il cuscinetto delle cosce per restare seduto.',
      'Impugna più largo delle spalle e inclinati leggermente indietro.',
      'Tira la barra alla parte alta del petto, poi torna al completo allungamento.',
    ],
    ['Petto alto, barra alla clavicola', 'Lascia salire le scapole in alto'],
    ['Inclinarsi tanto che diventa un rematore', 'Tirare dietro la nuca'],
  ),
  'lateral-raise': e(
    'Alzate laterali',
    ['alzate laterali con manubri', 'alzata laterale'],
    [
      'In piedi con i manubri ai fianchi e i gomiti leggermente piegati.',
      'Alza di lato finché le braccia sono all’altezza delle spalle.',
      'Scendi lentamente.',
    ],
    ['Guida con i gomiti', 'Fermati all’altezza delle spalle'],
    ['Slanciare il peso con la zona lombare', 'Andare troppo pesante'],
  ),
  'leg-extension': e(
    'Leg extension',
    ['estensioni delle gambe', 'quadricipiti alla macchina'],
    [
      'Regola il rullo appena sopra le caviglie.',
      'Distendi le ginocchia finché le gambe sono dritte.',
      'Scendi con controllo senza appoggiare il peso.',
    ],
    ['Breve pausa in alto', 'Lento in discesa'],
    ['Slanciare il busto per iniziare ogni ripetizione'],
  ),
  'leg-press': e(
    'Leg press',
    ['pressa per le gambe', 'pressa'],
    [
      'Siediti con i piedi alla larghezza delle spalle sulla pedana.',
      'Scendi finché le ginocchia arrivano a circa 90 gradi.',
      'Spingi di nuovo senza bloccare le ginocchia con forza.',
    ],
    ['Non far staccare la zona lombare dallo schienale', 'Controlla la discesa'],
    ['Portare le ginocchia così in basso che il bacino si ribalta'],
  ),
  'log-press': e(
    'Log press',
    ['distensione con log', 'log strongman'],
    [
      'Usa un log da strongman con impugnature neutre interne e un’area libera. Portalo in una posizione front rack stabile con una girata collaudata o da supporti adatti, e contrai con i piedi alla larghezza delle spalle.',
      'Con il busto eretto, piega un poco le ginocchia, poi spingi con le gambe e porta il log sopra la testa con i palmi uno verso l’altro.',
      'Chiudi con braccia e ginocchia distese e il log in equilibrio sopra spalle e mesopiede. Evita di inclinarti indietro con la zona lombare.',
      'Scendi in front rack con controllo, ammortizzando con le ginocchia. Ricomponiti prima della successiva e riporta giù il log in un modo collaudato. Ogni distensione sopra la testa è una ripetizione.',
    ],
    [
      'Afferra saldamente le impugnature interne',
      'Piegati e spingi in verticale',
      'Chiudi con il log in equilibrio sopra la testa',
    ],
    [
      'Spingere da un front rack instabile',
      'Inclinarsi molto indietro invece di andare sotto il log',
      'Lasciar cadere il log senza un’area di atterraggio libera',
    ],
  ),
  'lying-leg-curl': e(
    'Leg curl sdraiato',
    ['leg curl', 'femorali alla macchina'],
    [
      'Sdraiati a pancia in giù con il rullo appena sopra i talloni.',
      'Porta i talloni verso i glutei.',
      'Scendi lentamente fino al completo allungamento.',
    ],
    ['Le anche restano sul cuscinetto', 'Negativa lenta'],
    ['Sollevare le anche per slanciare il peso'],
  ),
  'lying-leg-raise': e(
    'Sollevamento gambe da sdraiato',
    ['leg raise a terra', 'gambe tese da sdraiato'],
    [
      'Sdraiati sulla schiena con testa e scapole appoggiate, braccia lungo le anche e palmi in giù. Contrai l’addome e tieni la zona lombare morbida a terra.',
      'Solleva entrambe le gambe insieme con le ginocchia morbidamente distese. Avvicinandoti alla verticale, arrotola dolcemente il bacino verso le costole senza oscillare.',
      'Scendi lentamente solo fin dove la schiena resta stabile. Piega le ginocchia o accorcia la discesa se la zona lombare si inarca.',
    ],
    ['Testa e spalle appoggiate', 'Zona lombare stabile', 'Controlla l’escursione in discesa'],
    [
      'Inarcare la schiena quando i talloni si avvicinano al pavimento',
      'Oscillare le gambe o alzare la testa per compensare',
    ],
  ),
  'machine-chest-press': e(
    'Chest press',
    ['chest press alla macchina', 'distensioni alla macchina'],
    [
      'Regola il sedile perché le maniglie siano a metà petto.',
      'Spingi fino a braccia distese senza bloccare con forza.',
      'Torna con controllo finché senti l’allungamento.',
    ],
    ['Scapole indietro e in basso', 'Escursione completa, niente rimbalzi'],
    ['Sedile troppo alto, che la trasforma in una distensione inclinata'],
  ),
  'machine-lateral-raise': e(
    'Alzate laterali alla macchina',
    ['macchina per alzate laterali'],
    [
      'Regola il sedile perché le spalle siano allineate con il fulcro della macchina e i cuscinetti all’esterno delle braccia, sopra i gomiti.',
      'Siedi dritto con i piedi piantati e i gomiti leggermente piegati. Alza le braccia di lato fino all’altezza delle spalle.',
      'Abbassa i cuscinetti lentamente senza far sbattere il pacco pesi.',
    ],
    [
      'Guida con le braccia',
      'Spalle lontane dalle orecchie',
      'Chiudi comodo all’altezza delle spalle',
    ],
    [
      'Alzare le spalle o oscillare il busto',
      'Regolare il sedile con il fulcro molto sopra o sotto le spalle',
    ],
  ),
  'machine-shrug': e(
    'Scrollate alla macchina',
    ['macchina per scrollate'],
    [
      'Mettiti nella macchina per scrollate con i piedi piantati e impugna chiuso le maniglie laterali. Regola i fermi prima di caricare.',
      'Braccia distese e busto fermo mentre sollevi entrambe le spalle verso le orecchie.',
      'Fai una breve pausa, poi abbassa le spalle con controllo fino a un allungamento comodo.',
    ],
    ['Solleva le spalle dritte', 'Gomiti distesi', 'Testa in linea con il busto'],
    ['Ruotare le spalle', 'Piegare i gomiti o rimbalzare con le ginocchia'],
  ),
  'machine-triceps-extension': e(
    'Tricipiti alla macchina',
    ['macchina per tricipiti', 'estensioni alla macchina'],
    [
      'Regola il sedile perché le braccia poggino sul cuscinetto anteriore e i gomiti siano allineati con il fulcro della leva. Impugna le due maniglie con i polsi dritti.',
      'Braccia sul cuscinetto, distendi i gomiti per muovere le maniglie lungo la traiettoria della macchina.',
      'Torna lentamente a un piegamento comodo del gomito senza sollevare le braccia né far sbattere il pacco.',
    ],
    [
      'Le braccia restano sul cuscinetto',
      'Muoviti dai gomiti',
      'Chiudi senza bloccare i gomiti di scatto',
    ],
    [
      'Sollevare spalle o braccia per muovere le maniglie',
      'Usare lo slancio o forzare l’allungamento in basso',
    ],
  ),
  'mountain-climbers': e(
    'Mountain climbers',
    ['scalatore', 'mountain climber'],
    [
      'Parti in plank alto con le mani sotto le spalle e il corpo in linea retta.',
      'Porta un ginocchio verso il petto senza sollevare le anche, poi riporta il piede mentre l’altro ginocchio avanza.',
      'Alterna a un ritmo che ti permetta di tenere le spalle sopra le mani e il busto fermo. Ogni ginocchio conta come una ripetizione.',
    ],
    ['Anche in bolla', 'Spalle sopra le mani', 'Controlla ogni ginocchio'],
    [
      'Far rimbalzare le anche o far cedere la zona lombare',
      'Andare così veloce che piedi e busto perdono il controllo',
    ],
  ),
  'muscle-up': e(
    'Muscle-up',
    ['muscle up alla sbarra', 'bar muscle-up'],
    [
      'Usa una sbarra dritta sicura con spazio a sufficienza sopra e attorno per il passaggio e l’oscillazione. Parti con presa prona chiusa e spalle attive. Questa versione usa un kip controllato.',
      'Crea una piccola oscillazione da hollow ad arco, poi spingi le anche e tira la sbarra verso il petto basso tenendola vicina.',
      'Quando il busto sale sopra la sbarra, porta entrambi i gomiti sopra insieme e inclina il petto in avanti in un dip stabile alla sbarra.',
      'Spingi fino al sostegno a braccia distese. Inverti il passaggio con controllo e ricomponi l’oscillazione prima della ripetizione successiva. Allena separatamente trazione, passaggio e dip alla sbarra prima di unirli.',
    ],
    [
      'Sbarra vicina nel passaggio',
      'Porta sopra entrambi i gomiti insieme',
      'Controlla oscillazione e discesa',
    ],
    [
      'Portare sopra un gomito prima dell’altro',
      'Tentare il passaggio senza trazioni e dip alla sbarra solidi',
      'Usare una sbarra con poco spazio sopra o per l’oscillazione',
    ],
  ),
  'neck-curl': e(
    'Flessione del collo',
    ['flessioni del collo da sdraiato', 'rinforzo del collo'],
    [
      'Sdraiati sulla schiena su una panca piana con scapole e busto appoggiati, piedi piantati e la testa appena oltre il bordo. Inizia senza peso aggiunto.',
      'Rientra dolcemente il mento e solleva la testa di poco usando la parte anteriore del collo. Le spalle restano sulla panca.',
      'Scendi lentamente in una posizione comoda senza lasciar cadere la testa all’indietro. Usa un’escursione piccola e senza dolore, e fermati se senti dolore al collo o capogiri.',
    ],
    ['Inizia senza peso aggiunto', 'Spalle appoggiate', 'Movimento lento e breve'],
    [
      'Trasformarlo in un crunch',
      'Lasciarsi andare in un allungamento profondo del collo o forzare il mento in avanti',
    ],
  ),
  'one-arm-cable-bicep-curl': e(
    'Curl bicipiti a un braccio al cavo',
    ['curl unilaterale al cavo', 'curl a un braccio ai cavi'],
    [
      'Aggancia una maniglia a un cavo basso e tienila con una mano, palmo in avanti. Di fronte alla macchina con una posizione stabile e il gomito accanto alle costole.',
      'Porta la maniglia verso la spalla che lavora con il braccio fermo e il polso dritto. La mano libera sul fianco o rilassata.',
      'Scendi lentamente quasi fino a distendere il braccio senza ruotare il busto. Fai entrambi i lati e registra le ripetizioni per braccio.',
    ],
    ['Palmo verso l’alto', 'Gomito accanto alle costole', 'Busto fermo'],
    ['Ruotare il busto per muovere la maniglia', 'Piegare il polso o portare avanti il braccio'],
  ),
  'one-arm-pull-ups': e(
    'Trazioni a un braccio',
    ['trazione a un braccio', 'one arm pull-up'],
    [
      'Usa una sbarra sicura con spazio per una discesa controllata. È una trazione a un braccio senza assistenza con presa prona; sviluppa prima progressioni assistite controllate.',
      'Impugna chiuso con una mano e attiva la spalla con i piedi staccati da terra. L’altra mano resta libera, senza tenere il polso né la sbarra.',
      'Porta il gomito verso le costole finché il mento supera la sbarra, senza calciare. Concedi una piccola rotazione comoda del corpo invece di forzare la spalla.',
      'Scendi con controllo fino al braccio lungo senza sprofondare nella spalla. Fermati prima che cedano la presa o il controllo della spalla. Allena entrambi i lati e registra le ripetizioni per braccio.',
    ],
    [
      'Spalla che lavora attiva',
      'Mano libera lontana da sbarra e polso',
      'Controlla tutta la discesa',
    ],
    [
      'Cadere di colpo in un appeso passivo a un braccio',
      'Calciare o contare come libere ripetizioni aiutate dal polso',
    ],
  ),
  'one-arm-push-ups': e(
    'Piegamenti a un braccio',
    ['flessioni a un braccio', 'one arm push-up'],
    [
      'Appoggia un palmo saldo sotto il petto e allarga i piedi ben oltre le spalle per stabilità. Metti la mano libera dietro la schiena e contrai il busto.',
      'Piega il gomito d’appoggio verso le costole per abbassare il petto con controllo. Le anche non cedono; una piccola rotazione naturale del busto va bene.',
      'Spingi sul palmo d’appoggio fino a braccio disteso senza torcerti di scatto. Fai entrambi i lati e registra le ripetizioni per braccio. Esercitati con la mano su una superficie rialzata stabile prima di passare a terra.',
    ],
    [
      'Piedi larghi e stabili',
      'Contrai contro la rotazione eccessiva',
      'Gomito che lavora vicino alle costole',
    ],
    [
      'Usare una base stretta prima di controllare la rotazione',
      'Far cedere la zona lombare o spingere con la mano libera',
    ],
  ),
  'one-arm-seated-cable-row': e(
    'Pulley basso a un braccio',
    ['rematore al cavo a un braccio seduto', 'pulley unilaterale'],
    [
      'Aggancia una maniglia al cavo del pulley. Siediti con entrambi i piedi saldi sulle pedane, ginocchia leggermente piegate e petto eretto. Tieni la maniglia con una mano in presa neutra.',
      'Bacino e busto frontali mentre porti il gomito verso l’anca e la maniglia verso le costole basse. La mano libera sulla coscia.',
      'Distendi il braccio lentamente lasciando avanzare comodamente la scapola senza arrotondare la zona lombare. Fai entrambi i lati e registra le ripetizioni per braccio.',
    ],
    ['Busto frontale', 'Porta il gomito verso l’anca', 'Lascia muovere la scapola con controllo'],
    [
      'Ruotare o oscillare il busto per muovere il pacco',
      'Alzare la spalla o arrotondare la zona lombare',
    ],
  ),
  'overhead-press': e(
    'Lento avanti con bilanciere',
    ['military press', 'distensioni sopra la testa', 'lento in piedi'],
    [
      'Prendi il bilanciere all’altezza della clavicola con presa alla larghezza delle spalle.',
      'Contrai il busto e stringi i glutei.',
      'Spingi sopra la testa spostando leggermente indietro la testa, poi riportala sotto il bilanciere in alto.',
    ],
    ['Costole basse', 'Traiettoria vicina al viso', 'Chiudi con il bilanciere sopra le orecchie'],
    ['Inclinarsi indietro fino a farne una distensione inclinata'],
  ),
  'overhead-squat': e(
    'Overhead squat',
    ['squat con bilanciere sopra la testa', 'OHS'],
    [
      'Impara con un bastone o un bilanciere leggero in un’area libera e pratica un’uscita sicura prima di caricare. Usa una presa larga da strappo e porta il bilanciere in alto con una tecnica che già controlli.',
      'Metti i piedi in una posizione di squat comoda. Contrai e sostieni attivamente il bilanciere sopra il mesopiede con i gomiti distesi.',
      'Scendi lentamente con tutto il piede a terra e le ginocchia in linea con le punte. Scendi solo fin dove il bilanciere resta in equilibrio sopra la testa.',
      'Alzati mantenendo lo stesso sostegno in alto. Riporta giù il bilanciere in sicurezza con la tua tecnica collaudata; interrompi la serie se i gomiti cedono o perdi l’equilibrio.',
    ],
    [
      'Bilanciere in equilibrio sopra il mesopiede',
      'Spingi verso l’alto contro il bilanciere',
      'Tutto il piede a terra',
    ],
    [
      'Forzare la profondità mentre il bilanciere scivola avanti',
      'Piegare i gomiti o caricare oltre il controllo sopra la testa',
    ],
  ),
  'overhead-triceps-extension': e(
    'French press sopra la testa',
    ['estensioni tricipiti sopra la testa', 'french press', 'estensioni ai cavi sopra la testa'],
    [
      'Dai le spalle a un cavo basso, oppure tieni un manubrio sopra la testa.',
      'Braccia accanto alle orecchie, scendi dietro la testa.',
      'Distendi di nuovo fino in fondo.',
    ],
    ['Le braccia restano ferme', 'Cerca un buon allungamento in basso'],
    ['Lasciar aprire molto i gomiti'],
  ),
  'pec-deck': e(
    'Pectoral machine',
    ['pec deck', 'butterfly', 'croci alla macchina'],
    [
      'Regola il sedile perché le maniglie siano all’altezza del petto.',
      'Porta i cuscinetti insieme davanti a te.',
      'Torna finché senti l’allungamento, senza appoggiare il peso.',
    ],
    ['Petto alto', 'Breve pausa in contrazione'],
    ['Alzare le spalle alla fine di ogni ripetizione'],
  ),
  'pike-push-up': e(
    'Piegamenti pike',
    ['pike push-up', 'piegamenti a V'],
    [
      'Parti in appoggio su mani e piedi, mani alla larghezza delle spalle. Solleva le anche a V rovesciata con la testa tra le braccia.',
      'Piega i gomiti all’indietro e porta la testa verso un punto appena davanti alle mani, anche alte.',
      'Spingi via il pavimento fino a braccia distese e torna alla V rovesciata. La testa non tocca terra.',
    ],
    [
      'Anche alte',
      'Gomiti angolati indietro',
      'Controlla la traiettoria della testa davanti alle mani',
    ],
    [
      'Abbassare le anche fino a un piegamento normale',
      'Appoggiare il peso sulla testa o aprire molto i gomiti',
    ],
  ),
};
