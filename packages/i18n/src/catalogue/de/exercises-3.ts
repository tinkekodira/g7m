import { exercise as e } from '../entry.js';
import type { ExerciseText } from '../types.js';

export const exercises3: Readonly<Record<string, ExerciseText>> = {
  'pistol-squat': e(
    'Pistol Squat',
    ['Einbeinige Kniebeuge', 'Pistol'],
    [
      'Steh auf einem Bein, das andere Bein vorne gestreckt, Arme nach vorn. Der Standfuß bleibt ganz am Boden.',
      'Beuge Knie und Hüfte des Standbeins und geh langsam in die Hocke, das freie Bein bleibt vom Boden weg. Nur so tief, wie du mit Ferse am Boden kontrollierst.',
      'Drück dich über den Standfuß ohne Abfedern hoch. Beide Seiten machen und Wiederholungen pro Bein eintragen. Übe mit stabiler Handstütze, bis Balance und Tiefe sicher sind.',
    ],
    ['Ganzer Standfuß am Boden', 'Knie folgt den Zehen', 'Kontrollierter Bewegungsumfang'],
    [
      'Das Knie nach innen fallen lassen',
      'Schnell fallen und unten abfedern',
      'Tiefe erzwingen, indem die Ferse hochgeht',
    ],
  ),
  plank: e(
    'Unterarmstütz',
    ['Plank', 'Planke', 'Brett'],
    [
      'Setz die Unterarme unter den Schultern auf den Boden.',
      'Spann an, damit der Körper eine gerade Linie bildet.',
      'Halte und atme gleichmäßig.',
    ],
    ['Gesäß anspannen', 'Rippen unten, nicht durchhängen'],
    ['Auf Zeit halten mit durchhängendem unteren Rücken'],
  ),
  'preacher-curl': e(
    'Scott-Curl (SZ-Stange)',
    ['Scott-Curl SZ', 'Scottcurl', 'Preacher Curl'],
    [
      'Stelle das Polster so ein, dass die Achseln auf der oberen Kante liegen.',
      'Greif die SZ-Stange an den schrägen Griffen und curle hoch, kurz vor der Senkrechten stoppen, um Spannung zu halten.',
      'Senke langsam, bis die Arme fast gestreckt sind.',
    ],
    ['Ellbogen bleiben auf dem Polster', 'Die Dehnung unten kontrollieren'],
    ['Das Gewicht unten fallen lassen, das belastet den Ellbogen'],
  ),
  'preacher-curl-machine': e(
    'Scott-Curl (Maschine)',
    ['Scott-Curl-Maschine', 'Bizepsmaschine', 'Curlmaschine'],
    [
      'Stelle den Sitz so ein, dass die Rückseiten der Oberarme flach auf dem Polster liegen und die Achseln an der oberen Kante sind.',
      'Greif die Griffe im Untergriff und curle Richtung Schultern.',
      'Senke langsam, bis die Arme fast gestreckt sind, ohne den Block abzulegen.',
    ],
    ['Oberarme bleiben auf dem Polster', 'Oben anspannen', 'Langsam absenken'],
    [
      'Die Ellbogen vom Polster heben, um die Wiederholung zu beenden',
      'Das Gewicht unten fallen lassen, das belastet den Ellbogen',
    ],
  ),
  'pull-up': e(
    'Klimmzug',
    ['Klimmzüge', 'Pull-up', 'Breiter Klimmzug'],
    [
      'Häng dich im Obergriff an die Stange, Hände außerhalb der Schulterbreite.',
      'Zieh die Brust zur Stange, mit den Ellbogen führend.',
      'Senke ab, bis die Arme ganz gestreckt sind.',
    ],
    ['Brust zur Stange', 'Schultern weg von den Ohren'],
    ['Kippen, wenn das Ziel Kraft ist', 'Auf halbem Weg nach unten stoppen'],
  ),
  'push-up': e(
    'Liegestütz',
    ['Liegestütze', 'Push-up'],
    [
      'Setz die Hände etwas breiter als schulterbreit.',
      'Spann die Körpermitte an, damit der Körper eine gerade Linie bildet.',
      'Senke die Brust bis knapp über den Boden und drück wieder hoch.',
    ],
    ['Gesäß anspannen', 'Ellbogen nach hinten, nicht ausgestellt'],
    ['Die Hüfte durchhängen lassen', 'Vor dem Boden stoppen'],
  ),
  'rear-delt-fly': e(
    'Reverse Flys',
    ['Vorgebeugtes Seitheben', 'Reverse Fly', 'Hintere Schulter Kurzhantel'],
    [
      'Beug dich in der Hüfte vor, Rücken gerade.',
      'Lass die Kurzhanteln mit leicht gebeugten Ellbogen hängen.',
      'Heb seitlich, mit den Ellbogen führend.',
    ],
    ['Daumen leicht nach unten', 'Schulterblätter nicht stark zusammenpressen'],
    ['Den oberen Trapez arbeiten lassen und daraus Shrugs machen'],
  ),
  'rear-delt-fly-machine': e(
    'Reverse Flys (Maschine)',
    ['Reverse Butterfly', 'Butterfly reverse', 'Maschine hintere Schulter'],
    [
      'Setz dich mit der Brust ans Polster zur Maschine und stelle den Sitz so ein, dass die Griffe auf Schulterhöhe sind.',
      'Greif mit leicht gebeugten Ellbogen und führ die Griffe nach außen und hinten, bis die Arme in Linie mit dem Körper sind.',
      'Langsam zurück, bis sich die Griffe fast treffen, ohne den Block abzulegen.',
    ],
    ['Mit den Ellbogen führen', 'Brust bleibt am Polster', 'Langsam zurück'],
    [
      'Die Schultern hochziehen, dann arbeitet der obere Trapez',
      'Sich vom Polster zurücklehnen, um das Gewicht zu schwingen',
    ],
  ),
  'recumbent-bike': e(
    'Liegeergometer',
    ['Sitzrad', 'Liegerad'],
    [
      'Schieb den Sitz so, dass das Bein am Ende des Tritts fast gestreckt ist.',
      'Lehn dich an und halte einen gleichmäßigen Rhythmus.',
      'Erhöhe die Stufe statt des Tempos, wenn es leicht wird.',
    ],
    ['Rücken an der Lehne', 'Runde Tritte, nicht stampfen'],
    ['So nah sitzen, dass die Knie oben eingeengt sind'],
  ),
  'romanian-deadlift': e(
    'Rumänisches Kreuzheben',
    ['RDL', 'Kreuzheben mit gestreckten Beinen', 'Romanian Deadlift'],
    [
      'Steh aufrecht, die Stange auf Hüfthöhe.',
      'Schieb die Hüfte nach hinten und lass die Stange an den Oberschenkeln hinabgleiten.',
      'Stoppe, wenn die Beinbeuger voll gedehnt sind, und treib die Hüfte nach vorn.',
    ],
    [
      'In der Hüfte beugen, keine Kniebeuge',
      'Knie locker, nicht gestreckt',
      'Stange bleibt an den Beinen',
    ],
    ['Die Knie so stark beugen, dass es Kreuzheben wird', 'Den oberen Rücken rund machen'],
  ),
  'rowing-machine': e(
    'Rudergerät',
    ['Rudern', 'Ruderergometer', 'Concept2'],
    [
      'Schnall die Füße an, Gurt über der breitesten Stelle des Fußes.',
      'Drück mit den Beinen, lehn dich leicht zurück und zieh dann den Griff zu den Rippen.',
      'Zurück in umgekehrter Reihenfolge: Arme, Körper, dann Beine.',
    ],
    ['Beine, Körper, Arme, und zurück', 'Nach vorn doppelt so lang wie beim Zug'],
    [
      'Mit den Armen ziehen, bevor die Beine fertig sind',
      'Die Klappe auf 10 stellen, weil es sich härter anfühlt',
    ],
  ),
  'russian-twists': e(
    'Russian Twists',
    ['Russian Twist', 'Rumpfdrehung sitzend'],
    [
      'Setz dich mit gebeugten Knien, Fersen leicht am Boden. Lehn dich mit langer Wirbelsäule etwas zurück und falte die Hände vor der Brust.',
      'Dreh Brust und Schultern zu einer Seite, Hüfte und Knie bleiben nach vorn gerichtet.',
      'Zurück durch die Mitte und zur anderen Seite drehen. Angenehmer Umfang, jede Seite zählt als eine Wiederholung. Ohne Zusatzgewicht beginnen.',
    ],
    ['Die Brust mit den Händen drehen', 'Wirbelsäule lang', 'Hüfte nach vorn'],
    ['Nur die Arme schwingen', 'Den unteren Rücken rund machen oder die Drehung erzwingen'],
  ),
  'scissor-kicks': e(
    'Scherenschläge',
    ['Schere', 'Beinschere', 'Scissor Kicks'],
    [
      'Leg dich auf den Rücken, Arme neben dir. Bauch anspannen und die Beine auf eine Höhe heben, bei der der untere Rücken stabil bleibt.',
      'Knie locker gestreckt, abwechselnd ein Bein hoch, das andere runter, in einer kleinen senkrechten Scherenbewegung.',
      'Atme gleichmäßig und beende den Satz, bevor der Rücken ins Hohlkreuz geht. Jede Wechselbewegung zählt als eine Wiederholung.',
    ],
    [
      'Unterer Rücken stabil',
      'Kleine, kontrollierte Schere',
      'Beine höher, wenn der Rücken ins Hohlkreuz geht',
    ],
    [
      'Die Beine zu tief senken, um die Rumpfkontrolle zu halten',
      'Die Luft anhalten oder die Beine schnell schwingen',
    ],
  ),
  'seated-cable-row': e(
    'Kabelrudern sitzend',
    ['Kabelrudern', 'Rudern am Kabelzug', 'Tiefes Rudern'],
    [
      'Setz dich an den tiefen Kabelzug, Füße auf der Plattform, Knie leicht gebeugt.',
      'Zieh den Griff zum Bauchnabel, Ellbogen nah am Körper.',
      'Zurück in die volle Dehnung, ohne den Rücken rund zu machen.',
    ],
    ['Brust aufrecht', 'An den Rippen anspannen'],
    ['Den Oberkörper vor und zurück schaukeln, um das Gewicht zu bewegen'],
  ),
  'seated-calf-raise': e(
    'Wadenheben sitzend',
    ['Sitzendes Wadenheben', 'Soleus-Heben'],
    [
      'Setz dich mit dem Polster auf den unteren Oberschenkeln, Fußballen auf der Plattform.',
      'Lass die Fersen für eine Dehnung sinken.',
      'Geh auf die Zehen und spann an.',
    ],
    ['Gebeugte Knie verlagern die Arbeit auf den Schollenmuskel', 'Langsam und voller Umfang'],
    ['Einen Bewegungsumfang von zwei Zentimetern nutzen'],
  ),
  'seated-dip-machine': e(
    'Dip-Maschine sitzend',
    ['Dip-Maschine', 'Trizeps-Dips an der Maschine'],
    [
      'Stelle den Sitz so ein, dass du die Griffe neben der Hüfte mit gebeugten Ellbogen und geraden Handgelenken greifst. Rücken am Polster, Füße fest.',
      'Ellbogen nah am Körper, drück die Griffe nach unten, bis die Arme fast gestreckt sind.',
      'Langsam zurück in eine angenehme Ellbogenbeugung, ohne die Schultern hochzuziehen oder den Block aufschlagen zu lassen.',
    ],
    ['Rücken am Polster', 'Über die Ellbogen drücken', 'Schultern tief'],
    [
      'Nach vorn lehnen oder vom Sitz abheben, um den Block zu bewegen',
      'Die Ellbogen ausstellen oder durchschlagen',
    ],
  ),
  'seated-leg-curl': e(
    'Sitzender Beinbeuger',
    ['Beinbeuger sitzend', 'Sitzender Beincurl'],
    [
      'Stelle das Oberschenkelpolster fest und das Fußpolster knapp über den Fersen ein.',
      'Zieh die Beine so weit wie möglich nach unten und hinten.',
      'Kontrolliert zurück.',
    ],
    ['Oberschenkel ins Polster drücken', 'Unten kurz halten'],
    ['Das Gewicht hochschnellen lassen'],
  ),
  'seated-row-machine': e(
    'Rudermaschine',
    ['Rudern an der Maschine', 'Brustgestütztes Rudern Maschine', 'Sitzendes Rudern'],
    [
      'Stelle den Sitz so ein, dass die Griffe auf Höhe der unteren Brust sind, und lehn dich ans Polster.',
      'Zieh die Griffe zurück und treib die Ellbogen hinter die Rippen.',
      'Lass sie in die volle Dehnung zurück, ohne das Polster zu verlassen.',
    ],
    ['Brust bleibt am Polster', 'Schulterblätter zusammenziehen'],
    ['Die Brust vom Polster lösen, um die letzten Wiederholungen hochzuwuchten'],
  ),
  'shoulder-press-machine': e(
    'Schulterpresse',
    ['Schulterdrücken an der Maschine', 'Maschinen-Schulterdrücken'],
    [
      'Wähle ein handhabbares Gewicht; bei Scheibenbeladung beide Seiten gleich beladen. Stelle den Sitz so ein, dass die Griffe etwa auf Schulterhöhe starten und du sie ohne Strecken erreichst.',
      'Setz dich mit Hüfte und oberem Rücken an die Polster, Füße flach am Boden. Spann den Bauch an, Rippen über der Hüfte.',
      'Greif die Griffe voll. Handgelenke gerade, Ellbogen leicht vor dem Oberkörper, Unterarme folgen der Griffrichtung.',
      'Atme aus und drück die Griffe entlang der Maschinenbahn nach oben. Rücken am Polster, Arme strecken, ohne die Ellbogen durchzuschlagen.',
      'Atme beim langsamen Absenken ein, bis zur Startposition oder so tief, wie du angenehm kontrollierst. Schultern stabil, unten nicht abfedern.',
      'Wiederhole mit gleichem Umfang und Tempo. Nach der letzten Wiederholung die Griffe sanft an die Anschläge zurückführen, bevor du loslässt.',
    ],
    [
      'Rücken am Polster, Rippen unten',
      'Handgelenke gerade, Ellbogen unter den Griffen',
      'Gleichmäßig drücken, kontrolliert ablassen',
      'Angenehmer Umfang, keine erzwungene Tiefe',
    ],
    [
      'Den Sitz zu tief oder zu hoch einstellen, sodass die Griffe weit unter oder über Schulterhöhe starten',
      'Ins Hohlkreuz gehen und vom Polster abheben, um zu viel Gewicht zu bewegen',
      'Unten abfedern oder oben die Ellbogen durchschlagen',
      'Die Handgelenke abknicken oder die Griffe unter eine angenehme Schulterposition zwingen',
    ],
  ),
  'single-arm-dumbbell-row': e(
    'Einarmiges Kurzhantelrudern',
    ['KH-Rudern', 'Einarmiges Rudern', 'Kurzhantelrudern'],
    [
      'Leg eine Hand und das gleichseitige Knie auf eine Bank.',
      'Lass die Kurzhantel hängen und rudere sie zur Hüfte.',
      'Senke bis zur vollen Dehnung ab.',
    ],
    ['Zur Hüfte rudern, nicht zur Schulter', 'Den Oberkörper nicht drehen'],
    ['Den Körper verdrehen, um das Gewicht hochzuwuchten'],
  ),
  'sissy-squat': e(
    'Sissy Squat',
    ['Sissy-Kniebeuge'],
    [
      'Steh etwa hüftbreit, Arme zur Balance nach vorn. Ohne Gewicht beginnen und beim Lernen eine sichere Handstütze nutzen.',
      'Geh auf die Fußballen und beuge die Knie nach vorn, während Oberkörper und Oberschenkel gemeinsam nach hinten kippen. Hüfte bleibt gestreckt, statt nach hinten zu sitzen.',
      'Senke nur in einem angenehmen, kontrollierten Kniewinkel ab und streck die Knie, um dich aufzurichten. Flach beginnen und stoppen, wenn die Knie schmerzen.',
    ],
    [
      'Hüfte gestreckt',
      'Oberkörper und Oberschenkel gemeinsam bewegen',
      'Zuerst flach und kontrolliert',
    ],
    [
      'Die Hüfte nach hinten setzen wie bei einer normalen Kniebeuge',
      'In tiefe Kniebeugung federn oder die Balance auf dem Vorfuß verlieren',
    ],
  ),
  'ski-erg': e(
    'Ski-Ergometer',
    ['SkiErg', 'Ski-Zug', 'Langlauf-Ergometer'],
    [
      'Steh aufrecht zum Gerät, in jeder Hand einen Griff.',
      'Beuge dich in der Hüfte und treib die Griffe nach unten an den Oberschenkeln vorbei.',
      'Lass die Arme wieder hochgehen, während du dich aufrichtest.',
    ],
    ['Hüftbeuge, keine Kniebeuge', 'Mit den Händen hinter der Hüfte abschließen'],
    ['Die Knie tief beugen und daraus eine Kniebeuge machen'],
  ),
  'skull-crusher': e(
    'Stirndrücken',
    ['Skull Crusher', 'Liegendes Trizepsdrücken', 'French Press liegend'],
    [
      'Leg dich auf eine Flachbank, eine SZ-Stange über der Brust.',
      'Oberarme ruhig, Ellbogen beugen und Richtung Stirn absenken.',
      'Streck wieder hoch, ohne die Ellbogen nach vorn wandern zu lassen.',
    ],
    ['Oberarme bleiben, wo sie sind', 'Hinter den Kopf senken, nicht zur Nase'],
    [
      'Mit schwingenden Ellbogen ein Drücken daraus machen',
      'So schwer nehmen, dass die Schultern übernehmen',
    ],
  ),
  'smith-machine-bench-press': e(
    'Bankdrücken an der Multipresse',
    ['Multipresse Bankdrücken', 'Smith Bankdrücken'],
    [
      'Stelle eine Flachbank mittig unter die Stange der Multipresse, sodass sie zur Brustmitte führt. Stelle die Sicherheitsstopps knapp unter deiner tiefsten Position ein und prüf die Bahn mit leerer Stange.',
      'Leg dich hin, Füße fest, Hüfte auf der Bank, Schulterblätter sanft nach hinten unten. Greif etwas breiter als schulterbreit mit geraden Handgelenken.',
      'Dreh die Stange, um die Haken zu lösen. Senke langsam zur Brustmitte, Unterarme in Linie mit der Stange, Ellbogen unter Schulterhöhe.',
      'Drück gleichmäßig entlang der Schienen, ohne abzufedern oder die Hüfte zu heben. Strecke die Arme, ohne die Ellbogen durchzuschlagen.',
      'Schließ kontrolliert ab, dreh die Stange auf beide Haken und prüf den sicheren Halt, bevor du loslässt.',
    ],
    [
      'Schulterblätter nach hinten unten',
      'Füße fest, Hüfte auf der Bank',
      'Kontrolliert absenken',
      'Beide Haken prüfen, bevor du loslässt',
    ],
    [
      'Die Bank so stellen, dass die feste Bahn die Stange zum Hals führt',
      'Die Ellbogen ausstellen oder die Handgelenke abknicken',
      'Von der Brust abfedern oder die Hüfte heben',
      'Die Sicherheitsstopps weglassen oder eine ungesicherte Stange loslassen',
    ],
  ),
  'smith-machine-bulgarian-split-squat': e(
    'Bulgarische Kniebeuge an der Multipresse',
    ['Multipresse Bulgarian Split Squat', 'Smith Split Squat'],
    [
      'Stelle eine stabile Bank hinter die Multipresse und die Sicherheitsstopps unter deine geplante Tiefe. Leg die Stange auf den oberen Rücken und teste den Stand mit leerer Stange.',
      'Leg den Fußrücken eines Fußes hinter dir auf die Bank, Füße auf getrennten, hüftbreiten Spuren. Setz den vorderen Fuß so weit nach vorn, dass du entlang der Schienen angenehm in die Hocke kommst.',
      'Häng die Stange aus, spann an und beuge vorderes Knie und Hüfte, um kontrolliert abzusenken. Das meiste Gewicht bleibt auf dem vorderen Bein.',
      'Drück dich über den vorderen Fuß hoch. Mach die Wiederholungen einer Seite, häng sicher ein und wechsle dann. Wiederholungen pro Bein eintragen.',
    ],
    [
      'Vorderer Fuß bleibt fest',
      'Becken waagerecht',
      'Die feste Stangenbahn vor dem Beladen prüfen',
    ],
    [
      'Mit dem hinteren Bein drücken',
      'Den vorderen Fuß so setzen, dass die Schienen Knie oder Hüfte in eine unangenehme Position zwingen',
      'Die Sicherheitsstopps weglassen',
    ],
  ),
  'smith-machine-incline-bench-press': e(
    'Schrägbankdrücken an der Multipresse',
    ['Multipresse Schrägbank', 'Smith Schrägbankdrücken'],
    [
      'Stelle eine verstellbare Bank auf eine leichte Schräge von etwa 30 bis 45 Grad und mittig unter die Stange. Positioniere sie so, dass die Stange zur oberen Brust führt. Sicherheitsstopps knapp unter deiner tiefsten Position einstellen und die Bahn mit leerer Stange prüfen.',
      'Leg dich hin, Kopf, oberer Rücken und Hüfte abgestützt, beide Füße fest. Zieh die Schulterblätter sanft nach hinten unten. Greif geschlossen etwas breiter als schulterbreit mit geraden Handgelenken.',
      'Dreh die Stange, um die Haken zu lösen. Senke langsam zur oberen Brust, Unterarme in Linie mit der Stange, Ellbogen unter Schulterhöhe. Stoppe in einer Tiefe, die du angenehm kontrollierst.',
      'Drück gleichmäßig entlang der Schienen, Schultern und Hüfte an der Bank. Strecke die Arme, ohne die Ellbogen durchzuschlagen.',
      'Nach der letzten Wiederholung die Stange auf beide Haken drehen und den sicheren Halt prüfen, bevor du loslässt.',
    ],
    [
      'Leichte Schräge',
      'Schulterblätter nach hinten unten',
      'Kontrolliert zur oberen Brust senken',
      'Beide Haken prüfen, bevor du loslässt',
    ],
    [
      'Die Bank so stellen, dass die feste Bahn die Stange zu Hals oder Gesicht führt',
      'Die Ellbogen ausstellen oder die Handgelenke abknicken',
      'Hüfte oder Schultern von der Bank heben oder unten abfedern',
      'Die Sicherheitsstopps weglassen oder eine ungesicherte Stange loslassen',
    ],
  ),
  'smith-machine-shrug': e(
    'Shrugs an der Multipresse',
    ['Multipresse Shrugs', 'Smith Shrugs'],
    [
      'Stelle die Stange etwa auf Höhe der Oberschenkelmitte ein, Sicherheitsstopps knapp darunter. Prüf Hakenrichtung und Stangenbahn, bevor du belädst.',
      'Steh zur Stange, Füße etwa hüftbreit. Greif im Obergriff knapp außerhalb der Oberschenkel, richte dich auf und löse die Haken.',
      'Arme gestreckt, Schultern Richtung Ohren ziehen, ohne zu kreisen, den Kopf vorzuschieben oder dich zurückzulehnen.',
      'Halte oben kurz und senke die Schultern langsam in eine angenehme Dehnung. Stange nah, Oberkörper ruhig.',
      'Nach der letzten Wiederholung die Stange auf beide Haken drehen und den sicheren Halt prüfen, bevor du loslässt.',
    ],
    [
      'Schultern gerade hoch und runter',
      'Arme bleiben gestreckt',
      'Oben kurz halten',
      'Kopf und Oberkörper ruhig',
    ],
    [
      'Die Schultern kreisen',
      'Die Ellbogen beugen oder mit den Beinen wippen',
      'Den Kopf vorschieben oder sich zurücklehnen',
      'Die Schultern abrupt fallen lassen oder eine ungesicherte Stange loslassen',
    ],
  ),
  'smith-machine-squat': e(
    'Kniebeuge an der Multipresse',
    ['Multipresse Kniebeuge', 'Smith Squat'],
    [
      'Stelle die Stange knapp unter Schulterhöhe und die Sicherheitsstopps knapp unter deine geplante Tiefe. Prüf Stand und Schienenbahn mit leerer Stange.',
      'Leg die Stange auf den oberen Trapez, weg vom Nacken. Greif beidseitig, steh etwa schulterbreit und passe die Fußposition an, damit der ganze Fuß während der ganzen Kniebeuge am Boden bleibt.',
      'Richte dich auf, um die Haken zu lösen. Spann den Bauch an und beuge Knie und Hüfte gemeinsam, Knie in Linie mit den Zehen.',
      'Senke kontrolliert in eine angenehme Tiefe, Wirbelsäule stabil, Fersen unten. Keine tiefere Position erzwingen, indem der untere Rücken rund wird.',
      'Drück dich über den ganzen Fuß hoch, Knie ausgerichtet. Dreh die Stange auf beide Haken und prüf den sicheren Halt, bevor du weggehst.',
    ],
    [
      'Vor jeder Wiederholung anspannen',
      'Ganzer Fuß am Boden',
      'Knie folgen den Zehen',
      'Absenken kontrollieren und Haken prüfen',
    ],
    [
      'Eine Fußposition wählen, die die Fersen hebt oder eine unangenehme Bahn erzwingt',
      'Die Knie nach innen fallen lassen',
      'Den unteren Rücken rund machen oder unten abfedern',
      'Die Stopps weglassen oder weggehen, bevor beide Haken greifen',
    ],
  ),
  'spider-curl-dumbbell': e(
    'Spider Curl (Kurzhanteln)',
    ['Spider Curl Kurzhantel', 'Spider-Curl'],
    [
      'Leg dich bäuchlings auf eine Bank mit etwa 45 Grad, Füße hinten fest. Halte in jeder Hand eine Kurzhantel, Handflächen nach vorn, Oberarme hängen frei neben dem Polster.',
      'Curle beide Kurzhanteln Richtung Schultern, ohne die Oberarme zu bewegen oder die Brust zu heben.',
      'Senke kontrolliert ab, bis die Ellbogen fast gestreckt sind, die Hanteln frei von der Bank.',
    ],
    ['Brust abgestützt', 'Handflächen beim Curlen nach oben', 'Ellbogen unter den Schultern'],
    ['Die Oberarme bewegen, um die Hanteln zu schwingen', 'Die Ellbogen am Polster abstützen'],
  ),
  'spider-curl-ez-bar': e(
    'Spider Curl (SZ-Stange)',
    ['Spider Curl SZ', 'Spider-Curl'],
    [
      'Stelle eine Bank auf etwa 45 Grad und leg dich bäuchlings darauf, Füße fest. Greif die SZ-Stange an den schrägen Griffen, Oberarme hängen senkrecht frei vom Polster.',
      'Curle die Stange Richtung Schultern, Brust abgestützt, Oberarme ruhig.',
      'Langsam absenken, bis die Ellbogen fast gestreckt sind. Die Stange bleibt die ganze Zeit frei von der Bank.',
    ],
    ['Brust bleibt am Polster', 'Oberarme frei hängen lassen', 'Ellbogen ruhig'],
    [
      'Die Ellbogen aufs Polster legen wie beim Scott-Curl',
      'Die Schultern schwingen oder die Brust heben',
    ],
  ),
  'spin-bike': e(
    'Spinning-Rad',
    ['Spinning', 'Indoor Cycling', 'Spinningbike'],
    [
      'Stelle den Sattel neben dem Rad stehend auf Hüfthöhe ein.',
      'Stelle den Lenker auf Sattelhöhe oder etwas höher.',
      'Erhöhe den Widerstand am Regler, statt ohne ihn schneller zu treten.',
    ],
    ['Hüfte ruhig im Sattel', 'Widerstand an, bevor du aufstehst'],
    ['Bei hoher Trittfrequenz ohne Widerstand im Sattel hüpfen'],
  ),
  'stair-climber': e(
    'Stepper',
    ['Treppensteiger', 'Stairmaster', 'Treppenmaschine'],
    [
      'Steig auf, während sich die Stufen langsam bewegen, und halte dich an den Griffen.',
      'Lass die Griffe los, sobald du den Rhythmus hast, und steh aufrecht.',
      'Verlangsame die Stufen, bevor du absteigst.',
    ],
    ['Ganzer Fuß auf jeder Stufe', 'Aufrecht stehen, nicht auf die Griffe lehnen'],
    ['Sich auf die Griffe lehnen, das nimmt den Beinen das Gewicht'],
  ),
  'standing-calf-raise': e(
    'Wadenheben stehend',
    ['Wadenheben', 'Stehendes Wadenheben'],
    [
      'Steh mit den Fußballen auf der Plattform.',
      'Lass die Fersen für eine volle Dehnung sinken.',
      'Geh so hoch wie möglich auf die Zehen.',
    ],
    ['Oben und unten kurz halten', 'Voller Umfang, kein Abfedern'],
    ['Aus der Dehnung mit der Sehne statt mit dem Muskel abfedern'],
  ),
  'straight-arm-pulldown': e(
    'Überzüge am Kabel mit gestreckten Armen',
    ['Straight Arm Pulldown', 'Lat-Pushdown', 'Gestreckter Latzug'],
    [
      'Steh vor einem hohen Kabelzug mit gerader Stange oder Seil.',
      'Ellbogen fast gestreckt, leicht nach vorn beugen.',
      'Führ die Stange im Bogen zu den Oberschenkeln und zurück über den Kopf.',
    ],
    ['Ellbogen bleiben fest', 'In der Achsel spüren, nicht im Trizeps'],
    ['Die Ellbogen beugen und daraus ein Trizepsdrücken machen'],
  ),
  'strict-curl': e(
    'Strict Curl',
    ['Wand-Curl', 'Strikter SZ-Curl'],
    [
      'Steh mit oberem Rücken und Hüfte an einer Wand oder festen Stütze, Füße leicht nach vorn. Halte eine SZ-Stange an den schrägen Griffen, Arme gestreckt, Handgelenke gerade.',
      'Rücken und Hüfte bleiben an der Stütze; curle die Stange Richtung Schultern, ohne die Ellbogen nach vorn zu bewegen.',
      'Senke langsam fast bis zur vollen Ellbogenstreckung. Zähl nur Wiederholungen ohne Hüftschwung und ohne Kontaktverlust.',
    ],
    [
      'Rücken und Hüfte an der Stütze',
      'Ellbogen an den Rippen',
      'Ein Gewicht, das du ohne Schwung hebst',
    ],
    [
      'Mit den Knien treiben oder die Hüfte von der Stütze heben',
      'Die Handgelenke beugen, um den Curl zu beenden',
    ],
  ),
  'sumo-deadlift': e(
    'Sumo-Kreuzheben',
    ['Sumo Deadlift', 'Kreuzheben breit'],
    [
      'Steh nah an einer Langhantel am Boden, weiter Stand, Zehen angenehm nach außen. Greif geschlossen im Obergriff innerhalb der Knie.',
      'Spann an, Arme gestreckt, bring die Schienbeine zur Stange, während die Knie den Zehen folgen. Nimm vor dem Heben die Spannung aus der Stange.',
      'Drück dich vom Boden weg und streck Knie und Hüfte gemeinsam, Stange nah an den Beinen. Aufrecht abschließen, ohne dich zurückzulehnen.',
      'Senke kontrolliert ab, Hüfte nach hinten, Knie beugen, wenn die Stange sie passiert. Position und Spannung vor der nächsten Wiederholung neu aufbauen.',
    ],
    ['Hände innerhalb der Knie', 'Stange nah', 'Über den ganzen Fuß drücken'],
    [
      'Die Stange mit gebeugten Armen vom Boden reißen',
      'Die Knie einfallen lassen oder sich oben zurücklehnen',
    ],
  ),
  'sumo-squat': e(
    'Sumo-Kniebeuge',
    ['Sumo Squat', 'Breite Kniebeuge'],
    [
      'Steh breiter als schulterbreit, Zehen in einem angenehmen Winkel nach außen. Hände vor der Brust falten; diese Variante ist mit Körpergewicht.',
      'Beuge Knie und Hüfte, um zwischen die Beine abzusenken, Fersen am Boden, Knie in Linie mit den Zehen.',
      'Stoppe in kontrollierter Tiefe und drück dich über den ganzen Fuß hoch, ohne die Knie hart durchzustrecken.',
    ],
    ['Knie folgen den Zehen', 'Fersen am Boden', 'Zwischen die Hüften absenken'],
    [
      'Einen zu weiten Stand oder Zehenwinkel erzwingen',
      'Die Knie nach innen fallen lassen oder die Fersen heben',
    ],
  ),
  't-bar-row': e(
    'T-Bar-Rudern',
    ['T-Bar Row', 'Landmine-Rudern', 'T-Hantel-Rudern'],
    [
      'Steh breitbeinig über der Stange, ein Ende fest in einer Ecke oder Landmine, und greif eng unter den Scheiben.',
      'Beug dich mit geradem Rücken vor und zieh die Scheiben zur Brust.',
      'Senke kontrolliert bis zur vollen Dehnung ab.',
    ],
    ['Rücken die ganze Zeit gerade', 'Mit den Ellbogen ziehen, nicht mit den Händen'],
    ['Sich aufrichten, wenn der Satz schwer wird', 'Mit dem unteren Rücken reißen'],
  ),
  'trap-bar-deadlift': e(
    'Kreuzheben mit Trap Bar',
    ['Trap-Bar-Kreuzheben', 'Hex-Bar-Kreuzheben'],
    [
      'Steh in der Trap Bar, Füße hüftbreit.',
      'Beuge dich hinunter und greif die Griffe.',
      'Steh auf, indem du den Boden wegdrückst.',
    ],
    ['Brust hoch, bevor du ziehst', 'Den Boden wegdrücken'],
    ['Die Hüfte zuerst hochschießen lassen'],
  ),
  'trap-bar-shrug': e(
    'Shrugs mit Trap Bar',
    ['Hex-Bar-Shrugs', 'Trap-Bar-Shrugs'],
    [
      'Steh in einer beladenen Trap Bar, greif die seitlichen Griffe und heb sie mit angespanntem Rücken und kontrolliertem Beinschub in den Stand.',
      'Arme gestreckt, Oberkörper ruhig, beide Schultern Richtung Ohren ziehen. Oben kurz halten.',
      'Senke die Schultern langsam in eine angenehme Dehnung. Nach dem Satz Hüfte und Knie beugen, um die Stange kontrolliert abzusetzen.',
    ],
    ['Schultern gerade hoch', 'Ellbogen gestreckt', 'Beim Halten angespannt'],
    [
      'Die Schultern kreisen oder die Ellbogen beugen',
      'Die Stange vom Boden reißen oder zum Absetzen den Rücken rund machen',
    ],
  ),
  treadmill: e(
    'Laufband',
    ['Laufen auf dem Laufband', 'Gehen auf dem Laufband', 'Schräglauf'],
    [
      'Steh breitbeinig über dem Band, starte es langsam und steig dann auf.',
      'Steiger Tempo und Steigung in der ersten Minute.',
      'Verlangsame, bevor du auf die seitlichen Trittflächen steigst.',
    ],
    ['Unter der Hüfte aufsetzen, nicht weit vorn', 'Hände von den Griffen, sobald du läufst'],
    [
      'Sich bei Steigung an den Griffen festhalten, das nimmt den Großteil der Arbeit',
      'Von einem laufenden Band absteigen',
    ],
  ),
  'triceps-dip': e(
    'Dips (Trizepsfokus)',
    ['Trizeps-Dips', 'Dips', 'Barrendips aufrecht'],
    [
      'Stütz dich mit gestreckten Armen auf den Holmen.',
      'Oberkörper aufrecht, Ellbogen nach hinten, nah am Körper.',
      'Senke ab, bis die Ellbogen etwa 90 Grad erreichen, und drück zurück bis zur Streckung.',
    ],
    [
      'Brust aufrecht, Körper senkrecht',
      'Ellbogen zeigen gerade nach hinten',
      'Oben ganz strecken',
    ],
    ['Nach vorn lehnen, dann wird es ein Brust-Dip', 'Die Ellbogen seitlich ausstellen'],
  ),
  'triceps-pushdown': e(
    'Trizepsdrücken am Kabel',
    ['Pushdown', 'Trizepsdrücken mit Seil', 'Kabel-Trizepsdrücken'],
    [
      'Stell dich mit Seil oder Stange an einen hohen Kabelzug.',
      'Ellbogen an der Seite, Arme nach unten strecken.',
      'Zurück, bis die Unterarme über die Waagerechte gehen.',
    ],
    ['Ellbogen fixiert', 'Bei voller Streckung anspannen'],
    ['Sich über das Gewicht lehnen und daraus ein Drücken machen'],
  ),
  'turkish-get-up': e(
    'Turkish Get-up',
    ['TGU', 'Türkisches Aufstehen', 'Kettlebell Get-up'],
    [
      'Leg dich auf den Rücken, die Kettlebell senkrecht über der Schulter, gleichseitiges Knie gebeugt.',
      'Roll auf den gegenüberliegenden Ellbogen, dann die Hand, heb die Hüfte und schwing das Bein in den Kniestand.',
      'Steh auf und kehre jeden Schritt zurück zum Boden um, Blick auf die Kettlebell. Seite wechseln.',
    ],
    [
      'Arm die ganze Zeit gestreckt und senkrecht',
      'Blick auf die Kettlebell',
      'Langsam, ein Schritt nach dem anderen',
    ],
    ['Den Arm wandern oder einknicken lassen', 'Die Übergänge überhasten'],
  ),
  'upright-bike': e(
    'Ergometer',
    ['Fahrradergometer', 'Heimtrainer', 'Fahrrad'],
    [
      'Stelle den Sattel so ein, dass das Knie unten im Tritt leicht gebeugt ist.',
      'Wähle eine Stufe, die du die ganze Einheit halten kannst.',
      'Werde in der letzten Minute langsamer, statt abrupt aufzuhören.',
    ],
    ['Knie über den Füßen', 'Über den ganzen Fuß treten'],
    ['Ein so niedriger Sattel, dass die Knie über die Hüfte kommen'],
  ),
  'viking-press': e(
    'Viking Press',
    ['Viking-Press-Maschine', 'Viking-Schulterdrücken'],
    [
      'Nutze eine eigene Viking-Press-Maschine. Stelle die Startablagen so ein, dass die neutralen Griffe etwa auf Schulterhöhe sind, belade beide Hülsen gleich und prüf die Stopps vor dem Heben.',
      'Steh mit festen Füßen, greif beide Griffe mit Handflächen zueinander und spann den Rumpf an. Heb von den Startablagen ab.',
      'Drück beide Griffe entlang des Hebelbogens nach oben, Beine ruhig, Rippen kontrolliert. Mit gestreckten Armen abschließen, ohne dich zurückzulehnen.',
      'Senke langsam Richtung Schultern und leg die Hebel nach dem Satz sicher in die Ablagen. Diese Variante ist ein striktes Drücken ohne Beinschub; trag das zusätzliche Scheibengewicht einheitlich ein.',
    ],
    ['Beine ruhig', 'Handgelenke über den Unterarmen', 'Beide Hebel sicher ablegen'],
    [
      'Mit den Knien treiben oder ins Hohlkreuz gehen',
      'Die Hülsen ungleich beladen oder die Startablagen verfehlen',
    ],
  ),
  'walking-lunge': e(
    'Gehende Ausfallschritte',
    ['Ausfallschritte', 'Walking Lunges', 'Lunges'],
    [
      'Mach einen Ausfallschritt nach vorn, bis das hintere Knie fast den Boden berührt.',
      'Drück dich über den vorderen Fuß hoch und geh durch.',
      'Wechsle im Satz die Beine ab.',
    ],
    ['Oberkörper aufrecht', 'Langer Schritt für das Gesäß, kurzer für den Quadrizeps'],
    ['Das vordere Knie nach innen fallen lassen'],
  ),
  'wall-sit': e(
    'Wandsitzen',
    ['Wall Sit', 'Stuhl an der Wand'],
    [
      'Steh mit flachem Rücken an einer Wand und geh mit den Füßen nach vorn.',
      'Rutsch nach unten, bis die Oberschenkel etwa parallel zum Boden sind, Knie über den Knöcheln.',
      'Halte und atme gleichmäßig.',
    ],
    ['Rücken flach an der Wand', 'Knie über den Knöcheln, nicht über den Zehen'],
    ['Die Hände auf die Oberschenkel legen, um Gewicht abzugeben'],
  ),
  'wrist-curl-dumbbell': e(
    'Handgelenkcurl (Kurzhantel)',
    ['Handgelenkcurl', 'Unterarmcurl', 'Handgelenkbeugen'],
    [
      'Setz dich auf eine Bank mit leichten Kurzhanteln, Handflächen nach oben. Leg die Unterarme auf die Oberschenkel, Handgelenke knapp über den Knien.',
      'Unterarme abgestützt, die Hände im Handgelenk nach oben curlen, ohne die Ellbogen zu beugen.',
      'Langsam in einem angenehmen Handgelenkumfang absenken und jeden Griff geschlossen halten.',
    ],
    [
      'Unterarme bleiben auf den Oberschenkeln',
      'Nur im Handgelenk bewegen',
      'Kleine, kontrollierte Bewegungen',
    ],
    [
      'Die Unterarme heben oder daraus einen Bizepscurl machen',
      'Schwere Kurzhanteln nutzen oder den Handgelenkumfang erzwingen',
    ],
  ),
};
