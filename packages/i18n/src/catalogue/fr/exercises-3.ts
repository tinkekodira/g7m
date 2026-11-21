import { exercise as e } from '../entry.js';
import type { ExerciseText } from '../types.js';

export const exercises3: Readonly<Record<string, ExerciseText>> = {
  'pistol-squat': e(
    'Pistol squat',
    ['squat sur une jambe', 'squat unijambiste'],
    [
      'Tiens-toi sur une jambe, l’autre tendue devant, bras vers l’avant. Le pied d’appui reste bien à plat.',
      'Plie genou et hanche de la jambe d’appui pour descendre lentement, jambe libre décollée du sol. Ne descends que jusqu’où tu contrôles talon au sol.',
      'Pousse sur le pied d’appui pour te relever sans rebond. Fais les deux côtés et note les répétitions par jambe. Entraîne-toi avec un appui stable pour les mains tant que l’équilibre et l’amplitude ne sont pas fiables.',
    ],
    ['Tout le pied d’appui au sol', 'Le genou suit les orteils', 'Amplitude contrôlée'],
    [
      'Laisser le genou rentrer',
      'Tomber vite et rebondir en bas',
      'Forcer la profondeur en levant le talon',
    ],
  ),
  plank: e(
    'Gainage',
    ['planche', 'gainage ventral', 'plank'],
    [
      'Pose les avant-bras au sol sous les épaules.',
      'Gaine-toi pour que le corps forme une ligne droite.',
      'Tiens en respirant calmement.',
    ],
    ['Serrer les fessiers', 'Côtes basses, sans s’affaisser'],
    ['Tenir longtemps avec le bas du dos creusé'],
  ),
  'preacher-curl': e(
    'Curl pupitre (barre EZ)',
    ['curl pupitre barre EZ', 'curl Larry Scott', 'preacher curl'],
    [
      'Règle le pupitre pour que les aisselles reposent sur le bord supérieur.',
      'Prends la barre EZ par les prises inclinées et monte-la en t’arrêtant avant la verticale pour garder la tension.',
      'Redescends lentement jusqu’à ce que les bras soient presque tendus.',
    ],
    ['Les coudes ne quittent pas le pupitre', 'Contrôler l’étirement en bas'],
    ['Laisser tomber la charge en bas, ce qui sollicite le coude'],
  ),
  'preacher-curl-machine': e(
    'Curl pupitre (machine)',
    ['machine à curl pupitre', 'machine à biceps', 'curl machine'],
    [
      'Règle le siège pour que l’arrière des bras repose à plat sur le coussin et que les aisselles touchent le bord supérieur.',
      'Prends les poignées paumes vers le haut et monte-les vers les épaules.',
      'Redescends lentement jusqu’à bras presque tendus, sans laisser la charge se poser.',
    ],
    ['Les bras restent sur le coussin', 'Contracter en haut', 'Lentement à la descente'],
    [
      'Décoller les coudes pour finir la répétition',
      'Laisser tomber la charge en bas, ce qui sollicite le coude',
    ],
  ),
  'pull-up': e(
    'Traction',
    ['tractions', 'traction pronation', 'traction prise large'],
    [
      'Suspends-toi à la barre en pronation, mains plus larges que les épaules.',
      'Tire la poitrine vers la barre en menant avec les coudes.',
      'Redescends jusqu’à bras complètement tendus.',
    ],
    ['Poitrine vers la barre', 'Épaules basses, loin des oreilles'],
    ['Faire du kipping quand le but est la force', 'S’arrêter à mi-descente'],
  ),
  'push-up': e(
    'Pompe',
    ['pompes', 'push-up'],
    [
      'Place les mains un peu plus larges que les épaules.',
      'Gaine le tronc pour que le corps forme une ligne droite.',
      'Descends la poitrine juste au-dessus du sol et repousse.',
    ],
    ['Serrer les fessiers', 'Coudes vers l’arrière, pas écartés'],
    ['Laisser les hanches s’affaisser', 'S’arrêter avant le sol'],
  ),
  'rear-delt-fly': e(
    'Oiseau',
    ['élévations buste penché', 'écarté inversé', 'oiseau haltères'],
    [
      'Penche-toi depuis les hanches, dos plat.',
      'Laisse pendre les haltères, coudes légèrement fléchis.',
      'Monte sur les côtés en menant avec les coudes.',
    ],
    ['Pouces légèrement vers le bas', 'Ne pas serrer fort les omoplates'],
    ['Utiliser les trapèzes supérieurs et en faire un shrug'],
  ),
  'rear-delt-fly-machine': e(
    'Oiseau à la machine',
    ['pec deck inversé', 'reverse fly machine', 'machine deltoïdes postérieurs'],
    [
      'Assieds-toi face à la machine, poitrine contre le dossier, et règle le siège pour que les poignées soient à hauteur d’épaules.',
      'Prends les poignées coudes légèrement fléchis et ouvre-les vers l’extérieur et l’arrière jusqu’à ce que les bras soient alignés avec le corps.',
      'Reviens lentement jusqu’à ce que les poignées se touchent presque, sans laisser la charge se poser.',
    ],
    ['Mener avec les coudes', 'La poitrine reste sur le dossier', 'Lentement au retour'],
    [
      'Hausser les épaules, ce qui donne le travail aux trapèzes',
      'Se décoller du dossier pour balancer la charge',
    ],
  ),
  'recumbent-bike': e(
    'Vélo semi-allongé',
    ['vélo couché', 'vélo assis'],
    [
      'Règle le siège pour que la jambe soit presque tendue en fin de pédalage.',
      'Appuie-toi contre le dossier et garde un rythme régulier.',
      'Augmente le niveau plutôt que la vitesse quand ça devient facile.',
    ],
    ['Dos contre le dossier', 'Cercles fluides, sans taper'],
    ['S’asseoir si près que les genoux sont coincés en haut'],
  ),
  'romanian-deadlift': e(
    'Soulevé de terre roumain',
    ['SDT roumain', 'RDL', 'soulevé jambes tendues'],
    [
      'Tiens-toi droit, la barre à hauteur des hanches.',
      'Pousse les hanches en arrière en laissant la barre glisser le long des cuisses.',
      'Arrête quand les ischios sont bien étirés, puis pousse les hanches vers l’avant.',
    ],
    [
      'Plier aux hanches, pas s’accroupir',
      'Genoux souples, pas verrouillés',
      'La barre reste contre les jambes',
    ],
    ['Plier tellement les genoux que ça devient un soulevé de terre', 'Arrondir le haut du dos'],
  ),
  'rowing-machine': e(
    'Rameur',
    ['aviron', 'ergomètre', 'concept2'],
    [
      'Attache les pieds, sangle sur la partie la plus large du pied.',
      'Pousse avec les jambes, penche-toi légèrement en arrière, puis tire la poignée vers les côtes.',
      'Reviens dans l’ordre inverse : bras, buste, puis jambes.',
    ],
    ['Jambes, buste, bras, puis retour', 'Deux fois plus long au retour qu’à la poussée'],
    [
      'Tirer avec les bras avant que les jambes aient fini',
      'Mettre le volet à 10 parce que ça semble plus dur',
    ],
  ),
  'russian-twists': e(
    'Russian twist',
    ['rotations russes', 'rotation du buste assis'],
    [
      'Assieds-toi genoux fléchis, talons légèrement au sol. Penche-toi un peu en arrière, dos long, et joins les mains devant la poitrine.',
      'Tourne poitrine et épaules d’un côté en gardant hanches et genoux face à l’avant.',
      'Repasse par le centre et tourne de l’autre côté. Amplitude confortable ; chaque côté compte pour une répétition. Commence sans charge.',
    ],
    ['Tourner la poitrine avec les mains', 'Dos long', 'Hanches face à l’avant'],
    ['Ne balancer que les bras', 'Arrondir le bas du dos ou forcer la rotation'],
  ),
  'scissor-kicks': e(
    'Ciseaux',
    ['battements de jambes', 'ciseaux abdos'],
    [
      'Allonge-toi sur le dos, bras le long du corps. Gaine le ventre et monte les jambes à une hauteur qui te permet de garder le bas du dos stable.',
      'Genoux souplement tendus, alterne une jambe vers le haut pendant que l’autre descend, en petits ciseaux verticaux.',
      'Respire calmement et arrête la série avant que le dos se cambre. Chaque alternance compte pour une répétition.',
    ],
    ['Bas du dos stable', 'Petits ciseaux contrôlés', 'Monter les jambes si le dos se cambre'],
    [
      'Descendre les jambes trop bas pour garder le contrôle du tronc',
      'Bloquer la respiration ou balancer les jambes vite',
    ],
  ),
  'seated-cable-row': e(
    'Tirage horizontal à la poulie',
    ['tirage horizontal', 'rowing poulie basse', 'tirage assis'],
    [
      'Assieds-toi à la poulie basse, pieds sur la plateforme, genoux légèrement fléchis.',
      'Tire la poignée vers le nombril, coudes près du corps.',
      'Reviens à l’étirement complet sans arrondir le dos.',
    ],
    ['Poitrine haute', 'Contracter au niveau des côtes'],
    ['Basculer le buste d’avant en arrière pour bouger la charge'],
  ),
  'seated-calf-raise': e(
    'Mollets assis',
    ['extension mollets assis', 'soléaire assis'],
    [
      'Assieds-toi, coussin sur le bas des cuisses et avant des pieds sur la plateforme.',
      'Descends les talons pour t’étirer.',
      'Monte sur la pointe des pieds et contracte.',
    ],
    ['Genoux fléchis, le travail passe au soléaire', 'Lent et sur toute l’amplitude'],
    ['Travailler sur deux centimètres d’amplitude'],
  ),
  'seated-dip-machine': e(
    'Machine à dips assis',
    ['dips à la machine', 'dips triceps machine'],
    [
      'Règle le siège pour attraper les poignées près des hanches, coudes fléchis et poignets droits. Dos contre le dossier, pieds ancrés.',
      'Coudes près du corps, pousse les poignées vers le bas jusqu’à bras presque tendus.',
      'Reviens lentement à une flexion de coude confortable sans hausser les épaules ni laisser la pile claquer.',
    ],
    ['Dos contre le dossier', 'Pousser par les coudes', 'Épaules basses'],
    [
      'Se pencher ou décoller du siège pour bouger la charge',
      'Ouvrir les coudes ou les claquer en extension',
    ],
  ),
  'seated-leg-curl': e(
    'Leg curl assis',
    ['curl ischios assis', 'leg curl assis'],
    [
      'Règle le coussin des cuisses bien serré et celui des chevilles juste au-dessus des talons.',
      'Ramène les jambes vers le bas et l’arrière aussi loin que possible.',
      'Reviens avec contrôle.',
    ],
    ['Pousser les cuisses dans le coussin', 'Pause en bas'],
    ['Laisser la charge remonter d’un coup'],
  ),
  'seated-row-machine': e(
    'Rowing à la machine',
    ['rowing assis machine', 'tirage machine', 'rowing poitrine appuyée machine'],
    [
      'Règle le siège pour que les poignées soient au niveau du bas de la poitrine, et appuie-toi contre le coussin.',
      'Tire les poignées en arrière en amenant les coudes au-delà des côtes.',
      'Laisse-les revenir à l’étirement complet sans quitter le coussin.',
    ],
    ['La poitrine reste sur le coussin', 'Serrer les omoplates'],
    ['Décoller la poitrine pour arracher les dernières répétitions'],
  ),
  'shoulder-press-machine': e(
    'Presse à épaules',
    ['développé épaules machine', 'développé militaire machine'],
    [
      'Choisis une charge maîtrisable ; sur une machine à disques, charge les deux côtés de façon égale. Règle le siège pour que les poignées partent à peu près à hauteur d’épaules et que tu les atteignes sans t’étirer.',
      'Assieds-toi, hanches et haut du dos contre les coussins, pieds à plat au sol. Gaine le ventre, côtes au-dessus des hanches.',
      'Prends les poignées à pleine main. Poignets droits, coudes légèrement devant le buste, avant-bras dans la direction des poignées.',
      'Expire en poussant les poignées vers le haut selon la trajectoire de la machine. Dos contre le dossier ; tends les bras sans claquer les coudes.',
      'Inspire en redescendant lentement jusqu’à la position de départ, ou aussi bas que tu contrôles confortablement. Épaules stables, sans rebond en bas.',
      'Répète avec la même amplitude et le même rythme. Après la dernière répétition, ramène doucement les poignées à leurs butées avant de lâcher.',
    ],
    [
      'Dos contre le coussin, côtes basses',
      'Poignets droits, coudes sous les poignées',
      'Pousser en douceur, contrôler la descente',
      'Amplitude confortable sans forcer',
    ],
    [
      'Régler le siège trop bas ou trop haut, poignées loin sous ou au-dessus des épaules',
      'Cambrer le bas du dos et décoller pour bouger une charge trop lourde',
      'Rebondir en bas ou claquer les coudes en haut',
      'Casser les poignets ou forcer les poignées sous une position d’épaule confortable',
    ],
  ),
  'single-arm-dumbbell-row': e(
    'Rowing haltère unilatéral',
    ['rowing haltère', 'rowing un bras', 'tirage haltère'],
    [
      'Pose une main et le genou du même côté sur un banc.',
      'Laisse pendre l’haltère, puis tire-le vers la hanche.',
      'Redescends jusqu’à l’étirement complet.',
    ],
    ['Tirer vers la hanche, pas vers l’épaule', 'Ne pas tourner le buste'],
    ['Tourner le corps pour arracher la charge'],
  ),
  'sissy-squat': e(
    'Sissy squat',
    ['squat sissy'],
    [
      'Debout, pieds à largeur de hanches, bras devant pour l’équilibre. Commence sans charge et utilise un appui solide pour les mains pendant l’apprentissage.',
      'Monte sur l’avant des pieds et avance les genoux pendant que buste et cuisses basculent ensemble en arrière. Les hanches restent tendues au lieu de s’asseoir en arrière.',
      'Ne descends que sur une amplitude de genou confortable et contrôlée, puis tends les genoux pour remonter. Commence peu profond et arrête si le genou fait mal.',
    ],
    [
      'Hanches tendues',
      'Buste et cuisses bougent ensemble',
      'D’abord une petite amplitude contrôlée',
    ],
    [
      'S’asseoir en arrière comme dans un squat classique',
      'Rebondir en flexion profonde ou perdre l’équilibre sur l’avant-pied',
    ],
  ),
  'ski-erg': e(
    'SkiErg',
    ['ski erg', 'ergomètre de ski', 'ski de fond indoor'],
    [
      'Tiens-toi droit face à la machine, une poignée dans chaque main.',
      'Plie aux hanches et pousse les poignées vers le bas au-delà des cuisses.',
      'Laisse les bras remonter en te redressant.',
    ],
    ['Plier aux hanches, pas s’accroupir', 'Finir les mains au-delà des hanches'],
    ['Plier beaucoup les genoux et en faire un squat'],
  ),
  'skull-crusher': e(
    'Barre au front',
    ['skull crusher', 'extension triceps allongé', 'barre front EZ'],
    [
      'Allonge-toi sur un banc plat avec une barre EZ au-dessus de la poitrine.',
      'Bras immobiles, plie les coudes et descends vers le front.',
      'Tends de nouveau sans laisser les coudes avancer.',
    ],
    ['Les bras restent en place', 'Descendre derrière la tête, pas vers le nez'],
    [
      'En faire un développé en balançant les coudes',
      'Prendre si lourd que les épaules prennent le relais',
    ],
  ),
  'smith-machine-bench-press': e(
    'Développé couché à la Smith',
    ['développé couché smith machine', 'couché smith'],
    [
      'Centre un banc plat sous la barre de la Smith pour qu’elle descende vers le milieu de la poitrine. Règle les butées juste sous ta position la plus basse et vérifie la trajectoire à vide.',
      'Allonge-toi, pieds ancrés, hanches sur le banc, omoplates doucement en arrière et vers le bas. Prends la barre un peu plus large que les épaules, poignets droits.',
      'Tourne la barre pour libérer les crochets. Descends lentement vers le milieu de la poitrine, avant-bras alignés avec la barre, coudes sous les épaules.',
      'Pousse en douceur le long des rails sans rebond ni lever les hanches. Tends les bras sans claquer les coudes.',
      'Termine barre sous contrôle, tourne-la sur les deux crochets et vérifie qu’elle est bien accrochée avant de lâcher.',
    ],
    [
      'Omoplates en arrière et vers le bas',
      'Pieds ancrés, hanches sur le banc',
      'Descendre avec contrôle',
      'Vérifier les deux crochets avant de lâcher',
    ],
    [
      'Placer le banc de sorte que la trajectoire fixe amène la barre vers le cou',
      'Ouvrir les coudes ou casser les poignets',
      'Rebondir sur la poitrine ou lever les hanches',
      'Oublier les butées ou lâcher une barre non accrochée',
    ],
  ),
  'smith-machine-bulgarian-split-squat': e(
    'Squat bulgare à la Smith',
    ['fente bulgare smith machine', 'split squat smith'],
    [
      'Place un banc stable derrière la Smith et règle les butées sous la profondeur prévue. Pose la barre sur le haut du dos et teste la position à vide.',
      'Pose le dessus d’un pied sur le banc derrière toi, pieds sur deux rails à largeur de hanches. Place le pied avant assez loin pour descendre confortablement le long des rails.',
      'Décroche la barre, gaine-toi et plie genou et hanche avant pour descendre avec contrôle. La majeure partie du poids reste sur la jambe avant.',
      'Pousse sur le pied avant pour te relever. Termine les répétitions d’un côté, raccroche en sécurité, puis change de côté. Note les répétitions par jambe.',
    ],
    [
      'Le pied avant reste ancré',
      'Bassin à niveau',
      'Vérifier la trajectoire fixe avant de charger',
    ],
    [
      'Pousser avec la jambe arrière',
      'Placer le pied avant de sorte que les rails imposent une position inconfortable du genou ou de la hanche',
      'Oublier les butées',
    ],
  ),
  'smith-machine-incline-bench-press': e(
    'Développé incliné à la Smith',
    ['développé incliné smith machine', 'incliné smith'],
    [
      'Règle un banc à une inclinaison modérée, environ 30 à 45 degrés, et centre-le sous la barre pour qu’elle descende vers le haut de la poitrine. Règle les butées juste sous ta position la plus basse et vérifie la trajectoire à vide.',
      'Allonge-toi, tête, haut du dos et hanches appuyés, pieds ancrés. Ramène doucement les omoplates en arrière et vers le bas. Prise fermée un peu plus large que les épaules, poignets droits.',
      'Tourne la barre pour libérer les crochets. Descends lentement vers le haut de la poitrine, avant-bras alignés avec la barre, coudes sous les épaules. Arrête à une profondeur que tu contrôles confortablement.',
      'Pousse en douceur le long des rails, épaules et hanches contre le banc. Tends les bras sans claquer les coudes.',
      'Après la dernière répétition, tourne la barre sur les deux crochets et vérifie qu’elle est bien accrochée avant de lâcher.',
    ],
    [
      'Inclinaison modérée',
      'Omoplates en arrière et vers le bas',
      'Descendre vers le haut de la poitrine avec contrôle',
      'Vérifier les deux crochets avant de lâcher',
    ],
    [
      'Placer le banc de sorte que la trajectoire fixe amène la barre vers le cou ou le visage',
      'Ouvrir les coudes ou casser les poignets',
      'Décoller hanches ou épaules ou rebondir en bas',
      'Oublier les butées ou lâcher une barre non accrochée',
    ],
  ),
  'smith-machine-shrug': e(
    'Shrug à la Smith',
    ['shrugs smith machine'],
    [
      'Règle la barre de la Smith à mi-cuisse, butées juste en dessous. Vérifie le sens des crochets et la trajectoire avant de charger.',
      'Debout face à la barre, pieds à largeur de hanches. Prends la barre en pronation juste à l’extérieur des cuisses, redresse-toi et libère les crochets.',
      'Bras tendus, monte les épaules vers les oreilles sans les faire rouler, avancer la tête ni te pencher en arrière.',
      'Marque une courte pause en haut, puis redescends lentement jusqu’à un étirement confortable. Barre proche, buste immobile.',
      'Après la dernière répétition, tourne la barre sur les deux crochets et vérifie qu’elle est bien accrochée avant de lâcher.',
    ],
    [
      'Épaules droit vers le haut et le bas',
      'Bras tendus',
      'Pause en haut',
      'Tête et buste immobiles',
    ],
    [
      'Faire rouler les épaules',
      'Plier les coudes ou rebondir avec les jambes',
      'Avancer la tête ou se pencher en arrière',
      'Laisser tomber les épaules brusquement ou lâcher une barre non accrochée',
    ],
  ),
  'smith-machine-squat': e(
    'Squat à la Smith',
    ['squat smith machine', 'squat guidé'],
    [
      'Règle la barre juste sous la hauteur des épaules et les butées juste sous la profondeur prévue. Vérifie ta position et la trajectoire à vide.',
      'Pose la barre sur les trapèzes, loin de la nuque. Prends-la des deux côtés, pieds à largeur d’épaules, et ajuste leur position pour garder tout le pied au sol pendant tout le squat.',
      'Redresse-toi pour libérer les crochets. Gaine le ventre, puis plie genoux et hanches ensemble, genoux dans l’axe des orteils.',
      'Descends avec contrôle jusqu’à une profondeur confortable, colonne stable et talons au sol. Ne force pas plus bas en arrondissant le bas du dos.',
      'Pousse sur tout le pied pour te relever, genoux alignés. Tourne la barre sur les deux crochets et vérifie qu’elle est bien accrochée avant de t’éloigner.',
    ],
    [
      'Se gainer avant chaque répétition',
      'Tout le pied au sol',
      'Les genoux suivent les orteils',
      'Contrôler la descente et vérifier les crochets',
    ],
    [
      'Choisir une position de pieds qui décolle les talons ou impose une trajectoire inconfortable',
      'Laisser les genoux rentrer',
      'Arrondir le bas du dos ou rebondir en bas',
      'Oublier les butées ou s’éloigner avant que les deux crochets soient engagés',
    ],
  ),
  'spider-curl-dumbbell': e(
    'Spider curl (haltères)',
    ['spider curl haltères', 'curl araignée'],
    [
      'Allonge-toi face au dossier d’un banc à environ 45 degrés, pieds ancrés derrière. Tiens un haltère dans chaque main, paumes vers l’avant, bras pendants librement à côté du dossier.',
      'Monte les deux haltères vers les épaules sans bouger les bras ni décoller la poitrine.',
      'Redescends avec contrôle jusqu’à coudes presque tendus, haltères loin du banc.',
    ],
    ['Poitrine appuyée', 'Paumes vers le haut en montant', 'Coudes sous les épaules'],
    ['Bouger les bras pour balancer les haltères', 'Caler les coudes sur le dossier'],
  ),
  'spider-curl-ez-bar': e(
    'Spider curl (barre EZ)',
    ['spider curl barre EZ', 'curl araignée'],
    [
      'Règle un banc à environ 45 degrés et allonge-toi face au dossier, pieds ancrés. Prends la barre EZ par les prises inclinées et laisse les bras pendre à la verticale, loin du dossier.',
      'Monte la barre vers les épaules, poitrine appuyée et bras immobiles.',
      'Redescends lentement jusqu’à coudes presque tendus. La barre ne touche jamais le banc.',
    ],
    ['La poitrine reste sur le dossier', 'Laisser les bras pendre librement', 'Coudes immobiles'],
    [
      'Poser les coudes sur le dossier comme au curl pupitre',
      'Balancer les épaules ou décoller la poitrine',
    ],
  ),
  'spin-bike': e(
    'Vélo de biking',
    ['biking', 'vélo indoor', 'spinning'],
    [
      'Règle la selle à hauteur de hanche, debout à côté du vélo.',
      'Règle le guidon au niveau de la selle ou un peu plus haut.',
      'Ajoute de la résistance avec la molette plutôt que de pédaler plus vite sans.',
    ],
    ['Hanches stables sur la selle', 'Résistance avant de te lever'],
    ['Rebondir sur la selle à haute cadence sans résistance'],
  ),
  'stair-climber': e(
    'Simulateur d’escalier',
    ['stairmaster', 'machine à escaliers', 'stepper'],
    [
      'Monte pendant que les marches défilent lentement, en tenant les rampes.',
      'Lâche les rampes une fois le rythme trouvé et tiens-toi droit.',
      'Ralentis les marches avant de descendre.',
    ],
    ['Tout le pied sur chaque marche', 'Droit, sans t’appuyer sur les rampes'],
    ['S’appuyer sur les rampes, ce qui retire le poids des jambes'],
  ),
  'standing-calf-raise': e(
    'Mollets debout',
    ['extension mollets debout', 'mollets à la machine debout'],
    [
      'Tiens-toi avec l’avant des pieds sur la plateforme.',
      'Descends les talons pour un étirement complet.',
      'Monte sur la pointe des pieds aussi haut que possible.',
    ],
    ['Pause en haut et en bas', 'Amplitude complète, sans rebond'],
    ['Rebondir dans l’étirement avec le tendon plutôt que le muscle'],
  ),
  'straight-arm-pulldown': e(
    'Pull-over à la poulie bras tendus',
    ['tirage bras tendus', 'pullover debout poulie'],
    [
      'Debout face à une poulie haute avec une barre droite ou une corde.',
      'Coudes presque verrouillés, penche-toi légèrement en avant.',
      'Amène la barre en arc jusqu’aux cuisses, puis reviens au-dessus de la tête.',
    ],
    ['Les coudes restent fixes', 'Le sentir sous l’aisselle, pas dans les triceps'],
    ['Plier les coudes et en faire une extension triceps'],
  ),
  'strict-curl': e(
    'Curl strict',
    ['curl contre le mur', 'curl strict barre EZ'],
    [
      'Tiens-toi, haut du dos et hanches contre un mur ou un support vertical solide, pieds légèrement en avant. Tiens une barre EZ par les prises inclinées, bras tendus, poignets droits.',
      'Dos et hanches en contact avec le support, monte la barre vers les épaules sans avancer les coudes.',
      'Redescends lentement presque jusqu’à l’extension complète. Ne compte que les répétitions faites sans élan des hanches ni perte de contact.',
    ],
    [
      'Dos et hanches contre le support',
      'Coudes contre les côtes',
      'Une charge que tu montes sans balancer',
    ],
    [
      'Pousser avec les genoux ou décoller les hanches du support',
      'Casser les poignets pour finir le curl',
    ],
  ),
  'sumo-deadlift': e(
    'Soulevé de terre sumo',
    ['SDT sumo', 'deadlift sumo'],
    [
      'Place-toi près d’une barre au sol, pieds écartés, orteils tournés vers l’extérieur de façon confortable. Prise en double pronation fermée à l’intérieur des genoux.',
      'Gaine-toi, bras tendus, et amène les tibias vers la barre en gardant les genoux dans l’axe des orteils. Mets la barre en tension avant de soulever.',
      'Pousse le sol et tends genoux et hanches ensemble, barre près des jambes. Termine droit sans te pencher en arrière.',
      'Redescends la barre avec contrôle en envoyant les hanches en arrière et en pliant les genoux quand elle les dépasse. Replace position et tension avant la répétition suivante.',
    ],
    ['Mains à l’intérieur des genoux', 'Barre proche', 'Pousser avec tout le pied'],
    [
      'Arracher la barre du sol bras pliés',
      'Laisser les genoux rentrer ou se pencher en arrière au verrouillage',
    ],
  ),
  'sumo-squat': e(
    'Squat sumo',
    ['squat sumo au poids du corps', 'squat jambes écartées'],
    [
      'Debout, pieds plus larges que les épaules, orteils tournés vers l’extérieur selon un angle confortable. Joins les mains devant la poitrine ; cette version est au poids du corps.',
      'Plie genoux et hanches pour descendre entre les jambes, talons au sol, genoux alignés avec les orteils.',
      'Arrête à une profondeur contrôlée et pousse sur tout le pied pour te relever sans verrouiller brutalement les genoux.',
    ],
    ['Les genoux suivent les orteils', 'Talons au sol', 'Descendre entre les hanches'],
    [
      'Forcer un écart ou une ouverture des pieds excessive',
      'Laisser les genoux rentrer ou décoller les talons',
    ],
  ),
  't-bar-row': e(
    'Rowing T-bar',
    ['T-bar row', 'rowing landmine', 'tirage barre T'],
    [
      'Place-toi à cheval sur la barre, une extrémité fixée dans un coin ou une landmine, et prends une prise serrée sous les disques.',
      'Penche-toi dos plat et tire les disques vers la poitrine.',
      'Redescends avec contrôle jusqu’à l’étirement complet.',
    ],
    ['Dos plat tout du long', 'Tirer avec les coudes, pas avec les mains'],
    ['Se redresser quand la série devient dure', 'Tirer à coups de bas du dos'],
  ),
  'trap-bar-deadlift': e(
    'Soulevé de terre trap bar',
    ['deadlift trap bar', 'soulevé barre hexagonale'],
    [
      'Place-toi dans la trap bar, pieds à largeur de hanches.',
      'Penche-toi et attrape les poignées.',
      'Relève-toi en repoussant le sol.',
    ],
    ['Poitrine haute avant de tirer', 'Repousser le sol'],
    ['Laisser les hanches monter en premier'],
  ),
  'trap-bar-shrug': e(
    'Shrug trap bar',
    ['shrugs barre hexagonale', 'shrug trap bar'],
    [
      'Place-toi dans une trap bar chargée, prends les poignées latérales et soulève-la jusqu’en position debout, dos gainé et poussée de jambes contrôlée.',
      'Bras tendus et buste immobile, monte les deux épaules vers les oreilles. Courte pause en haut.',
      'Redescends lentement jusqu’à un étirement confortable. Après la série, plie hanches et genoux pour reposer la barre au sol avec contrôle.',
    ],
    ['Monter les épaules droit', 'Coudes tendus', 'Gainé en tenant la barre'],
    [
      'Faire rouler les épaules ou plier les coudes',
      'Arracher la barre du sol ou arrondir le dos pour la reposer',
    ],
  ),
  treadmill: e(
    'Tapis de course',
    ['tapis', 'course sur tapis', 'marche inclinée'],
    [
      'Place-toi à cheval sur le tapis, démarre-le lentement, puis monte dessus.',
      'Monte progressivement vitesse et inclinaison pendant la première minute.',
      'Ralentis avant de descendre sur les bords.',
    ],
    ['Poser le pied sous les hanches, pas loin devant', 'Lâcher les poignées une fois lancé'],
    [
      'Tenir les poignées en inclinaison, ce qui retire l’essentiel du travail',
      'Descendre d’un tapis en mouvement',
    ],
  ),
  'triceps-dip': e(
    'Dips (triceps)',
    ['dips triceps', 'dips', 'dips buste droit'],
    [
      'Mets-toi en appui sur les barres, bras tendus.',
      'Buste droit, coudes rentrés vers l’arrière, près du corps.',
      'Descends jusqu’à environ 90 degrés aux coudes, puis repousse jusqu’au verrouillage.',
    ],
    ['Poitrine haute, corps vertical', 'Coudes pointés vers l’arrière', 'Verrouiller en haut'],
    [
      'Se pencher en avant, ce qui en fait des dips pectoraux',
      'Laisser les coudes s’écarter sur les côtés',
    ],
  ),
  'triceps-pushdown': e(
    'Extension triceps à la poulie haute',
    ['pushdown', 'extension triceps corde', 'triceps poulie'],
    [
      'Place-toi à une poulie haute avec une corde ou une barre.',
      'Coudes le long du corps, tends les bras vers le bas.',
      'Reviens jusqu’à ce que les avant-bras dépassent l’horizontale.',
    ],
    ['Coudes fixes', 'Contracter en extension complète'],
    ['Se pencher sur la charge et en faire un développé'],
  ),
  'turkish-get-up': e(
    'Turkish get-up',
    ['relevé turc', 'TGU', 'get-up kettlebell'],
    [
      'Allonge-toi sur le dos, kettlebell tenue droite au-dessus de l’épaule, genou du même côté fléchi.',
      'Roule sur le coude opposé, puis la main, monte les hanches et ramène la jambe dessous jusqu’à genou au sol.',
      'Relève-toi, puis refais chaque étape à l’envers jusqu’au sol, regard sur la kettlebell. Change de côté.',
    ],
    [
      'Bras verrouillé et vertical tout du long',
      'Regard sur la kettlebell',
      'Lentement, une étape à la fois',
    ],
    ['Laisser le bras dériver ou plier', 'Précipiter les transitions'],
  ),
  'upright-bike': e(
    'Vélo d’appartement',
    ['vélo stationnaire', 'vélo', 'cycle'],
    [
      'Règle la selle pour que le genou soit légèrement fléchi en bas du pédalage.',
      'Choisis un niveau que tu peux tenir tout le bloc.',
      'Ralentis la dernière minute plutôt que de t’arrêter net.',
    ],
    ['Genoux au-dessus des pieds', 'Pousser avec tout le pied'],
    ['Une selle si basse que les genoux remontent au-dessus des hanches'],
  ),
  'viking-press': e(
    'Viking press',
    ['développé viking', 'machine viking press'],
    [
      'Utilise une machine viking press dédiée. Règle les supports de départ pour que les poignées neutres soient à hauteur d’épaules, charge les deux manchons de façon égale et vérifie les butées avant de soulever.',
      'Debout, pieds ancrés, prends les deux poignées paumes face à face et gaine le tronc. Décolle la charge des supports.',
      'Pousse les deux poignées vers le haut le long de l’arc du levier, jambes immobiles et côtes contrôlées. Termine bras tendus sans te pencher en arrière.',
      'Redescends lentement vers les épaules et repose les leviers en sécurité sur leurs supports après la série. Cette version est un développé strict sans poussée de jambes ; note toujours la charge de disques ajoutée de la même façon.',
    ],
    [
      'Jambes immobiles',
      'Poignets au-dessus des avant-bras',
      'Reposer les deux leviers en sécurité',
    ],
    [
      'Pousser avec les genoux ou cambrer le bas du dos',
      'Charger les manchons de façon inégale ou rater les supports',
    ],
  ),
  'walking-lunge': e(
    'Fentes marchées',
    ['fentes', 'fentes avant marchées', 'walking lunges'],
    [
      'Fais un grand pas en avant en fente jusqu’à ce que le genou arrière frôle le sol.',
      'Pousse sur le pied avant pour te relever et avance.',
      'Alterne les jambes pendant la série.',
    ],
    ['Buste droit', 'Grand pas pour les fessiers, petit pour les quadriceps'],
    ['Laisser le genou avant rentrer vers l’intérieur'],
  ),
  'wall-sit': e(
    'Chaise contre le mur',
    ['chaise', 'wall sit', 'squat isométrique au mur'],
    [
      'Dos plaqué contre un mur, avance les pieds.',
      'Glisse vers le bas jusqu’à ce que les cuisses soient à peu près parallèles au sol, genoux au-dessus des chevilles.',
      'Tiens en respirant calmement.',
    ],
    ['Dos plaqué au mur', 'Genoux au-dessus des chevilles, pas au-delà des orteils'],
    ['Poser les mains sur les cuisses pour soulager'],
  ),
  'wrist-curl-dumbbell': e(
    'Curl poignets (haltère)',
    ['flexion des poignets', 'curl poignet haltère'],
    [
      'Assieds-toi sur un banc avec des haltères légers, paumes vers le haut. Pose les avant-bras le long des cuisses, poignets juste au-delà des genoux.',
      'Avant-bras appuyés, monte les mains en pliant les poignets sans plier les coudes.',
      'Redescends lentement sur une amplitude de poignet confortable en gardant la prise fermée.',
    ],
    [
      'Les avant-bras restent sur les cuisses',
      'Ne bouger que les poignets',
      'Petits mouvements contrôlés',
    ],
    [
      'Lever les avant-bras ou en faire un curl biceps',
      'Prendre des haltères lourds ou forcer l’amplitude du poignet',
    ],
  ),
};
