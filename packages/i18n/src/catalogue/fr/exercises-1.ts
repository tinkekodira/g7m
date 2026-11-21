import { exercise as e } from '../entry.js';
import type { ExerciseText } from '../types.js';

export const exercises1: Readonly<Record<string, ExerciseText>> = {
  'ab-crunch': e(
    'Crunch',
    ['crunch abdominal', 'relevé de buste', 'abdos'],
    [
      'Allonge-toi sur le dos, genoux fléchis et pieds à plat, mains près de la tête ou un disque sur la poitrine.',
      'Décolle les épaules du sol en enroulant le haut du dos, côtes vers le bassin.',
      'Marque une pause en haut puis redescends avec contrôle jusqu’à ce que les épaules touchent le sol.',
    ],
    ['Côtes vers le bassin', 'Le bas du dos reste au sol', 'Expire en montant'],
    [
      'Tirer sur la tête avec les mains',
      'Se redresser complètement, ce qui fait travailler les fléchisseurs de hanche',
    ],
  ),
  'ab-wheel-rollout': e(
    'Roue abdominale',
    ['roulette abdominale', 'ab wheel', 'rollout à genoux'],
    [
      'Mets-toi à genoux sur une surface confortable, les deux mains sur la roue sous les épaules. Serre les fessiers et gaine le ventre.',
      'Roule lentement vers l’avant en ouvrant épaules et hanches, côtes basses et bas du dos stable. Arrête-toi avant de perdre cette position.',
      'Ramène la roue vers les genoux, tronc gainé. Commence par de petites amplitudes et allonge-les à mesure que le contrôle progresse.',
    ],
    [
      'Côtes basses, fessiers serrés',
      'S’arrêter avant que le bas du dos se cambre',
      'Bouger épaules et hanches ensemble',
    ],
    [
      'Rouler plus loin que ce que les abdos contrôlent',
      'Se plier brusquement aux hanches pour revenir',
    ],
  ),
  'air-bike': e(
    'Air bike',
    ['assault bike', 'echo bike', 'vélo à air'],
    [
      'Règle la selle comme pour un vélo classique.',
      'Pousse et tire les poignées en même temps que tu pédales : plus tu forces, plus le ventilateur résiste.',
      'En fractionné, à fond pendant l’effort et pédalage léger pendant la récupération.',
    ],
    ['Bras et jambes ensemble', 'Expire en poussant'],
    ['Partir à fond et ne plus rien avoir à la moitié de l’intervalle'],
  ),
  'arnold-press': e(
    'Développé Arnold',
    ['arnold press', 'développé arnold haltères'],
    [
      'Debout, pieds à largeur de hanches, genoux souples. Tiens les haltères devant les épaules, paumes vers toi, coudes fléchis. Gaine abdos et fessiers.',
      'Pousse vers le haut en tournant les paumes vers l’avant et en ouvrant les coudes. Côtes au-dessus du bassin, sans élan des jambes.',
      'Redescends lentement en inversant la rotation jusqu’à revenir devant les épaules. Garde une amplitude confortable sans forcer la rotation.',
    ],
    ['Tourner en douceur en poussant', 'Côtes basses', 'Poignets au-dessus des avant-bras'],
    [
      'Cambrer le bas du dos pour finir',
      'Forcer les épaules dans une position basse inconfortable',
    ],
  ),
  'back-extension': e(
    'Extension lombaire',
    ['hyperextension', 'extension du dos à 45 degrés', 'lombaires au banc'],
    [
      'Place le coussin juste sous le pli de la hanche.',
      'Descends en pliant les hanches jusqu’à sentir l’étirement des ischios.',
      'Remonte jusqu’à ce que le corps forme une ligne droite.',
    ],
    ['S’arrêter à l’alignement, sans se cambrer', 'Serrer les fessiers en haut'],
    ['Hyperétendre la colonne en haut'],
  ),
  'barbell-back-squat': e(
    'Squat barre',
    ['squat', 'back squat', 'squat arrière'],
    [
      'Place la barre sur le haut du dos et gaine fort.',
      'Sors la barre, recule et écarte les pieds un peu plus que les hanches.',
      'Descends entre les hanches jusqu’à ce que les cuisses soient au moins parallèles, puis remonte.',
    ],
    [
      'Grande inspiration, gainage',
      'Les genoux suivent les orteils',
      'Pousse le sol avec tout le pied',
    ],
    [
      'Laisser la poitrine tomber en avant en sortant du bas',
      'Raccourcir l’amplitude quand la charge monte',
    ],
  ),
  'barbell-bench-press': e(
    'Développé couché',
    ['couché', 'développé couché barre', 'bench press'],
    [
      'Allonge-toi avec les yeux sous la barre, pieds à plat au sol.',
      'Prends la barre un peu plus large que les épaules et serre-la.',
      'Sors la barre, descends avec contrôle au milieu de la poitrine et repousse.',
    ],
    ['Poitrine haute', 'Coudes à environ 45 degrés', 'Pousse le sol avec les pieds'],
    ['Faire rebondir la barre sur la poitrine', 'Ouvrir les coudes complètement sur les côtés'],
  ),
  'barbell-calf-raise': e(
    'Mollets debout à la barre',
    ['extension mollets barre', 'mollets debout sur disque'],
    [
      'Dans un rack avec sécurités réglées, place un disque plat et stable sous l’avant des pieds, talons libres derrière le bord. Commence avec une barre légère sur le haut du dos, sous la nuque.',
      'Gaine-toi et monte sur l’avant des deux pieds aussi haut que tu contrôles, genoux souplement tendus.',
      'Marque une pause, puis descends les talons lentement jusqu’à un étirement confortable sans faire basculer le disque ni rebondir. Repose la barre avant de descendre.',
    ],
    [
      'Avant-pieds bien posés sur le disque',
      'Monter droit depuis les chevilles',
      'Contrôler l’étirement et le haut',
    ],
    [
      'Se tenir sur un disque qui bascule ou glisse',
      'Rebondir en bas ou plier les genoux pour monter la barre',
    ],
  ),
  'barbell-curl': e(
    'Curl barre',
    ['curl biceps', 'curl barre droite'],
    [
      'Debout, tiens la barre à largeur d’épaules, bras tendus.',
      'Monte la barre à hauteur d’épaules, coudes le long du corps.',
      'Redescends avec contrôle jusqu’à l’extension complète.',
    ],
    ['Coudes collés aux côtes', 'Extension complète en bas'],
    ['Donner un coup de hanches pour lancer chaque répétition'],
  ),
  'barbell-front-squat': e(
    'Squat avant',
    ['front squat', 'squat devant'],
    [
      'Pose la barre sur l’avant des épaules, coudes hauts.',
      'Descends en squat en gardant le buste droit.',
      'Remonte sans laisser tomber les coudes.',
    ],
    ['Coudes hauts', 'Poitrine haute'],
    ['Baisser les coudes, ce qui fait basculer la barre vers l’avant'],
  ),
  'barbell-hip-thrust': e(
    'Hip thrust barre',
    ['hip thrust', 'poussée de hanches', 'pont fessier à la barre'],
    [
      'Assieds-toi le haut du dos contre un banc, barre au-dessus des hanches.',
      'Monte les hanches jusqu’à ce que le buste soit parallèle au sol.',
      'Redescends avec contrôle sans poser la barre au sol.',
    ],
    ['Menton rentré, côtes basses', 'Serre fort les fessiers en haut'],
    ['Cambrer le bas du dos en haut au lieu de finir avec les fessiers'],
  ),
  'barbell-lunge': e(
    'Fente à la barre',
    ['fentes barre', 'fente avant barre'],
    [
      'Sors une barre sur le haut du dos avec une prise fermée et gaine-toi. Debout, pieds à largeur de hanches, espace libre devant.',
      'Fais un pas en avant sur un rail séparé, à largeur de hanches. Fléchis les deux genoux avec contrôle, pied avant bien ancré et bassin à niveau.',
      'Pousse sur le pied avant pour revenir à la position de départ. Alterne ou termine un côté, et note les répétitions par jambe.',
    ],
    [
      'Avancer sur deux rails',
      'Le pied avant reste ancré',
      'Contrôler le retour avant le pas suivant',
    ],
    ['Marcher comme sur un fil ou laisser le genou avant rentrer', 'Taper le genou arrière au sol'],
  ),
  'barbell-preacher-curl': e(
    'Curl pupitre (barre)',
    ['curl pupitre barre', 'curl Larry Scott', 'preacher curl'],
    [
      'Règle le pupitre pour que les aisselles reposent sur le bord supérieur.',
      'Prends une barre droite à largeur d’épaules, paumes vers le haut, et monte-la sans aller jusqu’à la verticale.',
      'Redescends lentement jusqu’à ce que les bras soient presque tendus.',
    ],
    ['Les coudes ne quittent pas le pupitre', 'Poignets droits, pas cassés en arrière'],
    [
      'Laisser tomber la charge en bas, ce qui sollicite le coude',
      'Charger comme à la barre EZ ; la prise droite est plus dure pour les poignets',
    ],
  ),
  'barbell-row': e(
    'Rowing barre',
    ['rowing buste penché', 'tirage barre penché', 'pendlay row'],
    [
      'Penche-toi depuis les hanches jusqu’à environ 45 degrés, dos plat.',
      'Tire la barre vers le bas des côtes.',
      'Redescends avec contrôle sans arrondir le dos.',
    ],
    ['Dos plat tout du long', 'Coudes au-delà des côtes'],
    ['Se redresser quand la série devient dure', 'Tirer à coups de bas du dos'],
  ),
  'barbell-shrug': e(
    'Shrug barre',
    ['shrugs', 'haussement d’épaules', 'trapèzes à la barre'],
    [
      'Tiens la barre bras tendus devant les cuisses.',
      'Monte les épaules droit vers les oreilles.',
      'Redescends avec contrôle jusqu’à l’étirement complet.',
    ],
    ['Monter et descendre droit', 'Pause en haut'],
    ['Faire rouler les épaules, ce qui n’apporte rien et irrite l’articulation'],
  ),
  'bench-dips': e(
    'Dips au banc',
    ['dips sur banc', 'dips triceps banc'],
    [
      'Assieds-toi au bord d’un banc stable, mains à côté des hanches, doigts vers l’avant. Pose les pieds et avance les hanches juste devant le bord. Commence genoux fléchis.',
      'Plie les coudes vers l’arrière et descends les hanches près du banc seulement aussi bas que tes épaules le permettent confortablement.',
      'Pousse sur les paumes pour tendre les coudes et remonter les hanches. Garde la poitrine ouverte et arrête si la position de l’épaule est inconfortable.',
    ],
    ['Hanches près du banc', 'Épaules basses', 'Amplitude courte et confortable'],
    [
      'Descendre les épaules bien sous les coudes',
      'Laisser le banc glisser ou les hanches partir loin devant',
    ],
  ),
  'bicycle-crunch': e(
    'Crunch vélo',
    ['bicycle crunch', 'crunch bicyclette'],
    [
      'Allonge-toi sur le dos, genoux fléchis au-dessus des hanches, mains posées légèrement près de la tête. Décolle un peu les omoplates et gaine le ventre.',
      'Tourne la poitrine vers un genou plié en tendant la jambe opposée. Amène l’épaule vers le genou sans tirer sur la tête.',
      'Change de côté lentement, bas du dos stable. Chaque côté compte pour une répétition.',
    ],
    [
      'Tourner la poitrine, pas seulement le coude',
      'Mains à peine posées près de la tête',
      'Tendre la jambe seulement aussi bas que tu contrôles',
    ],
    ['Tirer la nuque vers l’avant avec les mains', 'Pédaler vite sans tourner le buste'],
  ),
  'box-squat': e(
    'Box squat',
    ['squat sur box', 'squat assis sur caisse'],
    [
      'Place une box stable derrière toi dans un rack avec sécurités. Choisis une hauteur que tu atteins avec contrôle. Sors une barre sur le haut du dos et place tes pieds.',
      'Gaine-toi, plie hanches et genoux et assieds-toi vers l’arrière sur la box, pieds ancrés, genoux dans l’axe des orteils.',
      'Pose-toi en douceur et marque une courte pause en gardant le gainage et la pression des pieds.',
      'Pousse sur les deux pieds pour te relever sans basculer en avant ni rebondir sur la box.',
    ],
    [
      'S’asseoir en douceur et avec contrôle',
      'Rester gainé sur la box',
      'Se relever sans basculer',
    ],
    [
      'Se laisser tomber sur la box ou relâcher le bas du dos',
      'Utiliser une box instable ou trop basse',
    ],
  ),
  'bulgarian-split-squat': e(
    'Squat bulgare',
    ['fente bulgare', 'split squat pied surélevé'],
    [
      'Pose le pied arrière sur un banc derrière toi.',
      'Descends jusqu’à ce que la cuisse avant soit à peu près parallèle.',
      'Remonte en poussant sur le pied avant.',
    ],
    ['Poids sur le talon avant', 'Buste légèrement penché pour les fessiers'],
    ['Se placer trop près du banc, ce qui coince le genou avant'],
  ),
  burpees: e(
    'Burpees',
    ['burpee'],
    [
      'Debout, pieds à largeur d’épaules. Accroupis-toi et pose les deux paumes fermement au sol devant toi.',
      'Saute ou recule les deux pieds en planche haute bien gainée. Cette version n’inclut pas de pompe ; hanches alignées avec les épaules.',
      'Ramène les pieds à l’extérieur des mains, relève la poitrine et termine par un petit saut vertical, bras au-dessus de la tête.',
      'Réceptionne-toi en douceur et enchaîne avec contrôle. Squat, planche, retour et saut comptent pour une répétition.',
    ],
    [
      'Se gainer avant de reculer les pieds',
      'Pieds à l’extérieur des mains',
      'Atterrir en douceur et se replacer',
    ],
    ['Laisser les hanches s’affaisser en planche', 'Revenir trop vite ou atterrir genoux raides'],
  ),
  'cable-crunch': e(
    'Crunch à la poulie',
    ['crunch poulie haute à genoux', 'crunch à la corde'],
    [
      'À genoux, dos à une poulie haute, la corde près de la tête.',
      'Enroule-toi vers le bas en arrondissant la colonne, sans plier les hanches.',
      'Reviens avec contrôle.',
    ],
    ['Les hanches restent fixes', 'Enrouler la colonne volontairement'],
    ['En faire une flexion de hanches et travailler les fléchisseurs de hanche'],
  ),
  'cable-curl': e(
    'Curl à la poulie',
    ['curl biceps poulie', 'curl à la corde'],
    [
      'Debout face à une poulie basse avec une barre droite ou une corde.',
      'Monte jusqu’aux épaules, coudes le long du corps.',
      'Redescends jusqu’à bras tendus en gardant la tension du câble.',
    ],
    ['Coudes immobiles', 'Contracter en haut'],
    ['Se pencher en arrière pour finir la répétition'],
  ),
  'cable-fly': e(
    'Écarté à la poulie',
    ['vis-à-vis poulies', 'crossover', 'écartés poulie'],
    [
      'Règle les deux poulies à hauteur d’épaules ou plus haut.',
      'Avance en fente, coudes légèrement fléchis.',
      'Ramène les poignées devant la poitrine, puis reviens avec contrôle.',
    ],
    ['Angle des coudes fixe', 'Contracter au centre'],
    ['En faire un développé en pliant et tendant les coudes'],
  ),
  'cable-hammer-curl': e(
    'Curl marteau à la poulie',
    ['curl marteau corde', 'curl prise neutre poulie'],
    [
      'Fixe une corde à une poulie basse. Face à la machine, tiens un bout dans chaque main, paumes face à face, pouces en haut.',
      'Debout, coudes contre les côtes, monte la corde vers les épaules sans bouger les bras.',
      'Redescends lentement presque jusqu’à l’extension, poignets neutres et charge sous contrôle.',
    ],
    ['Pouces en haut', 'Coudes contre les côtes', 'Redescendre sans élan'],
    ['Se pencher en arrière pour bouger la charge', 'Casser les poignets ou avancer les coudes'],
  ),
  'cable-kickback': e(
    'Kickback fessier à la poulie',
    ['kickback poulie', 'extension de hanche poulie'],
    [
      'Attache une sangle de cheville à une poulie basse autour d’une cheville. Face à la machine, tiens-toi des deux mains, genou d’appui souple.',
      'Gaine-toi, légèrement penché en avant. Envoie la jambe vers l’arrière depuis la hanche, bassin de face, genou légèrement fléchi.',
      'Arrête avant que le bas du dos se cambre, puis reviens lentement sans reposer la charge. Fais les deux côtés et note les répétitions par jambe.',
    ],
    ['Bouger depuis la hanche', 'Bassin bien de face', 'S’arrêter avant de se cambrer'],
    ['Balancer la jambe ou tourner le bassin', 'Cambrer le dos pour monter le pied plus haut'],
  ),
  'cable-lat-pullover': e(
    'Pull-over à la poulie',
    ['pullover poulie', 'pull-over corde', 'pullover dorsaux'],
    [
      'Prends une corde à la poulie haute, recule et penche-toi jusqu’à avoir les bras au-dessus de la tête.',
      'Coudes souples et fixes, tire la corde en arc jusqu’aux hanches.',
      'Laisse-la remonter jusqu’à sentir l’étirement des dorsaux.',
    ],
    ['Hanches en arrière, poitrine vers le bas', 'Finir les mains près des hanches'],
    [
      'Plier les coudes et en faire une extension triceps',
      'Se tenir droit, ce qui raccourcit l’étirement',
    ],
  ),
  'cable-lateral-raise': e(
    'Élévation latérale à la poulie',
    ['élévation latérale unilatérale poulie', 'élévations latérales câble'],
    [
      'De profil à une poulie basse, prends la poignée avec la main la plus éloignée, câble croisé devant les cuisses. Stabilise-toi avec l’autre main.',
      'Coude légèrement et fixement fléchi, monte le bras sur le côté jusqu’à hauteur d’épaule, sans te pencher ni hausser l’épaule.',
      'Redescends lentement devant le corps en gardant la tension. Fais les deux côtés et note les répétitions par bras.',
    ],
    ['Mener avec le coude', 'Buste immobile', 'S’arrêter à hauteur d’épaule'],
    ['Se balancer en s’éloignant de la machine', 'Hausser l’épaule ou changer l’angle du coude'],
  ),
  'cable-woodchop': e(
    'Bûcheron à la poulie',
    ['bûcheron', 'woodchop', 'rotation à la poulie'],
    [
      'Règle un câble à hauteur d’épaules et place-toi de profil.',
      'Prends la poignée à deux mains, bras presque tendus.',
      'Tourne depuis le tronc et tire en travers du corps, puis reviens lentement.',
    ],
    ['Tourner depuis les côtes, pas les bras', 'Hanches face à l’avant'],
    ['Tirer avec les bras au lieu de tourner le buste'],
  ),
  'chest-dip': e(
    'Dips (pectoraux)',
    ['dips', 'dips pectoraux', 'dips aux barres parallèles'],
    [
      'Mets-toi en appui sur les barres, bras tendus.',
      'Penche le buste d’environ 30 degrés et laisse les coudes s’ouvrir un peu.',
      'Descends jusqu’à ce que les bras soient horizontaux, puis repousse.',
    ],
    ['Se pencher pour cibler les pectoraux', 'Épaules loin des oreilles'],
    [
      'Descendre plus bas que ce que les épaules tolèrent',
      'Rester droit, ce qui en fait des dips triceps',
    ],
  ),
  'chest-supported-dumbbell-row': e(
    'Rowing haltères buste appuyé',
    ['rowing appuyé sur banc incliné', 'rowing poitrine appuyée'],
    [
      'Règle un banc entre 30 et 45 degrés et allonge-toi face au dossier, poitrine dessus.',
      'Laisse pendre un haltère dans chaque main.',
      'Tire les deux coudes en arrière au-delà du buste, contracte, puis redescends jusqu’à l’étirement complet.',
    ],
    ['La poitrine reste sur le dossier', 'Mener avec les coudes', 'Serrer les omoplates'],
    ['Décoller la poitrine pour arracher la charge', 'Hausser les épaules vers les oreilles'],
  ),
  'chin-up': e(
    'Traction supination',
    ['chin-up', 'tractions prise inversée', 'traction supination'],
    [
      'Suspends-toi à la barre en supination, mains à largeur d’épaules.',
      'Monte jusqu’à ce que le menton dépasse la barre.',
      'Redescends avec contrôle jusqu’à la suspension complète.',
    ],
    ['Tirer les coudes vers le bas et l’arrière', 'Suspension complète en bas'],
    ['Raccourcir le bas de la répétition'],
  ),
  'clean-and-jerk': e(
    'Épaulé-jeté',
    ['clean and jerk', 'épaulé jeté olympique'],
    [
      'Utilise une zone dégagée avec des disques bumper et apprends séparément l’épaulé, la position front rack et le jeté fendu avec une barre légère avant de les enchaîner. Barre au-dessus du milieu du pied, mains à l’extérieur des jambes, dos gainé.',
      'Pousse le sol en gardant la barre proche au passage des genoux. Étends jambes et hanches, puis passe sous la barre pour la recevoir sur l’avant des épaules, coudes devant.',
      'Relève-toi complètement de l’épaulé, installe la barre en front rack et gaine-toi pour le jeté.',
      'Fléchis légèrement à la verticale, pousse avec les jambes, puis passe sous la barre en fente stable, coudes verrouillés. Pieds sur deux rails à largeur de hanches.',
      'Sors de la fente par des pas contrôlés jusqu’à joindre les pieds, barre stable au-dessus de la tête. Repose la barre d’une manière maîtrisée et adaptée à la charge. Un épaulé plus un jeté font une répétition.',
    ],
    [
      'Barre proche pendant l’épaulé',
      'Se relever et se stabiliser avant le jeté',
      'Fléchir à la verticale et pousser avec les jambes',
      'Recevoir le jeté sur deux rails',
    ],
    [
      'Tirer trop tôt avec les bras ou éloigner la barre',
      'Jeter depuis un front rack instable',
      'Recevoir coudes mous ou pieds sur une ligne',
    ],
  ),
  'close-grip-bench-press': e(
    'Développé couché prise serrée',
    ['couché serré', 'développé prise serrée'],
    [
      'Prends la barre à peu près à largeur d’épaules.',
      'Descends vers le bas de la poitrine, coudes serrés.',
      'Repousse en t’appuyant sur les triceps.',
    ],
    ['Coudes rentrés à environ 30 degrés', 'Poignets au-dessus des coudes'],
    ['Serrer la prise au point d’avoir mal aux poignets'],
  ),
  'close-grip-dumbbell-bench-press': e(
    'Développé haltères prise serrée',
    ['squeeze press', 'développé haltères serrés'],
    [
      'Allonge-toi sur un banc plat, pieds ancrés et haut du dos appuyé. Tiens deux haltères serrés au-dessus de la poitrine, paumes face à face.',
      'Poignets droits et coudes près du corps, descends les haltères vers le bas de la poitrine. Les charges restent à niveau et collées.',
      'Pousse les deux haltères ensemble jusqu’à bras tendus sans claquer les coudes. Garde la prise neutre et serrée tout du long.',
    ],
    ['Haltères serrés et à niveau', 'Poignets au-dessus des avant-bras', 'Coudes près des côtes'],
    [
      'Laisser un haltère basculer ou devancer l’autre',
      'Ouvrir les coudes ou perdre la position neutre des poignets',
    ],
  ),
  'close-grip-incline-bench-press': e(
    'Développé incliné prise serrée',
    ['développé incliné barre prise serrée'],
    [
      'Règle un banc incliné à environ 30 degrés dans un rack avec sécurités. Allonge-toi, pieds ancrés, et prends la barre en pronation fermée à largeur d’épaules.',
      'Sors la barre au-dessus du haut de la poitrine. Descends avec contrôle vers celle-ci, poignets au-dessus des avant-bras, coudes orientés vers le buste.',
      'Pousse sur la même trajectoire sans lever les hanches. Utilise un pareur ou des sécurités bien réglées et repose la barre solidement.',
    ],
    [
      'Prise fermée à largeur d’épaules',
      'Le haut du dos reste sur le banc',
      'Descendre poignets au-dessus des avant-bras',
    ],
    [
      'Serrer au point de casser les poignets sur le côté',
      'Ouvrir les coudes ou faire rebondir la barre',
    ],
  ),
  'close-grip-lat-pulldown': e(
    'Tirage vertical prise serrée',
    ['tirage prise neutre', 'tirage poignée triangle', 'tirage serré poitrine'],
    [
      'Fixe une poignée triangle serrée au tirage vertical et règle le coussin de cuisses pour bien te caler. Tiens les deux poignées, paumes face à face, pouces refermés.',
      'Assieds-toi droit avec une légère inclinaison fixe vers l’arrière. Tire la poignée vers le haut de la poitrine en descendant les coudes le long des côtes.',
      'Remonte lentement jusqu’aux bras longs et un étirement confortable, sans basculer ni laisser la charge claquer.',
    ],
    ['Descendre les coudes', 'Poignets droits', 'Angle du buste stable'],
    [
      'Basculer en arrière pour bouger la charge',
      'Tirer derrière la nuque ou enrouler les poignets',
    ],
  ),
  'concentration-curl': e(
    'Curl concentré',
    ['curl concentration assis', 'curl unilatéral'],
    [
      'Assieds-toi sur un banc et cale l’arrière d’un bras contre l’intérieur de la cuisse.',
      'Monte l’haltère vers l’épaule.',
      'Redescends avec contrôle jusqu’à bras tendu, puis change de côté.',
    ],
    ['Le bras reste contre la cuisse', 'Lentement à la descente'],
    ['Pousser le bras avec la cuisse'],
  ),
  'conventional-deadlift': e(
    'Soulevé de terre',
    ['soulevé de terre classique', 'deadlift', 'SDT'],
    [
      'Place le milieu du pied sous la barre, tibias proches.',
      'Penche-toi depuis les hanches, prends la barre juste à l’extérieur des jambes et mets-la en tension.',
      'Relève-toi en repoussant le sol et termine bien droit.',
    ],
    ['Dos plat, poitrine haute', 'La barre reste contre les jambes', 'Serre les fessiers en haut'],
    ['Arrondir le bas du dos', 'Arracher la barre du sol'],
  ),
  'decline-ab-crunch': e(
    'Crunch décliné',
    ['crunch sur banc décliné', 'abdos décliné'],
    [
      'Cale les pieds sous les boudins d’un banc décliné et allonge-toi, mains près de la tête ou un disque sur la poitrine.',
      'Monte les épaules en enroulant le haut du dos, côtes vers le bassin.',
      'Redescends avec contrôle et arrête-toi avant que les épaules touchent le banc pour garder la tension.',
    ],
    ['Enrouler la colonne, pas plier les hanches', 'Lentement à la descente', 'Expire en montant'],
    [
      'Monter avec de l’élan et retomber',
      'Se redresser complètement, ce qui donne le travail aux fléchisseurs de hanche',
    ],
  ),
  'decline-bench-press': e(
    'Développé décliné',
    ['développé décliné barre', 'couché décliné'],
    [
      'Cale tes jambes sur un banc légèrement décliné sous une barre en rack. Règle les sécurités ou prends un pareur. Tête, dos et hanches appuyés.',
      'Prends une prise fermée un peu plus large que les épaules et sors la barre. Descends-la lentement vers le bas de la poitrine, poignets au-dessus des coudes.',
      'Repousse au-dessus des épaules sans rebond ni lever les hanches. Repose la barre en sécurité avant de la lâcher ou de quitter le banc.',
    ],
    [
      'Caler les jambes avant de sortir la barre',
      'Descendre vers le bas de la poitrine',
      'Épaules contre le banc',
    ],
    [
      'Faire rebondir la barre ou ouvrir les coudes',
      'Commencer sans jambes calées ni plan sûr pour reposer la barre',
    ],
  ),
  'decline-dumbbell-bench-press': e(
    'Développé décliné haltères',
    ['développé haltères décliné'],
    [
      'Cale les jambes sur un banc légèrement décliné et amène les haltères à hauteur de poitrine de façon contrôlée ou avec un pareur. Tête, épaules et hanches appuyées.',
      'Pousse les haltères au-dessus de la poitrine, poignets au-dessus des coudes, paumes vers l’avant ou légèrement vers l’intérieur.',
      'Redescends lentement jusqu’à une position confortable à hauteur de poitrine, coudes orientés vers l’arrière, puis repousse. Sors du banc avec contrôle après la dernière répétition.',
    ],
    [
      'Jambes bien calées',
      'Poignets au-dessus des coudes',
      'Contrôler l’installation et la sortie',
    ],
    [
      'Ouvrir les coudes ou descendre au-delà du confortable',
      'Essayer de se redresser avec de lourds haltères en position instable',
    ],
  ),
  'decline-dumbbell-fly': e(
    'Écarté décliné haltères',
    ['écartés haltères banc décliné'],
    [
      'Cale les jambes sur un banc légèrement décliné et amène des haltères légers au-dessus de la poitrine, paumes face à face. Prévois une entrée et une sortie contrôlées.',
      'Coudes légèrement et fixement fléchis, ouvre les bras en un large arc. Arrête quand les bras arrivent à peu près au niveau du buste, ou plus tôt si besoin.',
      'Ramène les haltères au-dessus de la poitrine par le même arc sans changer l’angle des coudes ni entrechoquer les charges.',
    ],
    [
      'Angle des coudes fixe',
      'Charges légères et contrôlées',
      'S’arrêter à un étirement confortable',
    ],
    ['Descendre les bras bien sous le buste', 'Plier les coudes et en faire un développé'],
  ),
  'decline-push-up': e(
    'Pompe déclinée',
    ['pompes pieds surélevés', 'pompe déclinée'],
    [
      'Pose les pieds sur un banc bas et stable et les mains au sol un peu plus larges que les épaules.',
      'Gaine-toi en ligne droite des épaules aux talons et descends la poitrine vers le sol, coudes orientés vers l’arrière.',
      'Repousse le sol jusqu’à bras tendus, hanches alignées avec le buste.',
    ],
    [
      'Hanches au niveau du buste',
      'Descendre la poitrine entre les mains',
      'Commencer avec une faible surélévation',
    ],
    ['Lever ou creuser les hanches', 'Utiliser un appui instable ou trop haut'],
  ),
  'decline-smith-bench-press': e(
    'Développé décliné à la Smith',
    ['développé décliné smith machine'],
    [
      'Centre un banc légèrement décliné sous la barre de la Smith, cale les jambes et règle les butées de sécurité. Teste la barre vide pour qu’elle descende vers le bas de la poitrine.',
      'Allonge-toi, tête, épaules et hanches appuyées. Prends une prise fermée un peu plus large que les épaules, libère les crochets et descends lentement.',
      'Pousse le long des rails sans rebond ni lever les hanches. Tourne la barre sur les deux crochets et vérifie qu’elle est bien accrochée avant de lâcher.',
    ],
    [
      'Tester la trajectoire avant de charger',
      'Butées sous ta position la plus basse',
      'Vérifier les deux crochets avant de lâcher',
    ],
    [
      'Placer le banc de sorte que la barre aille vers le cou',
      'Oublier les butées ou lâcher une barre non accrochée',
    ],
  ),
  'diamond-push-ups': e(
    'Pompes diamant',
    ['pompe diamant', 'pompes prise serrée'],
    [
      'Commence en planche haute, mains rapprochées sous la poitrine. Pouces et index forment un diamant si c’est confortable, sinon laisse un peu d’espace pour les poignets.',
      'Gaine le tronc et plie les coudes vers l’arrière pour descendre la poitrine vers les mains.',
      'Repousse jusqu’à bras tendus, corps aligné. Garde les genoux au sol pour une version plus facile.',
    ],
    [
      'Coudes orientés vers l’arrière',
      'Hanches alignées',
      'Choisir une position de mains confortable pour les poignets',
    ],
    ['Ouvrir les coudes ou hausser les épaules', 'Creuser le bas du dos pour atteindre les mains'],
  ),
  'dumbbell-bench-press': e(
    'Développé couché haltères',
    ['développé haltères', 'couché haltères'],
    [
      'Assieds-toi avec les haltères sur les cuisses, puis ramène-les d’un coup de genoux en t’allongeant.',
      'Descends jusqu’à ce que les bras soient au niveau du buste.',
      'Pousse vers le haut en rapprochant légèrement les haltères.',
    ],
    ['Poignets au-dessus des coudes', 'Contrôler la descente'],
    ['Laisser les haltères trop s’écarter en bas'],
  ),
  'dumbbell-curl': e(
    'Curl haltères',
    ['curl biceps haltères', 'curl alterné'],
    [
      'Debout, un haltère dans chaque main, bras tendus, paumes vers l’avant.',
      'Monte jusqu’aux épaules, coudes le long du corps.',
      'Redescends avec contrôle jusqu’à l’extension complète, ensemble ou en alterné.',
    ],
    ['Coudes collés aux côtes', 'Extension complète en bas'],
    ['Donner un coup de hanches pour lancer chaque répétition', 'Laisser les coudes avancer'],
  ),
  'dumbbell-preacher-curl': e(
    'Curl pupitre (haltère)',
    ['curl pupitre haltère', 'curl Larry Scott unilatéral'],
    [
      'Règle le pupitre pour qu’une aisselle repose sur le bord supérieur, l’haltère dans cette main.',
      'Monte-le en t’arrêtant avant la verticale pour garder la tension.',
      'Redescends lentement jusqu’à ce que le bras soit presque tendu, puis change de côté.',
    ],
    ['Le coude reste sur le pupitre', 'Tourner l’auriculaire vers le haut en fin de mouvement'],
    ['Laisser tomber la charge en bas, ce qui sollicite le coude'],
  ),
  'dumbbell-pullover': e(
    'Pull-over haltère',
    ['pullover', 'pull-over sur banc'],
    [
      'Allonge-toi dans la longueur ou en travers d’un banc plat avec un haltère au-dessus de la poitrine.',
      'Descends-le derrière la tête, coudes à peine fléchis.',
      'Ramène-le au-dessus de la poitrine sans ouvrir les côtes.',
    ],
    ['Côtes basses', 'S’arrêter où l’étirement s’arrête, pas où l’épaule cède'],
    [
      'Laisser les coudes plier, ce qui donne le travail aux triceps',
      'Descendre plus bas que confortable pour l’épaule par goût de l’amplitude',
    ],
  ),
  'dumbbell-romanian-deadlift': e(
    'Soulevé de terre roumain haltères',
    ['SDT roumain haltères', 'RDL haltères', 'soulevé jambes tendues haltères'],
    [
      'Debout, pieds à largeur de hanches, un haltère dans chaque main devant les cuisses. Genoux souples, tronc gainé.',
      'Pousse les hanches vers l’arrière et laisse les haltères descendre près des jambes, bras tendus. Colonne stable, flexion des genoux presque inchangée.',
      'Arrête à un étirement contrôlé des ischios avant que le dos s’arrondisse, puis pousse les hanches vers l’avant pour te relever. Les charges n’ont pas besoin de toucher le sol.',
    ],
    [
      'Envoyer les hanches en arrière',
      'Charges près des jambes',
      'Finir droit sans se pencher en arrière',
    ],
    ['S’accroupir en pliant les genoux à chaque fois', 'Chercher le sol en arrondissant le dos'],
  ),
  'dumbbell-shoulder-press': e(
    'Développé épaules haltères',
    ['développé militaire haltères', 'développé assis haltères'],
    [
      'Assieds-toi dos appuyé, haltères à hauteur des oreilles.',
      'Pousse au-dessus de la tête jusqu’à bras tendus.',
      'Redescends avec contrôle à hauteur des oreilles.',
    ],
    ['Poignets au-dessus des coudes', 'Ne pas cambrer le bas du dos'],
    ['Des demi-répétitions qui n’atteignent jamais les oreilles'],
  ),
};
