import { exercise as e } from '../entry.js';
import type { ExerciseText } from '../types.js';

export const exercises1: Readonly<Record<string, ExerciseText>> = {
  'ab-crunch': e(
    'Crunch',
    ['Bauchpresse', 'Crunches', 'Bauchcrunch'],
    [
      'Leg dich auf den Rücken, Knie gebeugt, Füße flach, Hände neben dem Kopf oder eine Scheibe auf der Brust.',
      'Rolle die Schultern vom Boden, indem du den oberen Rücken rund machst, Rippen Richtung Hüfte.',
      'Halte oben kurz und senke dich kontrolliert ab, bis die Schultern den Boden berühren.',
    ],
    ['Rippen zur Hüfte', 'Unterer Rücken bleibt am Boden', 'Beim Hochkommen ausatmen'],
    ['Mit den Händen am Kopf ziehen', 'Ganz aufsitzen, dann arbeiten vor allem die Hüftbeuger'],
  ),
  'ab-wheel-rollout': e(
    'Ab-Wheel-Rollout',
    ['Bauchroller', 'Ab Wheel', 'Rollout kniend'],
    [
      'Knie dich auf eine bequeme Unterlage, beide Hände am Rad unter den Schultern. Gesäß anspannen, Bauch fest.',
      'Rolle langsam nach vorn und öffne Schultern und Hüfte, Rippen unten, unterer Rücken stabil. Stoppe, bevor du die Position verlierst.',
      'Zieh das Rad mit festem Rumpf zurück zu den Knien. Beginne mit kurzen Rollouts und verlängere sie mit wachsender Kontrolle.',
    ],
    [
      'Rippen unten, Gesäß fest',
      'Stoppen, bevor der untere Rücken ins Hohlkreuz geht',
      'Schultern und Hüfte gemeinsam bewegen',
    ],
    [
      'Weiter rollen, als der Bauch kontrollieren kann',
      'Zum Zurückziehen stark in der Hüfte abknicken',
    ],
  ),
  'air-bike': e(
    'Air Bike',
    ['Assault Bike', 'Echo Bike', 'Luftrad'],
    [
      'Stelle den Sattel wie bei einem normalen Fahrrad ein.',
      'Drück und zieh die Griffe zusammen mit den Pedalen: Je härter du trittst, desto stärker drückt der Lüfter zurück.',
      'Bei Intervallen in der Belastung Vollgas, in der Pause locker weitertreten.',
    ],
    ['Arme und Beine zusammen', 'Beim Drücken ausatmen'],
    ['Ein Intervall mit Vollgas beginnen und nach der Hälfte nichts mehr haben'],
  ),
  'arnold-press': e(
    'Arnold Press',
    ['Arnold-Drücken', 'Kurzhantel-Arnold-Press'],
    [
      'Stell dich hüftbreit hin, Knie locker. Halte die Kurzhanteln vor den Schultern, Handflächen zu dir, Ellbogen gebeugt. Bauch und Gesäß anspannen.',
      'Drück nach oben und drehe dabei die Handflächen gleichmäßig nach vorn, Ellbogen öffnen nach außen. Rippen über dem Becken, kein Schwung aus den Beinen.',
      'Senke langsam ab und drehe zurück, bis die Hanteln wieder vor den Schultern sind. Nutze einen angenehmen Bewegungsumfang, ohne die Drehung zu erzwingen.',
    ],
    ['Beim Drücken gleichmäßig drehen', 'Rippen unten', 'Handgelenke über den Unterarmen'],
    [
      'Ins Hohlkreuz gehen, um das Drücken zu beenden',
      'Die Schultern unten in eine unangenehme Position zwingen',
    ],
  ),
  'back-extension': e(
    'Rückenstrecker',
    ['Hyperextension', 'Rückenstrecken 45 Grad'],
    [
      'Stelle das Polster knapp unter der Hüftbeuge ein.',
      'Beuge dich in der Hüfte nach unten, bis du die Beinbeuger dehnen spürst.',
      'Komm hoch, bis der Körper eine gerade Linie bildet.',
    ],
    ['Bei gerade stoppen, nicht überstrecken', 'Oben das Gesäß anspannen'],
    ['Die Wirbelsäule oben überstrecken'],
  ),
  'barbell-back-squat': e(
    'Kniebeuge mit Langhantel',
    ['Kniebeuge', 'Back Squat', 'Squat'],
    [
      'Lege die Stange auf den oberen Rücken und spann den Rumpf fest an.',
      'Heb die Stange aus, geh zurück und stell die Füße etwas breiter als hüftbreit.',
      'Setz dich zwischen die Hüften, bis die Oberschenkel mindestens parallel sind, dann drück dich hoch.',
    ],
    ['Tief einatmen, anspannen', 'Knie folgen den Zehen', 'Den ganzen Fuß in den Boden drücken'],
    [
      'Die Brust aus der Tiefe nach vorn kippen lassen',
      'Mit steigendem Gewicht weniger tief gehen',
    ],
  ),
  'barbell-bench-press': e(
    'Bankdrücken',
    ['Bank', 'Bankdrücken Langhantel', 'Flachbankdrücken'],
    [
      'Leg dich so hin, dass die Augen unter der Stange sind, Füße flach am Boden.',
      'Greif etwas breiter als schulterbreit und drück die Stange fest.',
      'Heb aus, senke kontrolliert zur Brustmitte und drück wieder hoch.',
    ],
    ['Brust raus', 'Ellbogen etwa 45 Grad', 'Füße in den Boden drücken'],
    ['Die Stange von der Brust abprallen lassen', 'Die Ellbogen gerade zur Seite ausstellen'],
  ),
  'barbell-calf-raise': e(
    'Wadenheben mit Langhantel',
    ['Wadenheben stehend', 'Langhantel-Wadenheben auf Scheibe'],
    [
      'Im Rack mit eingestellten Sicherungen eine stabile, flache Hantelscheibe unter die Fußballen legen, Fersen frei hinter der Kante. Beginne mit leichter Stange auf dem oberen Rücken, unterhalb des Nackens.',
      'Spann an und drück dich über beide Fußballen so hoch, wie du kontrollieren kannst, Knie locker gestreckt.',
      'Halte kurz, dann senke die Fersen langsam in eine angenehme Dehnung, ohne die Scheibe zu kippen oder zu wippen. Leg die Stange ab, bevor du heruntersteigst.',
    ],
    [
      'Vorfüße sicher auf der Scheibe',
      'Gerade über die Sprunggelenke hochdrücken',
      'Dehnung und Spitze kontrollieren',
    ],
    [
      'Auf einer wackelnden oder rutschenden Scheibe balancieren',
      'Unten wippen oder die Knie beugen, um die Stange zu heben',
    ],
  ),
  'barbell-curl': e(
    'Langhantel-Curl',
    ['Bizepscurl', 'LH-Curl', 'Curl mit gerader Stange'],
    [
      'Stell dich hin, die Stange schulterbreit gegriffen, Arme gestreckt.',
      'Curle die Stange auf Schulterhöhe, Ellbogen bleiben an der Seite.',
      'Senke kontrolliert bis zur vollen Streckung.',
    ],
    ['Ellbogen an den Rippen', 'Unten ganz strecken'],
    ['Jede Wiederholung mit Schwung aus der Hüfte beginnen'],
  ),
  'barbell-front-squat': e(
    'Frontkniebeuge',
    ['Front Squat', 'Frontsquat'],
    [
      'Lege die Stange vorn auf die Schultern, Ellbogen hoch.',
      'Geh in die Hocke und halte den Oberkörper aufrecht.',
      'Drück dich hoch, ohne die Ellbogen sinken zu lassen.',
    ],
    ['Ellbogen hoch', 'Brust aufrecht'],
    ['Die Ellbogen fallen lassen, dann kippt die Stange nach vorn'],
  ),
  'barbell-hip-thrust': e(
    'Hip Thrust mit Langhantel',
    ['Hip Thrust', 'Hüftheben', 'Glute Bridge erhöht'],
    [
      'Setz dich mit dem oberen Rücken an eine Bank, die Stange über der Hüfte.',
      'Drück die Hüfte hoch, bis der Oberkörper parallel zum Boden ist.',
      'Senke kontrolliert ab, ohne die Stange auf dem Boden abzulegen.',
    ],
    ['Kinn zur Brust, Rippen unten', 'Oben das Gesäß fest anspannen'],
    ['Oben den unteren Rücken überstrecken, statt mit dem Gesäß abzuschließen'],
  ),
  'barbell-lunge': e(
    'Ausfallschritt mit Langhantel',
    ['Ausfallschritte', 'Lunges mit Langhantel'],
    [
      'Heb eine Stange mit geschlossenem Griff auf den oberen Rücken und spann an. Steh aufrecht, Füße hüftbreit, mit freiem Platz vor dir.',
      'Mach einen Schritt nach vorn auf eine eigene, hüftbreite Spur. Beuge beide Knie kontrolliert, vorderer Fuß bleibt fest, Becken gerade.',
      'Drück dich über den vorderen Fuß zurück in die Ausgangsposition. Wechsle die Seiten oder mach eine Seite fertig und trag die Wiederholungen pro Bein ein.',
    ],
    [
      'Auf zwei Spuren treten',
      'Vorderer Fuß bleibt fest',
      'Zurückkommen kontrollieren, dann nächster Schritt',
    ],
    [
      'Wie auf einem Seil gehen oder das vordere Knie nach innen fallen lassen',
      'Das hintere Knie auf den Boden knallen',
    ],
  ),
  'barbell-preacher-curl': e(
    'Scott-Curl (Langhantel)',
    ['Scott-Curl Langhantel', 'Preacher Curl', 'Scottcurl'],
    [
      'Stelle das Polster so ein, dass die Achseln auf der oberen Kante liegen.',
      'Greif eine gerade Stange schulterbreit im Untergriff und curle sie hoch, kurz vor der Senkrechten stoppen.',
      'Senke langsam ab, bis die Arme fast gestreckt sind.',
    ],
    ['Ellbogen bleiben auf dem Polster', 'Handgelenke gerade, nicht abknicken'],
    [
      'Das Gewicht unten fallen lassen, das belastet den Ellbogen',
      'So viel laden wie bei der SZ-Stange; der gerade Griff ist härter für die Handgelenke',
    ],
  ),
  'barbell-row': e(
    'Langhantelrudern',
    ['Vorgebeugtes Rudern', 'LH-Rudern', 'Pendlay Row'],
    [
      'Beug dich in der Hüfte vor, bis der Oberkörper etwa 45 Grad steht, Rücken gerade.',
      'Zieh die Stange zu den unteren Rippen.',
      'Senke kontrolliert ab, ohne den Rücken rund werden zu lassen.',
    ],
    ['Rücken die ganze Zeit gerade', 'Ellbogen hinter die Rippen'],
    ['Sich aufrichten, wenn der Satz schwer wird', 'Mit dem unteren Rücken reißen'],
  ),
  'barbell-shrug': e(
    'Shrugs mit Langhantel',
    ['Shrugs', 'Schulterheben', 'Nackenheben'],
    [
      'Halte die Stange mit gestreckten Armen vor den Oberschenkeln.',
      'Zieh die Schultern gerade nach oben Richtung Ohren.',
      'Senke kontrolliert bis zur vollen Dehnung.',
    ],
    ['Gerade hoch und runter', 'Oben kurz halten'],
    ['Die Schultern kreisen, das bringt nichts und reizt das Gelenk'],
  ),
  'bench-dips': e(
    'Bankdips',
    ['Dips an der Bank', 'Trizeps-Bankdips'],
    [
      'Setz dich auf die Kante einer stabilen Bank, Hände neben der Hüfte, Finger nach vorn. Füße fest aufstellen und die Hüfte knapp vor die Kante schieben. Zu Beginn Knie gebeugt lassen.',
      'Beuge die Ellbogen nach hinten und senke die Hüfte dicht an der Bank nur so weit, wie es die Schultern angenehm zulassen.',
      'Drück dich über die Handflächen hoch, bis die Arme gestreckt sind. Brust offen halten und stoppen, wenn die Schulterposition unangenehm wird.',
    ],
    ['Hüfte nah an der Bank', 'Schultern tief', 'Nur angenehm tief gehen'],
    [
      'Die Schultern weit unter die Ellbogen sinken lassen',
      'Die Bank rutschen oder die Hüfte weit nach vorn wandern lassen',
    ],
  ),
  'bicycle-crunch': e(
    'Fahrrad-Crunch',
    ['Bicycle Crunch', 'Radfahrer-Crunch'],
    [
      'Leg dich auf den Rücken, Knie gebeugt über der Hüfte, Hände locker neben dem Kopf. Schulterblätter leicht anheben, Bauch fest.',
      'Dreh die Brust zu einem gebeugten Knie und streck das andere Bein. Die Schulter kommt zum Knie, ohne am Kopf zu ziehen.',
      'Wechsle langsam die Seiten, unterer Rücken stabil. Jede Seite zählt als eine Wiederholung.',
    ],
    [
      'Die Brust drehen, nicht nur den Ellbogen',
      'Hände nur leicht am Kopf',
      'Das Bein nur so tief strecken, wie du es kontrollierst',
    ],
    [
      'Mit den Händen den Nacken nach vorn ziehen',
      'Schnell strampeln, ohne den Oberkörper zu drehen',
    ],
  ),
  'box-squat': e(
    'Box Squat',
    ['Kniebeuge auf Box', 'Box-Kniebeuge'],
    [
      'Stelle eine stabile Box hinter dich in ein Rack mit Sicherungen. Wähle eine Höhe, die du kontrolliert erreichst. Heb die Stange auf den oberen Rücken und nimm deinen Stand ein.',
      'Spann an, beuge Hüfte und Knie und setz dich nach hinten zur Box, Füße fest, Knie folgen den Zehen.',
      'Setz sanft auf und halte kurz, Rumpfspannung und Druck in den Füßen bleiben.',
      'Drück dich über beide Füße hoch, ohne nach vorn zu schaukeln oder von der Box abzufedern.',
    ],
    [
      'Sanft und kontrolliert absetzen',
      'Auf der Box angespannt bleiben',
      'Ohne Schaukeln aufstehen',
    ],
    [
      'Auf die Box plumpsen oder den unteren Rücken entspannen',
      'Eine instabile oder zu niedrige Box nutzen',
    ],
  ),
  'bulgarian-split-squat': e(
    'Bulgarische Kniebeuge',
    ['Bulgarian Split Squat', 'Split Squat', 'Bulgaren'],
    [
      'Leg den hinteren Fuß auf eine Bank hinter dir.',
      'Senke dich ab, bis der vordere Oberschenkel etwa parallel ist.',
      'Drück dich über den vorderen Fuß hoch.',
    ],
    ['Gewicht auf der vorderen Ferse', 'Oberkörper leicht vor für das Gesäß'],
    ['Zu nah an der Bank stehen, dann wird das vordere Knie eingeengt'],
  ),
  burpees: e(
    'Burpees',
    ['Burpee', 'Liegestütz-Strecksprung'],
    [
      'Steh etwa schulterbreit. Geh in die Hocke und setz beide Handflächen fest vor dir auf den Boden.',
      'Spring oder steig mit beiden Füßen zurück in einen festen hohen Stütz. Diese Variante hat keinen Liegestütz; Hüfte in Linie mit den Schultern.',
      'Bring die Füße außen neben die Hände, richte die Brust auf und spring aus dem Stand leicht nach oben, Arme über den Kopf.',
      'Lande weich und beginne die nächste Wiederholung kontrolliert. Hocke, Stütz, zurück und Sprung zählen zusammen als eine Wiederholung.',
    ],
    [
      'Anspannen, bevor die Füße zurückgehen',
      'Füße außen neben die Hände',
      'Weich landen und neu ansetzen',
    ],
    [
      'Im Stütz die Hüfte durchhängen lassen',
      'Die Füße hastig zurückholen oder mit steifen Knien landen',
    ],
  ),
  'cable-crunch': e(
    'Kabel-Crunch',
    ['Crunch am Kabelzug', 'Kniender Kabelcrunch'],
    [
      'Knie dich mit dem Rücken zu einem hohen Kabelzug, das Seil neben dem Kopf.',
      'Crunche nach unten, indem du die Wirbelsäule rund machst, nicht indem du in der Hüfte einknickst.',
      'Kontrolliert zurückkommen.',
    ],
    ['Hüfte bleibt fest', 'Die Wirbelsäule bewusst einrollen'],
    ['Daraus ein Hüftbeugen machen und die Hüftbeuger arbeiten lassen'],
  ),
  'cable-curl': e(
    'Kabel-Curl',
    ['Bizepscurl am Kabel', 'Seilcurl'],
    [
      'Stell dich vor einen tiefen Kabelzug mit gerader Stange oder Seil.',
      'Curle auf Schulterhöhe, Ellbogen an der Seite.',
      'Senke ab, bis die Arme gestreckt sind, und halte Spannung auf dem Kabel.',
    ],
    ['Ellbogen ruhig', 'Oben anspannen'],
    ['Sich zurücklehnen, um die Wiederholung zu beenden'],
  ),
  'cable-fly': e(
    'Kabel-Fliegende',
    ['Cable Fly', 'Kabelzug-Crossover', 'Crossover'],
    [
      'Stelle beide Kabelzüge auf Schulterhöhe oder höher ein.',
      'Mach einen Schritt nach vorn in Schrittstellung, Ellbogen leicht gebeugt.',
      'Führ die Griffe vor der Brust zusammen und geh kontrolliert zurück.',
    ],
    ['Ellbogenwinkel bleibt gleich', 'In der Mitte anspannen'],
    ['Daraus ein Drücken machen, indem du die Ellbogen beugst und streckst'],
  ),
  'cable-hammer-curl': e(
    'Hammercurl am Kabel',
    ['Seil-Hammercurl', 'Hammercurl Kabel'],
    [
      'Häng ein Seil an einen tiefen Kabelzug. Schau zum Gewichtsblock und halte je ein Seilende, Handflächen zueinander, Daumen oben.',
      'Steh aufrecht, Ellbogen an den Rippen, und curle das Seil Richtung Schultern, ohne die Oberarme zu bewegen.',
      'Senke langsam fast bis zur Streckung, Handgelenke neutral, Gewichtsblock unter Kontrolle.',
    ],
    ['Daumen oben', 'Ellbogen an den Rippen', 'Ohne Schwung absenken'],
    [
      'Sich zurücklehnen, um den Block zu bewegen',
      'Die Handgelenke abknicken oder die Ellbogen nach vorn wandern lassen',
    ],
  ),
  'cable-kickback': e(
    'Kabel-Kickback',
    ['Glute Kickback am Kabel', 'Hüftstreckung am Kabel'],
    [
      'Befestige eine Fußschlaufe am tiefen Kabelzug um ein Fußgelenk. Schau zum Gerät, halte dich mit beiden Händen fest, Standknie locker.',
      'Spann an, leicht nach vorn geneigt. Führ das Bein mit der Schlaufe aus der Hüfte nach hinten, Becken gerade, Arbeitsknie leicht gebeugt.',
      'Stoppe, bevor der untere Rücken ins Hohlkreuz geht, und komm langsam zurück, ohne den Block abzulegen. Beide Seiten machen und Wiederholungen pro Bein eintragen.',
    ],
    ['Aus der Hüfte bewegen', 'Becken gerade halten', 'Vor dem Hohlkreuz stoppen'],
    [
      'Das Bein schwingen oder das Becken verdrehen',
      'Ins Hohlkreuz gehen, um den Fuß höher zu bringen',
    ],
  ),
  'cable-lat-pullover': e(
    'Lat-Pullover am Kabel',
    ['Kabel-Pullover', 'Pullover', 'Seil-Pullover'],
    [
      'Nimm ein Seil am hohen Kabelzug, geh zurück und beug dich vor, bis die Arme über dem Kopf sind.',
      'Mit locker fixierten Ellbogen das Seil im Bogen nach unten bis an die Hüfte ziehen.',
      'Lass es wieder hochgehen, bis du den Latissimus dehnen spürst.',
    ],
    ['Hüfte nach hinten, Brust nach unten', 'Mit den Händen an der Hüfte abschließen'],
    [
      'Die Ellbogen beugen und daraus ein Trizepsdrücken machen',
      'Aufrecht stehen, das verkürzt die Dehnung',
    ],
  ),
  'cable-lateral-raise': e(
    'Seitheben am Kabel',
    ['Einarmiges Seitheben Kabel', 'Kabel-Seitheben'],
    [
      'Stell dich seitlich zu einem tiefen Kabelzug und nimm den Griff in die Hand, die weiter vom Block weg ist, das Kabel kreuzt vor den Oberschenkeln. Mit der freien Hand stabilisieren.',
      'Ellbogen leicht und fest gebeugt, den Arbeitsarm seitlich bis etwa Schulterhöhe heben, ohne zu lehnen oder die Schulter hochzuziehen.',
      'Langsam vor dem Körper absenken, Spannung auf dem Kabel. Beide Seiten machen und Wiederholungen pro Arm eintragen.',
    ],
    ['Mit dem Ellbogen führen', 'Oberkörper ruhig', 'Etwa auf Schulterhöhe stoppen'],
    ['Vom Block wegschwingen', 'Die Schulter hochziehen oder den Ellbogenwinkel ändern'],
  ),
  'cable-woodchop': e(
    'Holzhacker am Kabel',
    ['Woodchop', 'Holzhacker', 'Kabel-Rotation'],
    [
      'Stell ein Kabel auf Schulterhöhe ein und stell dich seitlich dazu.',
      'Nimm den Griff in beide Hände, Arme fast gestreckt.',
      'Dreh aus dem Rumpf und zieh quer über den Körper, dann langsam zurück.',
    ],
    ['Aus den Rippen drehen, nicht aus den Armen', 'Hüfte bleibt nach vorn ausgerichtet'],
    ['Mit den Armen ziehen, statt den Oberkörper zu drehen'],
  ),
  'chest-dip': e(
    'Dips (Brustfokus)',
    ['Dips', 'Brust-Dips', 'Barrendips'],
    [
      'Stütz dich mit gestreckten Armen auf den Holmen.',
      'Neig den Oberkörper etwa 30 Grad nach vorn und lass die Ellbogen leicht nach außen.',
      'Senke ab, bis die Oberarme waagerecht sind, und drück wieder hoch.',
    ],
    ['Nach vorn lehnen für die Brust', 'Schultern weg von den Ohren'],
    ['Tiefer gehen, als die Schultern vertragen', 'Aufrecht bleiben, dann wird es ein Trizepsdip'],
  ),
  'chest-supported-dumbbell-row': e(
    'Brustgestütztes Kurzhantelrudern',
    ['Rudern auf der Schrägbank', 'Brustgestütztes Rudern', 'Seal Row Kurzhantel'],
    [
      'Stelle eine Bank auf etwa 30 bis 45 Grad und leg dich bäuchlings darauf, Brust am Polster.',
      'Lass in jeder Hand eine Kurzhantel gerade nach unten hängen.',
      'Zieh beide Ellbogen hinter den Oberkörper, anspannen, dann bis zur vollen Dehnung absenken.',
    ],
    ['Brust bleibt am Polster', 'Mit den Ellbogen führen', 'Schulterblätter zusammenziehen'],
    [
      'Die Brust vom Polster heben, um das Gewicht hochzuwuchten',
      'Die Schultern zu den Ohren ziehen',
    ],
  ),
  'chin-up': e(
    'Klimmzug im Untergriff',
    ['Chin-up', 'Untergriff-Klimmzug', 'Klimmzüge eng'],
    [
      'Häng dich im Untergriff schulterbreit an die Stange.',
      'Zieh dich hoch, bis das Kinn über der Stange ist.',
      'Senke kontrolliert ab bis zum vollen Hang.',
    ],
    ['Ellbogen nach unten und hinten treiben', 'Unten ganz aushängen'],
    ['Die Wiederholung unten abkürzen'],
  ),
  'clean-and-jerk': e(
    'Umsetzen und Stoßen',
    ['Clean and Jerk', 'Stoßen', 'Olympisches Stoßen'],
    [
      'Nutze eine freie Hebefläche mit Bumper-Scheiben und lerne Umsetzen, Front-Rack und Ausfallstoßen erst einzeln mit leichter Stange. Steh mit der Stange über der Fußmitte, Hände außen neben den Beinen, Rücken angespannt.',
      'Drück dich vom Boden weg, Stange nah am Körper, wenn sie die Knie passiert. Streck Beine und Hüfte, dann zieh dich unter die Stange und nimm sie vorn auf den Schultern an, Ellbogen nach vorn.',
      'Steh aus dem Umsetzen ganz auf, lege die Stange im Front-Rack ab und spann für das Stoßen an.',
      'Geh ein kurzes Stück gerade nach unten, treib mit den Beinen nach oben und geh in einen stabilen Ausfallschritt unter die Stange, beide Ellbogen gestreckt. Füße auf getrennten, hüftbreiten Spuren.',
      'Komm mit kontrollierten Schritten aus dem Ausfall, bis die Füße zusammen sind und die Stange stabil über dem Kopf ist. Leg die Stange auf eine geübte, zur Last passende Weise ab. Ein Umsetzen plus ein Stoßen ist eine Wiederholung.',
    ],
    [
      'Stange beim Umsetzen nah halten',
      'Vor dem Stoßen aufstehen und stabilisieren',
      'Senkrecht absenken und mit den Beinen treiben',
      'Den Stoß auf zwei Spuren annehmen',
    ],
    [
      'Zu früh mit den Armen ziehen oder die Stange wegschwingen',
      'Aus einem instabilen Front-Rack stoßen',
      'Mit weichen Ellbogen oder Füßen auf einer Linie annehmen',
    ],
  ),
  'close-grip-bench-press': e(
    'Enges Bankdrücken',
    ['Enge Bank', 'Bankdrücken eng'],
    [
      'Greif die Stange etwa schulterbreit.',
      'Senke sie mit angelegten Ellbogen zur unteren Brust.',
      'Drück wieder hoch, mit Kraft aus dem Trizeps.',
    ],
    ['Ellbogen etwa 30 Grad angelegt', 'Handgelenke über den Ellbogen'],
    ['So eng greifen, dass die Handgelenke schmerzen'],
  ),
  'close-grip-dumbbell-bench-press': e(
    'Enges Kurzhantel-Bankdrücken',
    ['Squeeze Press', 'Enges KH-Drücken', 'Kurzhantel-Drücken Neutralgriff eng'],
    [
      'Leg dich auf eine Flachbank, Füße fest, oberer Rücken abgestützt. Halte zwei Kurzhanteln eng zusammen über der Brust, Handflächen zueinander.',
      'Handgelenke gerade, Ellbogen nah am Körper, während du die Hanteln zur unteren Brust senkst. Die Gewichte bleiben waagerecht und nah beieinander.',
      'Drück beide Hanteln gemeinsam hoch, bis die Arme gestreckt sind, ohne die Ellbogen durchzuschlagen. Behalte den engen Neutralgriff die ganze Zeit.',
    ],
    ['Hanteln eng und waagerecht', 'Handgelenke über den Unterarmen', 'Ellbogen nah an den Rippen'],
    [
      'Eine Hantel kippen oder vorauslaufen lassen',
      'Die Ellbogen ausstellen oder die neutrale Handgelenkposition verlieren',
    ],
  ),
  'close-grip-incline-bench-press': e(
    'Enges Schrägbankdrücken',
    ['Enges Schrägbankdrücken Langhantel'],
    [
      'Stelle eine Schrägbank auf etwa 30 Grad in einem Rack mit Sicherungen. Leg dich hin, Füße fest, und greif die Stange geschlossen im Obergriff etwa schulterbreit.',
      'Heb über der oberen Brust aus. Senke kontrolliert zur oberen Brust, Handgelenke über den Unterarmen, Ellbogen schräg zum Oberkörper.',
      'Drück auf derselben Bahn hoch, ohne die Hüfte anzuheben. Nutze einen Spotter oder richtig eingestellte Sicherungen und lege sicher ab.',
    ],
    [
      'Schulterbreiter, geschlossener Griff',
      'Oberer Rücken bleibt am Polster',
      'Mit den Handgelenken über den Unterarmen absenken',
    ],
    [
      'So eng greifen, dass die Handgelenke seitlich abknicken',
      'Die Ellbogen ausstellen oder die Stange von der Brust abprallen lassen',
    ],
  ),
  'close-grip-lat-pulldown': e(
    'Enger Latzug',
    ['Latzug Neutralgriff', 'Latzug mit V-Griff', 'Enger Latzug zur Brust'],
    [
      'Häng einen engen, parallelen V-Griff an den Latzug und stelle das Beinpolster so ein, dass die Beine fest sitzen. Greif beide Griffe, Handflächen zueinander, Daumen umschließen.',
      'Sitz aufrecht mit leichter, fester Rücklage. Zieh den Griff zur oberen Brust, indem du die Ellbogen neben die Rippen nach unten treibst.',
      'Lass langsam zurück bis zu langen Armen und einer angenehmen Dehnung über dem Kopf, ohne zu schaukeln oder den Block aufschlagen zu lassen.',
    ],
    ['Ellbogen nach unten treiben', 'Handgelenke gerade', 'Oberkörperwinkel halten'],
    [
      'Nach hinten schaukeln, um das Gewicht zu bewegen',
      'Hinter den Nacken ziehen oder die Handgelenke einrollen',
    ],
  ),
  'concentration-curl': e(
    'Konzentrationscurl',
    ['Konzentrations-Curl', 'Einarmiger Curl sitzend'],
    [
      'Setz dich auf eine Bank und stütz die Rückseite eines Oberarms innen am Oberschenkel ab.',
      'Curle die Kurzhantel Richtung Schulter.',
      'Senke kontrolliert ab, bis der Arm gestreckt ist, dann Seite wechseln.',
    ],
    ['Oberarm bleibt am Oberschenkel', 'Langsam ablassen'],
    ['Den Arm mit dem Oberschenkel hochdrücken'],
  ),
  'conventional-deadlift': e(
    'Kreuzheben',
    ['Kreuzheben klassisch', 'Deadlift', 'KH'],
    [
      'Stell die Fußmitte unter die Stange, Schienbeine nah dran.',
      'Beug dich in der Hüfte hinunter, greif knapp außerhalb der Beine und nimm die Spannung aus der Stange.',
      'Steh auf, indem du den Boden wegdrückst, und schließ aufrecht ab.',
    ],
    ['Rücken gerade, Brust raus', 'Stange bleibt an den Beinen', 'Oben das Gesäß anspannen'],
    ['Den unteren Rücken rund machen', 'Die Stange vom Boden reißen'],
  ),
  'decline-ab-crunch': e(
    'Negativ-Crunch',
    ['Crunch auf der Negativbank', 'Decline Crunch'],
    [
      'Hak die Füße unter die Polster einer Negativbank und leg dich zurück, Hände neben dem Kopf oder eine Scheibe auf der Brust.',
      'Rolle die Schultern hoch, indem du den oberen Rücken rund machst, Rippen Richtung Hüfte.',
      'Senke kontrolliert ab und stoppe, bevor die Schultern auf der Bank liegen, damit der Bauch unter Spannung bleibt.',
    ],
    [
      'Die Wirbelsäule einrollen, nicht in der Hüfte knicken',
      'Langsam ablassen',
      'Beim Hochkommen ausatmen',
    ],
    ['Mit Schwung hochkommen und zurückfallen', 'Ganz aufsitzen, dann übernehmen die Hüftbeuger'],
  ),
  'decline-bench-press': e(
    'Negativbankdrücken',
    ['Negativ-Bankdrücken Langhantel', 'Decline Bench Press'],
    [
      'Sichere die Beine auf einer leicht negativen Bank unter einer abgelegten Stange. Stelle die Sicherungen ein oder nutze einen Spotter. Kopf, Rücken und Hüfte bleiben abgestützt.',
      'Greif geschlossen etwas breiter als schulterbreit und heb aus. Senke die Stange langsam zur unteren Brust, Handgelenke über den Ellbogen.',
      'Drück zurück über die Schultern, ohne abzufedern oder die Hüfte zu heben. Lege sicher ab, bevor du die Stange loslässt oder die Bank verlässt.',
    ],
    [
      'Beinpolster sichern, bevor du aushebst',
      'Zur unteren Brust absenken',
      'Schultern an der Bank lassen',
    ],
    [
      'Die Stange abprallen lassen oder die Ellbogen weit ausstellen',
      'Ohne sichere Beinfixierung oder sicheren Ablageplan beginnen',
    ],
  ),
  'decline-dumbbell-bench-press': e(
    'Negativ-Kurzhanteldrücken',
    ['Negativ-KH-Drücken', 'Decline Kurzhantel-Bankdrücken'],
    [
      'Sichere die Beine auf einer leicht negativen Bank und bring die Kurzhanteln kontrolliert oder mit Spotter auf Brusthöhe. Kopf, Schultern und Hüfte bleiben abgestützt.',
      'Drück die Hanteln über die Brust, Handgelenke über den Ellbogen, Handflächen nach vorn oder leicht nach innen.',
      'Senke langsam in eine angenehme Position auf Brusthöhe, Ellbogen schräg nach hinten, und drück wieder. Steig nach der letzten Wiederholung kontrolliert aus.',
    ],
    ['Beinpolster sicher', 'Handgelenke über den Ellbogen', 'Ein- und Ausstieg kontrollieren'],
    [
      'Die Ellbogen ausstellen oder tiefer als angenehm absenken',
      'Mit schweren Hanteln in instabiler Lage aufsetzen wollen',
    ],
  ),
  'decline-dumbbell-fly': e(
    'Negativ-Fliegende mit Kurzhanteln',
    ['Negativ-Flys', 'Decline Fly'],
    [
      'Sichere die Beine auf einer leicht negativen Bank und bring leichte Kurzhanteln über die Brust, Handflächen zueinander. Plane einen kontrollierten Ein- und Ausstieg.',
      'Ellbogen leicht und fest gebeugt, die Arme im weiten Bogen öffnen. Stoppe, wenn die Oberarme etwa auf Höhe des Oberkörpers sind, oder früher, wenn nötig.',
      'Führ die Hanteln auf demselben Bogen zurück über die Brust, ohne den Ellbogenwinkel zu ändern oder die Gewichte aneinanderzuschlagen.',
    ],
    [
      'Ellbogenwinkel fest',
      'Leichte, kontrollierte Gewichte',
      'Bei angenehmer Brustdehnung stoppen',
    ],
    [
      'Die Arme weit unter den Oberkörper sinken lassen',
      'Die Ellbogen beugen und daraus ein Drücken machen',
    ],
  ),
  'decline-push-up': e(
    'Liegestütz mit erhöhten Füßen',
    ['Decline-Liegestütz', 'Negativ-Liegestütz'],
    [
      'Stell die Füße auf eine niedrige, stabile Bank und die Hände etwas breiter als schulterbreit auf den Boden.',
      'Spann dich in eine gerade Linie von den Schultern bis zu den Fersen und senke die Brust Richtung Boden, Ellbogen schräg nach hinten.',
      'Drück dich vom Boden weg, bis die Arme gestreckt sind, Hüfte in Linie mit dem Oberkörper.',
    ],
    [
      'Hüfte auf Höhe des Oberkörpers',
      'Brust zwischen die Hände senken',
      'Mit niedriger Fußerhöhung beginnen',
    ],
    ['In der Hüfte abknicken oder durchhängen', 'Eine instabile oder zu hohe Fußauflage nutzen'],
  ),
  'decline-smith-bench-press': e(
    'Negativbankdrücken an der Multipresse',
    ['Multipresse Negativbank', 'Smith Decline Press'],
    [
      'Stelle eine leicht negative Bank mittig unter die Stange der Multipresse, sichere die Beinpolster und stelle die Sicherheitsstopps ein. Teste die leere Stange, damit sie zur unteren Brust führt.',
      'Leg dich hin, Kopf, Schultern und Hüfte abgestützt. Greif geschlossen etwas breiter als schulterbreit, löse die Haken und senke langsam ab.',
      'Drück entlang der Schienen, ohne abzufedern oder die Hüfte zu heben. Dreh die Stange auf beide Haken und prüf den sicheren Halt, bevor du loslässt.',
    ],
    [
      'Die feste Bahn vor dem Beladen testen',
      'Stopps unter deiner tiefsten Position einstellen',
      'Beide Haken prüfen, bevor du loslässt',
    ],
    [
      'Die Bank so stellen, dass die Stange Richtung Hals läuft',
      'Die Sicherheitsstopps weglassen oder eine ungesicherte Stange loslassen',
    ],
  ),
  'diamond-push-ups': e(
    'Diamant-Liegestütz',
    ['Diamond Push-ups', 'Enge Liegestütze'],
    [
      'Beginne im hohen Stütz, Hände eng zusammen unter der Brust. Daumen und Zeigefinger bilden eine Raute, wenn es angenehm ist, sonst etwas Abstand für die Handgelenke lassen.',
      'Spann den Rumpf an und beuge die Ellbogen nach hinten, um die Brust zu den Händen zu senken.',
      'Drück zurück zu gestreckten Armen, Körper in einer Linie. Lass die Knie am Boden, wenn du es leichter brauchst.',
    ],
    [
      'Ellbogen schräg nach hinten',
      'Hüfte in Linie',
      'Eine für die Handgelenke angenehme Handposition wählen',
    ],
    [
      'Die Ellbogen ausstellen oder die Schultern hochziehen',
      'Im unteren Rücken durchhängen, um die Hände zu erreichen',
    ],
  ),
  'dumbbell-bench-press': e(
    'Kurzhantel-Bankdrücken',
    ['KH-Bankdrücken', 'Kurzhanteldrücken', 'KH-Drücken'],
    [
      'Setz dich mit den Kurzhanteln auf den Oberschenkeln hin und bring sie beim Hinlegen mit Schwung aus den Knien in Position.',
      'Senke ab, bis die Oberarme auf Höhe des Oberkörpers sind.',
      'Drück nach oben und leicht zueinander.',
    ],
    ['Handgelenke über den Ellbogen', 'Das Absenken kontrollieren'],
    ['Die Hanteln unten zu weit auseinanderdriften lassen'],
  ),
  'dumbbell-curl': e(
    'Kurzhantel-Curl',
    ['Bizepscurl', 'KH-Curl', 'Wechselcurl'],
    [
      'Steh mit je einer Kurzhantel in jeder Hand, Arme gestreckt, Handflächen nach vorn.',
      'Curle auf Schulterhöhe, Ellbogen an der Seite.',
      'Senke kontrolliert bis zur vollen Streckung, gleichzeitig oder abwechselnd.',
    ],
    ['Ellbogen an den Rippen', 'Unten ganz strecken'],
    [
      'Jede Wiederholung mit Schwung aus der Hüfte beginnen',
      'Die Ellbogen nach vorn wandern lassen',
    ],
  ),
  'dumbbell-preacher-curl': e(
    'Scott-Curl (Kurzhantel)',
    ['Scott-Curl Kurzhantel', 'Einarmiger Scott-Curl', 'Preacher Curl'],
    [
      'Stelle das Polster so ein, dass eine Achsel auf der oberen Kante liegt, die Kurzhantel in dieser Hand.',
      'Curle sie hoch und stoppe kurz vor der Senkrechten, um die Spannung zu halten.',
      'Senke langsam, bis der Arm fast gestreckt ist, dann Seite wechseln.',
    ],
    ['Ellbogen bleibt auf dem Polster', 'Oben den kleinen Finger nach oben drehen'],
    ['Das Gewicht unten fallen lassen, das belastet den Ellbogen'],
  ),
  'dumbbell-pullover': e(
    'Kurzhantel-Pullover',
    ['KH-Pullover', 'Überzüge', 'Pullover auf der Bank'],
    [
      'Leg dich längs oder quer auf eine Flachbank, eine Kurzhantel über der Brust.',
      'Senke sie mit nur leicht gebeugten Ellbogen hinter den Kopf.',
      'Zieh sie zurück über die Brust, ohne die Rippen aufklappen zu lassen.',
    ],
    ['Rippen unten', 'Dort stoppen, wo die Dehnung endet, nicht wo die Schulter nachgibt'],
    [
      'Die Ellbogen einknicken lassen, dann arbeitet der Trizeps',
      'Der Reichweite zuliebe tiefer gehen, als die Schulter angenehm findet',
    ],
  ),
  'dumbbell-romanian-deadlift': e(
    'Rumänisches Kreuzheben mit Kurzhanteln',
    ['KH-RDL', 'Kurzhantel-RDL', 'Kreuzheben mit gestreckten Beinen Kurzhantel'],
    [
      'Steh etwa hüftbreit, je eine Kurzhantel vor den Oberschenkeln. Knie locker, Rumpf angespannt.',
      'Schieb die Hüfte nach hinten und lass die Hanteln mit gestreckten Armen nah an den Beinen sinken. Wirbelsäule stabil, Kniebeugung fast unverändert.',
      'Stoppe bei kontrollierter Dehnung der Beinbeuger, bevor der Rücken rund wird, und schieb die Hüfte zum Aufrichten nach vorn. Die Gewichte müssen den Boden nicht berühren.',
    ],
    [
      'Hüfte nach hinten schieben',
      'Gewichte nah an den Beinen',
      'Aufrecht stehen, ohne nach hinten zu lehnen',
    ],
    ['Durch wiederholtes Kniebeugen in die Hocke gehen', 'Mit rundem Rücken zum Boden greifen'],
  ),
  'dumbbell-shoulder-press': e(
    'Kurzhantel-Schulterdrücken',
    ['KH-Schulterdrücken', 'Schulterdrücken sitzend'],
    [
      'Setz dich mit Rückenlehne hin, Kurzhanteln auf Ohrhöhe.',
      'Drück nach oben, bis die Arme gestreckt sind.',
      'Senke kontrolliert zurück auf Ohrhöhe.',
    ],
    ['Handgelenke über den Ellbogen', 'Kein Hohlkreuz'],
    ['Halbe Wiederholungen, die nie Ohrhöhe erreichen'],
  ),
};
