import { exercise as e } from '../entry.js';
import type { ExerciseText } from '../types.js';

export const exercises2: Readonly<Record<string, ExerciseText>> = {
  'dumbbell-shrug': e(
    'Shrugs mit Kurzhanteln',
    ['KH-Shrugs', 'Schulterheben Kurzhantel'],
    [
      'Steh etwa hüftbreit, je eine Kurzhantel seitlich, Handflächen zu den Oberschenkeln.',
      'Brust aufrecht, Kopf neutral, Arme gestreckt. Zieh beide Schultern Richtung Ohren, ohne die Ellbogen zu beugen oder die Schultern zu kreisen.',
      'Halte oben kurz und senke die Schultern langsam in eine angenehme Dehnung.',
      'Wiederhole mit ruhigem Oberkörper und gleichem, kontrolliertem Umfang auf beiden Seiten. Leg die Hanteln danach kontrolliert ab.',
    ],
    [
      'Schultern gerade hoch und runter',
      'Arme bleiben gestreckt',
      'Oben kurz halten',
      'Kopf neutral',
    ],
    [
      'Die Schultern kreisen',
      'Die Ellbogen beugen oder mit den Beinen wippen',
      'Den Kopf nach vorn schieben',
      'Ein Gewicht, das kein kontrolliertes Heben erlaubt',
    ],
  ),
  'ez-bar-curl': e(
    'SZ-Curl',
    ['SZ-Stangen-Curl', 'Bizepscurl SZ'],
    [
      'Steh mit der SZ-Stange an den schrägen Griffen, Arme gestreckt.',
      'Curle die Stange auf Schulterhöhe, Ellbogen an der Seite.',
      'Senke kontrolliert bis zur vollen Streckung.',
    ],
    ['Ellbogen an den Rippen', 'Unten ganz strecken'],
    ['Jede Wiederholung mit Schwung aus der Hüfte beginnen'],
  ),
  'face-pull': e(
    'Face Pull',
    ['Facepull', 'Seilzug zum Gesicht'],
    [
      'Stell ein Seil etwa auf Gesichtshöhe ein.',
      'Zieh das Seil zum Gesicht und die Enden dabei auseinander.',
      'Schließ mit den Händen neben den Ohren und hohen Ellbogen ab.',
    ],
    ['Ellbogen über den Handgelenken', 'Auseinanderziehen, nicht nur nach hinten'],
    ['So schwer einstellen, dass der Oberkörper nach hinten schaukelt'],
  ),
  'farmer-carry': e(
    'Farmer’s Walk',
    ['Farmer Walk', 'Bauernlauf', 'Gewichte tragen'],
    [
      'Nimm in jede Hand eine schwere Kurzhantel oder Kettlebell.',
      'Steh aufrecht, Schultern zurück.',
      'Geh geradeaus auf Strecke oder Zeit.',
    ],
    ['Aufrechte Haltung, nicht lehnen', 'Griffe fest zudrücken'],
    ['Die Schultern unter der Last nach vorn rund werden lassen'],
  ),
  'flat-bench-dumbbell-fly': e(
    'Fliegende auf der Flachbank',
    ['Kurzhantel-Fliegende', 'Flys flach', 'Brust-Flys'],
    [
      'Leg dich auf eine Flachbank, Füße fest. Halte leichte Kurzhanteln über der Brust, Handflächen zueinander, Ellbogen leicht gebeugt.',
      'Öffne die Arme im weiten Bogen und halte den Ellbogenwinkel. Stoppe bei angenehmer Brustdehnung, Oberarme etwa in Linie mit dem Oberkörper.',
      'Führ die Hanteln im selben umarmenden Bogen zurück über die Brust, ohne daraus ein Drücken zu machen.',
    ],
    [
      'Ellbogen leicht und fest gebeugt',
      'Im umarmenden Bogen öffnen und schließen',
      'Angenehme Brustdehnung',
    ],
    [
      'Die Gewichte weit unter den Oberkörper sinken lassen',
      'Die Ellbogen ganz strecken oder die Gewichte hochdrücken',
    ],
  ),
  'goblet-squat': e(
    'Goblet Squat',
    ['Goblet-Kniebeuge', 'Kettlebell-Kniebeuge'],
    [
      'Halte eine Kurzhantel oder Kettlebell auf Brusthöhe.',
      'Geh zwischen die Knie in die Hocke, Brust aufrecht.',
      'Drück dich über den ganzen Fuß hoch.',
    ],
    ['Unten Ellbogen innerhalb der Knie', 'Brust stolz'],
    ['Die Fersen vom Boden heben'],
  ),
  'hack-squat': e(
    'Hackenschmidt-Kniebeuge',
    ['Hack Squat', 'Hackenschmidt'],
    [
      'Schultern unter die Polster, Füße mittig auf der Plattform.',
      'Senke ab, bis die Oberschenkel mindestens parallel sind.',
      'Drück dich über den ganzen Fuß wieder hoch.',
    ],
    ['Rücken flach am Polster', 'Knie folgen den Zehen'],
    ['Aus der Tiefe abfedern'],
  ),
  'hammer-curl': e(
    'Hammercurl',
    ['Hammer Curl', 'Neutralgriff-Curl'],
    [
      'Halte die Kurzhanteln mit den Handflächen zueinander.',
      'Curle auf Schulterhöhe, ohne die Handgelenke zu drehen.',
      'Senke kontrolliert ab.',
    ],
    ['Daumen bleiben oben', 'Ellbogen ruhig'],
    ['Auf halbem Weg in einen normalen Curl drehen'],
  ),
  'handstand-push-ups': e(
    'Handstand-Liegestütz',
    ['Handstanddrücken', 'HSPU', 'Freier Handstand-Liegestütz'],
    [
      'Das ist ein strikter, freier Handstand-Liegestütz. Entwickle zuerst einen stabilen Handstand und übe einen kontrollierten Ausstieg auf freier Fläche; nutze beim Lernen Pike- oder unterstützte Varianten.',
      'Geh in den Handstand, Handflächen etwa schulterbreit, Finger gespreizt, Rumpf angespannt. Beine geschlossen über der Hüfte.',
      'Beuge die Ellbogen kontrolliert und führ den Kopf zu einem Punkt knapp vor den Händen. Geh nur so tief, wie du ohne Gewicht auf dem Kopf umkehren kannst.',
      'Drück dich fest über die Handflächen zu gestreckten Armen und finde die Balance. Nicht mit den Beinen schwingen, um die Wiederholung zu beenden; steig aus, bevor du die Kontrolle verlierst.',
    ],
    [
      'Finger spreizen, über die Handflächen drücken',
      'Rumpf angespannt',
      'Kein Gewicht auf den Kopf',
    ],
    [
      'Auf Kopf oder Nacken zusammensacken',
      'Mit den Beinen kippen oder ohne kontrollierten Ausstieg üben',
    ],
  ),
  'hanging-knee-raise': e(
    'Knieheben im Hang',
    ['Hängendes Knieheben', 'Knee Raise'],
    [
      'Häng dich mit geschlossenem Obergriff und langen Armen an eine sichere Klimmzugstange. Schultern aktivieren und den Körper zur Ruhe kommen lassen.',
      'Beuge beide Knie und zieh sie Richtung Brust, rolle dabei das Becken leicht nach oben, statt nur die Oberschenkel zu heben.',
      'Senke langsam zurück in den Hang, ohne zu schwingen. Einmal Heben und Senken beider Knie ist eine Wiederholung.',
    ],
    [
      'Jede Wiederholung ohne Schwung beginnen',
      'Becken Richtung Rippen rollen',
      'Knie langsam absenken',
    ],
    [
      'Die Knie mit Pendelschwung heben',
      'Die Beine fallen lassen oder passiv in die Schultern sacken',
    ],
  ),
  'hanging-leg-raise': e(
    'Beinheben im Hang',
    ['Hängendes Beinheben', 'Leg Raise'],
    [
      'Häng dich mit aktiven Schultern an eine Stange.',
      'Heb die Beine, bis sich die Hüfte leicht einrollt.',
      'Senke kontrolliert ab, ohne zu schwingen.',
    ],
    ['Oben das Becken einrollen', 'Kein Schwingen zwischen den Wiederholungen'],
    ['Mit Schwung arbeiten und nur aus der Hüfte bewegen'],
  ),
  'hip-abduction-machine': e(
    'Abduktorenmaschine',
    ['Abduktoren', 'Abduktion', 'Beinspreizer'],
    [
      'Setz dich mit dem Rücken ans Polster, Knie an den äußeren Polstern.',
      'Drück die Knie so weit auseinander, wie es angenehm geht.',
      'Führ sie kontrolliert zurück, statt sie vom Gewicht zusammenziehen zu lassen.',
    ],
    [
      'Aufrecht sitzen; nach vorn lehnen ändert, welcher Teil des Gesäßes arbeitet',
      'Am weitesten Punkt kurz halten',
    ],
    [
      'Den ganzen Block nehmen und nur fünf Zentimeter bewegen',
      'Den Oberkörper schaukeln, um die letzten Grad zu schaffen',
    ],
  ),
  'hip-adduction-machine': e(
    'Adduktorenmaschine',
    ['Adduktoren', 'Adduktion', 'Beinschließer'],
    [
      'Setz dich mit dem Rücken ans Polster, Knie an den inneren Polstern.',
      'Drück die Knie zusammen, bis sich die Polster fast berühren.',
      'Lass sie kontrolliert wieder auseinander, nur so weit, wie die Dehnung angenehm ist.',
    ],
    [
      'Zusammendrücken, nicht schwingen',
      'Beim Zurückgehen dort stoppen, wo die Dehnung beginnt, nicht wo es wehtut',
    ],
    [
      'So schwer laden, dass das Zurückgehen zum Fallenlassen wird',
      'Weiter öffnen, als die Hüfte aufgewärmt ist',
    ],
  ),
  'incline-barbell-press': e(
    'Schrägbankdrücken mit Langhantel',
    ['Schrägbankdrücken', 'Schrägbank', 'Incline Bench'],
    [
      'Stelle die Bank auf etwa 30 Grad.',
      'Heb aus und senke die Stange zur oberen Brust.',
      'Drück nach oben und leicht zurück über die Schultern.',
    ],
    ['Fest gegen die Bank', 'Stange zum Schlüsselbein, nicht zum Hals'],
    ['Die Bank zu steil stellen, dann wird es ein Schulterdrücken'],
  ),
  'incline-cable-curl': e(
    'Schrägbank-Curl am Kabel',
    ['Kabelcurl auf der Schrägbank'],
    [
      'Stelle eine leicht schräge Bank mittig zwischen zwei tiefe Kabelzüge, Kopfende zum Gerät. Nimm in jede Hand einen Griff und lehn dich zurück, Füße fest, Handflächen nach vorn.',
      'Oberarme hängen neben oder leicht hinter dem Oberkörper; curle beide Griffe Richtung Schultern. Die Kabel bleiben frei von Bank und Körper.',
      'Senke langsam fast bis zur Streckung, ohne den Rücken zu heben oder die Oberarme nach vorn zu bewegen.',
    ],
    ['Rücken bleibt am Polster', 'Beide Kabel frei', 'Oberarme ruhig'],
    [
      'Die Bank so stellen, dass die Kabel an Gestell oder Körper reiben',
      'Die Schultern heben, um die Griffe zu schwingen',
    ],
  ),
  'incline-dumbbell-curl': e(
    'Schrägbank-Curl mit Kurzhanteln',
    ['Schrägbankcurl', 'Incline Curl'],
    [
      'Lehn dich auf einer Bank mit etwa 45 Grad zurück, Arme hängen gerade nach unten.',
      'Curle die Kurzhanteln hoch, ohne die Ellbogen nach vorn zu bringen.',
      'Senke ganz bis in die Dehnung ab.',
    ],
    ['Ellbogen bleiben hinter dem Körper', 'Die Dehnung unten kontrollieren'],
    ['Die Schultern von der Bank heben, um das Gewicht hochzuschwingen'],
  ),
  'incline-dumbbell-fly': e(
    'Schrägbank-Fliegende',
    ['Schräg-Flys', 'Incline Fly'],
    [
      'Stelle eine Bank auf eine leichte Schräge um 30 Grad. Leg dich hin, Füße fest, leichte Kurzhanteln über der oberen Brust, Handflächen zueinander.',
      'Halte die Ellbogen leicht und fest gebeugt und öffne die Arme im Bogen, bis die Oberarme etwa auf Höhe des Oberkörpers sind oder die Brust angenehm gedehnt ist.',
      'Führ die Hanteln im selben Bogen über der oberen Brust zusammen, ohne sie zusammenzuschlagen oder den Ellbogenwinkel zu ändern.',
    ],
    ['Leichte Schräge', 'Ellbogenwinkel fest', 'Die Dehnung unten kontrollieren'],
    [
      'Die Arme weit hinter den Oberkörper senken',
      'Drücken statt öffnen oder zu viel Gewicht nehmen',
    ],
  ),
  'incline-dumbbell-press': e(
    'Schrägbankdrücken mit Kurzhanteln',
    ['KH-Schrägbank', 'Schrägbankdrücken Kurzhantel'],
    [
      'Stelle die Bank auf etwa 30 Grad.',
      'Senke die Kurzhanteln auf Brusthöhe, Ellbogen unter den Handgelenken.',
      'Drück hoch, bis die Arme gestreckt sind.',
    ],
    ['Rippen unten', 'Die Hanteln oben nicht zusammenschlagen'],
    ['Die Schultern zu den Ohren ziehen'],
  ),
  'incline-hammer-curl': e(
    'Schrägbank-Hammercurl',
    ['Hammercurl auf der Schrägbank'],
    [
      'Setz dich an eine Bank mit etwa 45 bis 60 Grad, Füße fest. Lass die Kurzhanteln seitlich hängen, Handflächen nach innen.',
      'Oberarme ruhig, curle die Hanteln Richtung Schultern, ohne die Handflächen nach oben zu drehen.',
      'Senke langsam fast bis zur Streckung, Rücken am Polster.',
    ],
    ['Handflächen nach innen', 'Oberarme ruhig', 'Rücken abgestützt'],
    ['Die Schultern nach vorn schwingen', 'Die Handflächen nach oben drehen oder unten abkürzen'],
  ),
  'incline-machine-chest-press': e(
    'Schräge Brustpresse',
    ['Schrägbank-Brustpresse', 'Schrägdrücken an der Maschine'],
    [
      'Wähle ein handhabbares Gewicht. Bei Scheibenbeladung beide Seiten gleich beladen. Stelle Sitz oder Rückenpolster so ein, dass die Griffe neben der oberen Brust starten.',
      'Lehn dich an das schräge Polster, Füße fest, Hüfte abgestützt. Zieh die Schulterblätter sanft nach hinten unten.',
      'Greif voll mit geraden Handgelenken. Ellbogen etwas unter Schulterhöhe, Unterarme in Linie mit den Griffen.',
      'Atme aus und drück die Griffe entlang der Maschinenbahn nach vorn oben. Schultern und Rücken bleiben am Polster; strecke, ohne die Ellbogen durchzuschlagen.',
      'Atme beim langsamen Absenken ein, bis die Griffe wieder neben der oberen Brust sind oder in der tiefsten Position, die du angenehm kontrollierst. Nicht abfedern oder Dehnung erzwingen.',
      'Wiederhole mit gleichem Umfang und Tempo. Führ die Griffe sanft zurück an ihre Anschläge, bevor du loslässt.',
    ],
    [
      'Schulterblätter nach hinten unten',
      'Rücken und Hüfte an den Polstern',
      'Gleichmäßig drücken, kontrolliert zurück',
      'Handgelenke gerade, Ellbogen unter Schulterhöhe',
    ],
    [
      'Die Polster so einstellen, dass die Griffe am Hals statt an der oberen Brust starten',
      'Hüfte oder Schultern von den Polstern heben, um zu viel Gewicht zu bewegen',
      'Die Ellbogen auf Schulterhöhe ausstellen oder die Handgelenke abknicken',
      'Unten abfedern, Tiefe erzwingen oder die Ellbogen durchschlagen',
    ],
  ),
  'incline-push-up': e(
    'Liegestütz mit erhöhten Händen',
    ['Schräg-Liegestütz', 'Incline Push-up'],
    [
      'Setz die Hände etwas breiter als schulterbreit auf eine stabile Bank oder feste erhöhte Fläche. Geh zurück, bis dein Körper eine gerade Linie vom Kopf bis zu den Fersen bildet.',
      'Spann den Bauch an und beuge die Ellbogen, um die Brust zur Kante zu senken, Ellbogen etwa 30 bis 45 Grad vom Oberkörper.',
      'Drück dich über die Handflächen zurück zu gestreckten Armen, ohne die Hüfte durchhängen zu lassen. Eine höhere Auflage macht es leichter.',
    ],
    [
      'Gerade Linie durch die Hüfte',
      'Brust zur Auflage führen',
      'Eine Auflage, die nicht rutschen oder kippen kann',
    ],
    [
      'Den unteren Rücken durchhängen lassen',
      'Die Ellbogen ausstellen oder nur mit den Fingerspitzen auf der Kante stützen',
    ],
  ),
  'jm-press': e(
    'JM Press',
    ['JM-Drücken', 'JM-Trizepsdrücken'],
    [
      'Leg dich auf eine Flachbank unter eine abgelegte Stange, Füße fest. Stelle die Sicherungen ein und greif geschlossen etwa schulterbreit. Lerne die Bahn mit leerer oder sehr leichter Stange.',
      'Heb über der oberen Brust aus. Beuge die Ellbogen, halte sie hoch und Richtung Füße gerichtet, während die Stange zwischen Kinn und oberer Brust wandert.',
      'Stoppe bei der Ellbogenbeugung, die du kontrollierst, mit der Stange frei von Gesicht und Hals. Streck die Ellbogen, um die Stange über die Brust zurückzubringen.',
      'Oberer Rücken bleibt die ganze Zeit auf der Bank; lege die Stange nach dem Satz sicher ab.',
    ],
    [
      'Leicht beginnen und die Ellbogenbahn lernen',
      'Stange weg von Gesicht und Hals',
      'Ellbogen beim Absenken hoch halten',
    ],
    [
      'Die Stange auf Hals oder Gesicht senken',
      'Jede Wiederholung zu engem Bankdrücken machen',
      'Ellbogentiefe erzwingen oder mehr laden als kontrollierbar',
    ],
  ),
  'jumping-jacks': e(
    'Hampelmann',
    ['Jumping Jacks', 'Hampelmänner'],
    [
      'Steh aufrecht, Füße zusammen, Arme neben dem Körper. Lass genug Platz, um beide Arme über den Kopf zu strecken.',
      'Spring leicht, um die Füße zu öffnen, während beide Arme seitlich über den Kopf schwingen. Lande weich, Knie folgen den Zehen.',
      'Spring zurück mit geschlossenen Füßen, die Arme kehren an die Seite zurück. Ein Öffnen und Schließen zählt als eine Wiederholung; für weniger Belastung einen Fuß nach dem anderen seitlich setzen.',
    ],
    [
      'Kleine, weiche Landungen',
      'Knie in Linie mit den Zehen',
      'Öffnen und Schließen zählt als eine Wiederholung',
    ],
    ['Mit durchgestreckten Knien landen', 'Weiter oder schneller springen, als du kontrollierst'],
  ),
  'kettlebell-clean': e(
    'Kettlebell Clean',
    ['KB-Clean', 'Kettlebell umsetzen', 'Einarmiger Kettlebell Clean'],
    [
      'Beginne wie beim einarmigen Swing, die Kettlebell zwischen die Beine nach hinten geschwungen.',
      'Treib die Hüfte nach vorn und zieh die Kettlebell nah heran, sodass sie um das Handgelenk rollt.',
      'Fang sie weich in der Rack-Position und lass sie zurück in die Hüftbeuge fallen. Seite fertig machen, dann wechseln.',
    ],
    ['Kettlebell nah, Reißverschluss hochziehen', 'Die Hüfte macht die Arbeit', 'Weich fangen'],
    ['Die Kettlebell weit ausschwingen, sodass sie auf den Unterarm knallt'],
  ),
  'kettlebell-deadlift': e(
    'Kettlebell-Kreuzheben',
    ['KB-Kreuzheben', 'Kreuzheben mit Kettlebell'],
    [
      'Steh mit der Kettlebell zwischen den Füßen, unter der Fußmitte.',
      'Beug dich in der Hüfte nach hinten, Rücken gerade, und greif den Griff mit beiden Händen.',
      'Steh auf, indem du die Hüfte nach vorn treibst, und senke sie auf dieselbe Weise ab.',
    ],
    ['Rücken gerade', 'Den Boden wegdrücken', 'Hüfte und Schultern steigen gemeinsam'],
    [
      'Den unteren Rücken rund machen, um die Kettlebell zu erreichen',
      'Daraus eine Kniebeuge machen',
    ],
  ),
  'kettlebell-press': e(
    'Kettlebell-Drücken',
    ['KB-Drücken', 'Einarmiges Kettlebell-Drücken', 'Kettlebell Overhead Press'],
    [
      'Setz die Kettlebell in die Rack-Position um: auf dem Unterarm, an der Brust, Handgelenk gerade.',
      'Spann den Rumpf an und drück das Gesäß zusammen.',
      'Drück sie über den Kopf bis zur Streckung und senke zurück ins Rack. Seite fertig machen, dann wechseln.',
    ],
    ['Handgelenk gerade, Knöchel zur Decke', 'Rippen unten', 'Oben Bizeps am Ohr'],
    ['Sich zum Drücken zurücklehnen', 'Das Handgelenk unter der Kettlebell abknicken lassen'],
  ),
  'kettlebell-snatch': e(
    'Kettlebell Snatch',
    ['KB-Snatch', 'Kettlebell-Reißen'],
    [
      'Beginne wie beim einarmigen Swing, die Kettlebell zwischen die Beine nach hinten geschwungen.',
      'Treib die Hüfte nach vorn und zieh die Kettlebell nah am Körper hoch.',
      'Stoß die Hand beim Aufsteigen durch, damit sie weich über dem Kopf mit gestrecktem Arm landet. Senke sie zurück in die Hüftbeuge.',
    ],
    ['Oben durchstoßen', 'Auf dem Weg hoch nah halten', 'Arm über dem Kopf strecken'],
    [
      'Die Kettlebell überkippen und auf den Unterarm krachen lassen',
      'Sie mit dem Arm hochdrücken',
    ],
  ),
  'kettlebell-swing': e(
    'Kettlebell Swing',
    ['KB-Swing', 'Russian Swing', 'Swing'],
    [
      'Steh schulterbreit, die Kettlebell etwa 30 Zentimeter vor dir auf dem Boden.',
      'Beuge dich in der Hüfte, greif den Griff mit beiden Händen und schwing sie zwischen die Beine nach hinten.',
      'Lass die Hüfte nach vorn schnellen, damit die Kettlebell mit gestreckten Armen auf Brusthöhe schwebt, und lass sie zurück in die Hüftbeuge fallen.',
    ],
    [
      'Hüftbeuge, keine Kniebeuge',
      'Die Hüfte schnellen lassen, die Arme halten nur fest',
      'Oben Gesäß fest',
    ],
    [
      'Die Kettlebell mit Armen oder Schultern heben',
      'In die Hocke gehen statt in der Hüfte zu beugen',
      'Sich oben zurücklehnen',
    ],
  ),
  'lat-pulldown': e(
    'Latzug',
    ['Latziehen', 'Lat Pulldown', 'Latzug zur Brust'],
    [
      'Stelle das Beinpolster so ein, dass du sitzen bleibst.',
      'Greif außerhalb der Schulterbreite und lehn dich leicht zurück.',
      'Zieh die Stange zur oberen Brust und geh zurück in die volle Dehnung.',
    ],
    ['Brust raus, Stange zum Schlüsselbein', 'Oben die Schulterblätter mitgehen lassen'],
    ['So weit zurücklehnen, dass es Rudern wird', 'Hinter den Nacken ziehen'],
  ),
  'lateral-raise': e(
    'Seitheben',
    ['Seitheben Kurzhantel', 'Lateral Raise'],
    [
      'Steh mit den Kurzhanteln an der Seite, Ellbogen leicht gebeugt.',
      'Heb seitlich, bis die Arme auf Schulterhöhe sind.',
      'Langsam absenken.',
    ],
    ['Mit den Ellbogen führen', 'Auf Schulterhöhe stoppen'],
    ['Das Gewicht mit dem unteren Rücken hochschwingen', 'Viel zu schwer nehmen'],
  ),
  'leg-extension': e(
    'Beinstrecker',
    ['Beinstrecken', 'Leg Extension', 'Quadrizepsstrecker'],
    [
      'Stelle das Polster knapp über den Knöcheln ein.',
      'Streck die Knie, bis die Beine gerade sind.',
      'Senke kontrolliert ab, ohne das Gewicht abzulegen.',
    ],
    ['Oben kurz halten', 'Langsam absenken'],
    ['Jede Wiederholung mit Schwung aus dem Oberkörper beginnen'],
  ),
  'leg-press': e(
    'Beinpresse',
    ['Beinpressen', 'Leg Press'],
    [
      'Setz dich mit schulterbreiten Füßen auf die Plattform.',
      'Senke ab, bis die Knie etwa 90 Grad erreichen.',
      'Drück zurück, ohne die Knie hart durchzustrecken.',
    ],
    ['Den unteren Rücken nicht vom Polster abrollen lassen', 'Das Absenken kontrollieren'],
    ['Die Knie so tief bringen, dass sich das Becken einrollt'],
  ),
  'log-press': e(
    'Log Press',
    ['Log-Drücken', 'Strongman Log Press'],
    [
      'Nutze einen Strongman-Log mit innen liegenden Neutralgriffen und eine freie Hebefläche. Bring ihn mit einem geübten Log-Clean oder von passenden Ablagen in eine stabile Front-Rack-Position und spann mit etwa schulterbreiten Füßen an.',
      'Oberkörper aufrecht, ein kurzes Stück in die Knie gehen, dann über die Beine treiben und den Log mit Handflächen zueinander über den Kopf drücken.',
      'Schließ mit gestreckten Armen und Knien ab, der Log balanciert über Schultern und Fußmitte. Nicht über die Lendenwirbelsäule zurücklehnen.',
      'Senke kontrolliert ins Front-Rack und fang mit den Knien ab. Vor dem nächsten Drücken neu ansetzen und den Log auf geübte Weise ablegen. Jedes Drücken über Kopf ist eine Wiederholung.',
    ],
    [
      'Innere Griffe fest greifen',
      'Senkrecht absenken und treiben',
      'Mit dem Log balanciert über dem Kopf abschließen',
    ],
    [
      'Aus einem instabilen Front-Rack drücken',
      'Weit zurücklehnen, statt unter den Log zu gehen',
      'Den Log ohne freie Landefläche fallen lassen',
    ],
  ),
  'lying-leg-curl': e(
    'Liegender Beinbeuger',
    ['Beinbeuger liegend', 'Leg Curl', 'Beincurl'],
    [
      'Leg dich bäuchlings hin, das Polster knapp über den Fersen.',
      'Zieh die Fersen Richtung Gesäß.',
      'Langsam bis zur vollen Dehnung absenken.',
    ],
    ['Hüfte bleibt am Polster', 'Langsame Negative'],
    ['Die Hüfte heben, um das Gewicht hochzuschwingen'],
  ),
  'lying-leg-raise': e(
    'Beinheben im Liegen',
    ['Liegendes Beinheben', 'Leg Raise am Boden'],
    [
      'Leg dich auf den Rücken, Kopf und Schulterblätter abgelegt, Arme neben der Hüfte, Handflächen unten. Bauch fest, unterer Rücken sanft am Boden.',
      'Heb beide Beine gemeinsam mit locker gestreckten Knien. Kurz vor der Senkrechten das Becken sanft zu den Rippen rollen, ohne zu schwingen.',
      'Senke langsam nur so weit, wie der Rücken stabil bleibt. Beuge die Knie oder verkürze den Weg nach unten, wenn der untere Rücken ins Hohlkreuz geht.',
    ],
    ['Kopf und Schultern abgelegt', 'Unterer Rücken stabil', 'Den Weg nach unten kontrollieren'],
    [
      'Ins Hohlkreuz gehen, wenn die Fersen den Boden erreichen',
      'Die Beine schwingen oder den Kopf zum Ausgleich heben',
    ],
  ),
  'machine-chest-press': e(
    'Brustpresse',
    ['Brustpresse Maschine', 'Chest Press'],
    [
      'Stelle den Sitz so ein, dass die Griffe auf Brustmitte sind.',
      'Drück nach vorn, bis die Arme gestreckt sind, ohne hart durchzustrecken.',
      'Kontrolliert zurück, bis du eine Dehnung spürst.',
    ],
    ['Schulterblätter nach hinten unten', 'Voller Weg, kein Abfedern'],
    ['Sitz zu hoch, dann wird es Schrägdrücken'],
  ),
  'machine-lateral-raise': e(
    'Seitheben an der Maschine',
    ['Seitheben-Maschine', 'Maschinen-Seitheben'],
    [
      'Stelle den Sitz so ein, dass die Schultern mit dem Drehpunkt der Maschine fluchten und die Polster außen an den Oberarmen über den Ellbogen liegen.',
      'Sitz aufrecht, Füße fest, Ellbogen leicht gebeugt. Heb die Oberarme seitlich bis etwa Schulterhöhe.',
      'Senke die Polster langsam, ohne die Gewichte aufeinanderschlagen zu lassen.',
    ],
    [
      'Mit den Oberarmen führen',
      'Schultern weg von den Ohren',
      'Angenehm auf Schulterhöhe abschließen',
    ],
    [
      'Die Schultern hochziehen oder den Oberkörper schwingen',
      'Den Sitz so einstellen, dass der Drehpunkt weit über oder unter den Schultern liegt',
    ],
  ),
  'machine-shrug': e(
    'Shrugs an der Maschine',
    ['Shrug-Maschine', 'Maschinen-Shrugs'],
    [
      'Stell dich in die Shrug-Maschine, Füße fest, und greif die seitlichen Griffe geschlossen. Bewegungsbegrenzer vor dem Beladen einstellen.',
      'Arme gestreckt, Oberkörper ruhig, beide Schultern Richtung Ohren ziehen.',
      'Halte kurz und senke die Schultern kontrolliert in eine angenehme Dehnung.',
    ],
    ['Schultern gerade hoch', 'Ellbogen gestreckt', 'Kopf in Linie mit dem Oberkörper'],
    ['Die Schultern kreisen', 'Die Ellbogen beugen oder mit den Knien wippen'],
  ),
  'machine-triceps-extension': e(
    'Trizepsmaschine',
    ['Trizepsstrecken an der Maschine', 'Armstrecker'],
    [
      'Stelle den Sitz so ein, dass die Oberarme auf dem vorderen Polster liegen und die Ellbogen mit dem Drehpunkt fluchten. Greif beide Griffe mit geraden Handgelenken.',
      'Oberarme bleiben auf dem Polster; streck die Ellbogen, um die Griffe entlang der Maschinenbahn zu bewegen.',
      'Geh langsam zurück in eine angenehme Ellbogenbeugung, ohne die Arme zu heben oder den Block aufschlagen zu lassen.',
    ],
    [
      'Oberarme bleiben auf dem Polster',
      'Aus den Ellbogen bewegen',
      'Abschließen, ohne die Ellbogen durchzuschlagen',
    ],
    [
      'Schultern oder Oberarme heben, um die Griffe zu bewegen',
      'Mit Schwung arbeiten oder die Dehnung unten erzwingen',
    ],
  ),
  'mountain-climbers': e(
    'Mountain Climbers',
    ['Bergsteiger', 'Mountain Climber'],
    [
      'Beginne im hohen Stütz, Hände unter den Schultern, Körper in einer Linie.',
      'Zieh ein Knie Richtung Brust, ohne die Hüfte zu heben, und bring den Fuß zurück, während das andere Knie nach vorn kommt.',
      'Wechsle in einem Tempo, bei dem die Schultern über den Händen und der Rumpf ruhig bleiben. Jedes Knieziehen ist eine Wiederholung.',
    ],
    ['Hüfte waagerecht', 'Schultern über den Händen', 'Jedes Knieziehen kontrollieren'],
    [
      'Mit der Hüfte wippen oder im unteren Rücken durchhängen',
      'So schnell werden, dass Füße und Rumpf die Kontrolle verlieren',
    ],
  ),
  'muscle-up': e(
    'Muscle-up',
    ['Muscle Up an der Stange', 'Bar Muscle-up'],
    [
      'Nutze eine sichere, gerade Stange mit genug Platz über und um sie herum für Übergang und Schwung. Beginne mit geschlossenem Obergriff und aktiven Schultern. Diese Variante nutzt einen kontrollierten Kip.',
      'Bau einen kleinen Schwung von Hohlkörper zu Bogen auf, dann treib die Hüfte und zieh die Stange nah Richtung untere Brust.',
      'Wenn der Oberkörper über die Stange kommt, bring beide Ellbogen gleichzeitig darüber und lehn die Brust nach vorn in einen stabilen Dip an der Stange.',
      'Drück dich in den Stütz mit gestreckten Armen. Kehre den Übergang kontrolliert um und setz den Schwung vor der nächsten Wiederholung neu an. Übe Zug, Übergang und Dip an der Stange erst einzeln.',
    ],
    [
      'Stange im Übergang nah halten',
      'Beide Ellbogen gleichzeitig darüber',
      'Schwung und Absenken kontrollieren',
    ],
    [
      'Einen Ellbogen vor dem anderen überwerfen',
      'Den Übergang ohne starken Klimmzug und Stangen-Dip versuchen',
      'Eine Stange mit zu wenig Platz nach oben oder für den Schwung nutzen',
    ],
  ),
  'neck-curl': e(
    'Nackencurl',
    ['Nackenbeugen liegend', 'Halsbeugen'],
    [
      'Leg dich rücklings auf eine Flachbank, Schulterblätter und Oberkörper abgestützt, Füße fest, Kopf knapp über dem Ende. Ohne Zusatzgewicht beginnen.',
      'Zieh das Kinn sanft ein und heb den Kopf ein kurzes Stück mit der Halsvorderseite. Schultern bleiben auf der Bank.',
      'Senke langsam in eine angenehme Position, ohne den Kopf nach hinten fallen zu lassen. Nutze einen kleinen, schmerzfreien Umfang und stoppe bei Nackenschmerz oder Schwindel.',
    ],
    ['Ohne Zusatzgewicht beginnen', 'Schultern abgestützt', 'Langsam in kleinem Umfang bewegen'],
    [
      'Daraus einen Sit-up machen',
      'In eine tiefe Nackendehnung fallen oder das Kinn nach vorn drücken',
    ],
  ),
  'one-arm-cable-bicep-curl': e(
    'Einarmiger Kabelcurl',
    ['Einarmiger Bizepscurl am Kabel'],
    [
      'Häng einen Griff an einen tiefen Kabelzug und halte ihn in einer Hand, Handfläche nach vorn. Steh stabil zum Gerät, Ellbogen neben den Rippen.',
      'Curle den Griff zur Arbeitsschulter, Oberarm ruhig, Handgelenk gerade. Die freie Hand liegt an der Hüfte oder hängt locker.',
      'Senke langsam fast bis zur Streckung, ohne den Oberkörper zu drehen. Beide Seiten machen und Wiederholungen pro Arm eintragen.',
    ],
    ['Handfläche nach oben', 'Ellbogen neben den Rippen', 'Oberkörper ruhig'],
    [
      'Den Oberkörper drehen, um den Griff zu bewegen',
      'Das Handgelenk beugen oder den Oberarm nach vorn heben',
    ],
  ),
  'one-arm-pull-ups': e(
    'Einarmige Klimmzüge',
    ['Einarmiger Klimmzug', 'One Arm Pull-up'],
    [
      'Nutze eine sichere Stange mit Platz für ein kontrolliertes Absenken. Das ist ein einarmiger Klimmzug ohne Hilfe im Obergriff; entwickle zuerst kontrollierte unterstützte Vorstufen.',
      'Greif mit einer Hand geschlossen und aktiviere die Schulter, Füße frei vom Boden. Die andere Hand bleibt frei, statt Handgelenk oder Stange zu halten.',
      'Zieh den Ellbogen Richtung Rippen, bis das Kinn über der Stange ist, ohne zu kicken. Lass eine kleine, angenehme Körperdrehung zu, statt die Schulterposition zu erzwingen.',
      'Senke kontrolliert bis zum langen Arm, ohne in die Schulter zu fallen. Stoppe, bevor Griff oder Schulterkontrolle versagen. Trainiere beide Seiten und trag Wiederholungen pro Arm ein.',
    ],
    [
      'Arbeitsschulter aktiv',
      'Freie Hand weg von Stange und Handgelenk',
      'Das ganze Absenken kontrollieren',
    ],
    [
      'Plötzlich in einen passiven einarmigen Hang fallen',
      'Kicken oder mit dem Handgelenk unterstützte Wiederholungen als freie zählen',
    ],
  ),
  'one-arm-push-ups': e(
    'Einarmige Liegestütze',
    ['Einarmiger Liegestütz', 'One Arm Push-up'],
    [
      'Setz eine Handfläche fest unter die Brust und stell die Füße für Stabilität deutlich breiter als schulterbreit. Leg die freie Hand auf den Rücken und spann den Rumpf an.',
      'Beuge den Stützellbogen Richtung Rippen, um die Brust kontrolliert zu senken. Hüfte nicht durchhängen lassen; eine kleine natürliche Rumpfdrehung ist in Ordnung.',
      'Drück dich über die Stützhand zurück zum gestreckten Arm, ohne dich stark zu verdrehen. Beide Seiten machen und Wiederholungen pro Arm eintragen. Übe mit der Hand auf einer stabilen Erhöhung, bevor du es am Boden machst.',
    ],
    [
      'Breiter, stabiler Fußstand',
      'Gegen zu viel Drehung anspannen',
      'Arbeitsellbogen nah an den Rippen',
    ],
    [
      'Einen engen Stand nutzen, bevor du die Drehung kontrollierst',
      'Im unteren Rücken durchhängen oder mit der freien Hand drücken',
    ],
  ),
  'one-arm-seated-cable-row': e(
    'Einarmiges Kabelrudern sitzend',
    ['Einarmiges Rudern am Kabel', 'Einarmiges Kabelrudern'],
    [
      'Häng einen Griff an das Ruderkabel. Setz dich mit beiden Füßen fest auf den Fußplatten, Knie leicht gebeugt, Brust aufrecht. Halte den Griff in einer Hand im Neutralgriff.',
      'Becken und Oberkörper bleiben gerade, während du den Arbeitsellbogen zur Hüfte und den Griff zu den unteren Rippen ziehst. Die freie Hand liegt auf dem Oberschenkel.',
      'Streck den Arm langsam und lass das Schulterblatt angenehm nach vorn gehen, ohne den unteren Rücken rund zu machen. Beide Seiten machen und Wiederholungen pro Arm eintragen.',
    ],
    [
      'Oberkörper gerade',
      'Ellbogen zur Hüfte ziehen',
      'Das Schulterblatt kontrolliert mitgehen lassen',
    ],
    [
      'Den Oberkörper verdrehen oder schaukeln, um den Block zu bewegen',
      'Die Schulter hochziehen oder den unteren Rücken rund machen',
    ],
  ),
  'overhead-press': e(
    'Schulterdrücken stehend',
    ['Military Press', 'Überkopfdrücken', 'OHP'],
    [
      'Nimm die Stange auf Schlüsselbeinhöhe, schulterbreiter Griff.',
      'Spann die Körpermitte an und drück das Gesäß zusammen.',
      'Drück über den Kopf, nimm den Kopf leicht zurück und bring ihn oben wieder durch.',
    ],
    ['Rippen unten', 'Stange nah am Gesicht', 'Mit der Stange über den Ohren abschließen'],
    ['Sich zurücklehnen, sodass es ein Schrägdrücken wird'],
  ),
  'overhead-squat': e(
    'Überkopfkniebeuge',
    ['Overhead Squat', 'OHS'],
    [
      'Lerne mit Stab oder leichter Stange auf freier Fläche und übe einen sicheren Ausstieg, bevor du belädst. Nimm einen breiten Reißgriff und bring die Stange mit einer Technik über den Kopf, die du schon beherrschst.',
      'Stell die Füße in einen angenehmen Kniebeugestand. Spann an und stütz die Stange aktiv über der Fußmitte mit gestreckten Ellbogen.',
      'Geh langsam in die Hocke, ganzer Fuß am Boden, Knie folgen den Zehen. Geh nur so tief, wie die Stange über dem Kopf balanciert bleibt.',
      'Steh mit derselben Überkopfspannung auf. Leg die Stange mit deiner geübten Technik sicher ab; brich den Satz ab, wenn die Ellbogen nachgeben oder die Balance verloren geht.',
    ],
    [
      'Stange über der Fußmitte balancieren',
      'Aktiv in die Stange drücken',
      'Ganzer Fuß bleibt am Boden',
    ],
    [
      'Tiefe erzwingen, während die Stange nach vorn wandert',
      'Die Ellbogen beugen oder mehr laden als über Kopf kontrollierbar',
    ],
  ),
  'overhead-triceps-extension': e(
    'Trizepsstrecken über Kopf',
    ['French Press', 'Überkopf-Trizepsdrücken', 'Kabel-Trizepsstrecken über Kopf'],
    [
      'Dreh dich vom tiefen Kabelzug weg oder halte eine Kurzhantel über dem Kopf.',
      'Oberarme neben den Ohren, senke hinter den Kopf.',
      'Streck zurück bis gerade.',
    ],
    ['Oberarme bleiben, wo sie sind', 'Unten tief dehnen'],
    ['Die Ellbogen weit ausstellen'],
  ),
  'pec-deck': e(
    'Butterfly',
    ['Butterfly-Maschine', 'Pec Deck', 'Maschinen-Flys'],
    [
      'Stelle den Sitz so ein, dass die Griffe auf Brusthöhe sind.',
      'Führ die Polster vor dir zusammen.',
      'Geh zurück, bis du eine Dehnung spürst, ohne das Gewicht abzulegen.',
    ],
    ['Brust aufrecht', 'Beim Zusammendrücken kurz halten'],
    ['Am Ende jeder Wiederholung die Schultern hochziehen'],
  ),
  'pike-push-up': e(
    'Pike-Liegestütz',
    ['Pike Push-up', 'Hechtliegestütz'],
    [
      'Beginne auf Händen und Füßen, Hände etwa schulterbreit. Heb die Hüfte zu einem umgedrehten V, Kopf zwischen den Oberarmen.',
      'Beuge die Ellbogen nach hinten und senke den Kopf zu einem Punkt knapp vor den Händen, Hüfte bleibt hoch.',
      'Drück den Boden weg, bis die Arme gestreckt sind, zurück ins umgedrehte V. Kopf bleibt vom Boden weg.',
    ],
    ['Hüfte hoch', 'Ellbogen schräg nach hinten', 'Kopfbahn vor den Händen kontrollieren'],
    [
      'Die Hüfte zu einem normalen Liegestütz absenken',
      'Körpergewicht auf den Kopf legen oder die Ellbogen weit ausstellen',
    ],
  ),
};
