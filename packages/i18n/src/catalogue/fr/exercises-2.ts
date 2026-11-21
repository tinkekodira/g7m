import { exercise as e } from '../entry.js';
import type { ExerciseText } from '../types.js';

export const exercises2: Readonly<Record<string, ExerciseText>> = {
  'dumbbell-shrug': e(
    'Shrug haltères',
    ['shrugs haltères', 'haussement d’épaules haltères'],
    [
      'Debout, pieds à largeur de hanches, un haltère dans chaque main le long du corps, paumes vers les cuisses.',
      'Poitrine haute, tête neutre, bras tendus. Monte les deux épaules vers les oreilles sans plier les coudes ni faire rouler les épaules.',
      'Marque une courte pause en haut, puis redescends lentement jusqu’à un étirement confortable.',
      'Répète buste immobile avec la même amplitude contrôlée des deux côtés. Repose les haltères avec contrôle à la fin.',
    ],
    ['Épaules droit vers le haut et le bas', 'Bras tendus', 'Pause en haut', 'Tête neutre'],
    [
      'Faire rouler les épaules',
      'Plier les coudes ou rebondir avec les jambes',
      'Avancer la tête',
      'Prendre une charge qui empêche une montée contrôlée',
    ],
  ),
  'ez-bar-curl': e(
    'Curl barre EZ',
    ['curl EZ', 'curl biceps barre EZ'],
    [
      'Debout, tiens la barre EZ par les prises inclinées, bras tendus.',
      'Monte la barre à hauteur d’épaules, coudes le long du corps.',
      'Redescends avec contrôle jusqu’à l’extension complète.',
    ],
    ['Coudes collés aux côtes', 'Extension complète en bas'],
    ['Donner un coup de hanches pour lancer chaque répétition'],
  ),
  'face-pull': e(
    'Face pull',
    ['tirage visage', 'face pull à la corde'],
    [
      'Règle une corde à peu près à hauteur du visage.',
      'Tire la corde vers le visage en écartant les extrémités.',
      'Termine les mains près des oreilles, coudes hauts.',
    ],
    ['Coudes au-dessus des poignets', 'Écarter, pas seulement tirer'],
    ['Mettre une charge si lourde que le buste bascule en arrière'],
  ),
  'farmer-carry': e(
    'Marche du fermier',
    ['farmer walk', 'portage de charges'],
    [
      'Prends un haltère ou une kettlebell lourde dans chaque main.',
      'Tiens-toi droit, épaules en arrière.',
      'Marche en ligne droite sur une distance ou une durée.',
    ],
    ['Posture haute, sans se pencher', 'Serrer fort les poignées'],
    ['Laisser les épaules s’enrouler sous la charge'],
  ),
  'flat-bench-dumbbell-fly': e(
    'Écarté couché haltères',
    ['écartés haltères', 'écarté sur banc plat'],
    [
      'Allonge-toi sur un banc plat, pieds ancrés. Tiens des haltères légers au-dessus de la poitrine, paumes face à face, coudes légèrement fléchis.',
      'Ouvre les bras en un large arc en gardant cet angle. Arrête à un étirement confortable, bras à peu près alignés avec le buste.',
      'Ramène les haltères au-dessus de la poitrine par le même arc, comme une étreinte, sans transformer le mouvement en développé.',
    ],
    [
      'Coudes légèrement et fixement fléchis',
      'Ouvrir et fermer comme une étreinte',
      'Étirement confortable des pectoraux',
    ],
    [
      'Descendre les charges bien sous le buste',
      'Tendre complètement les coudes ou pousser les charges',
    ],
  ),
  'goblet-squat': e(
    'Goblet squat',
    ['squat gobelet', 'squat kettlebell'],
    [
      'Tiens un haltère ou une kettlebell à hauteur de poitrine.',
      'Descends en squat entre les genoux, poitrine haute.',
      'Remonte en poussant avec tout le pied.',
    ],
    ['Coudes à l’intérieur des genoux en bas', 'Poitrine fière'],
    ['Laisser les talons décoller du sol'],
  ),
  'hack-squat': e(
    'Hack squat',
    ['hack squat machine'],
    [
      'Place les épaules sous les coussins, pieds au milieu de la plateforme.',
      'Descends jusqu’à ce que les cuisses soient au moins parallèles.',
      'Remonte en poussant avec tout le pied.',
    ],
    ['Dos plaqué contre le dossier', 'Genoux dans l’axe des orteils'],
    ['Rebondir en sortant du bas'],
  ),
  'hammer-curl': e(
    'Curl marteau',
    ['curl marteau haltères', 'curl prise neutre'],
    [
      'Tiens les haltères paumes face à face.',
      'Monte jusqu’aux épaules sans tourner les poignets.',
      'Redescends avec contrôle.',
    ],
    ['Pouces en haut tout du long', 'Coudes immobiles'],
    ['Tourner en curl classique à mi-parcours'],
  ),
  'handstand-push-ups': e(
    'Pompes en équilibre',
    ['pompes poirier', 'HSPU', 'pompes en équilibre libre'],
    [
      'Il s’agit d’une pompe en équilibre libre et stricte. Développe d’abord un équilibre stable et pratique une sortie contrôlée dans un espace dégagé ; utilise des progressions en pike ou avec appui pendant l’apprentissage.',
      'Monte en équilibre, paumes à largeur d’épaules, doigts écartés, tronc gainé. Jambes serrées au-dessus des hanches.',
      'Plie les coudes avec contrôle en amenant la tête vers un point légèrement devant les mains. Ne descends que jusqu’où tu peux remonter sans poser de poids sur la tête.',
      'Pousse fort dans les paumes jusqu’à bras tendus et retrouve l’équilibre. Ne donne pas de coup de jambes pour finir ; sors de l’équilibre avant de perdre le contrôle.',
    ],
    ['Écarter les doigts et pousser dans les paumes', 'Tronc gainé', 'Pas de poids sur la tête'],
    [
      'S’effondrer sur la tête ou la nuque',
      'Donner des coups de jambes ou tenter sans sortie contrôlée',
    ],
  ),
  'hanging-knee-raise': e(
    'Relevé de genoux suspendu',
    ['relevé de genoux à la barre', 'genoux poitrine suspendu'],
    [
      'Suspends-toi à une barre solide en pronation fermée, bras longs. Active les épaules et laisse le corps s’immobiliser.',
      'Plie les deux genoux et monte-les vers la poitrine en enroulant légèrement le bassin, plutôt qu’en montant seulement les cuisses.',
      'Redescends lentement jusqu’à la suspension sans te balancer. Une montée et une descente des deux genoux font une répétition.',
    ],
    [
      'Démarrer chaque répétition sans balancement',
      'Enrouler le bassin vers les côtes',
      'Redescendre les genoux lentement',
    ],
    [
      'Se servir d’un balancement pour monter les genoux',
      'Laisser tomber les jambes ou s’affaisser dans les épaules',
    ],
  ),
  'hanging-leg-raise': e(
    'Relevé de jambes suspendu',
    ['relevé de jambes à la barre', 'leg raise suspendu'],
    [
      'Suspends-toi à une barre, épaules actives.',
      'Monte les jambes jusqu’à ce que les hanches s’enroulent légèrement.',
      'Redescends avec contrôle, sans te balancer.',
    ],
    ['Enrouler le bassin en haut', 'Pas de balancement entre les répétitions'],
    ['Utiliser l’élan et ne bouger qu’aux hanches'],
  ),
  'hip-abduction-machine': e(
    'Machine à abducteurs',
    ['abducteurs', 'abduction de hanche', 'machine fessiers'],
    [
      'Assieds-toi le dos contre le dossier, genoux contre les coussins extérieurs.',
      'Écarte les genoux aussi loin que c’est confortable.',
      'Ramène-les avec contrôle au lieu de laisser la charge les refermer.',
    ],
    [
      'Rester droit ; se pencher change la partie des fessiers qui travaille',
      'Pause au point le plus ouvert',
    ],
    [
      'Prendre toute la pile et bouger de cinq centimètres',
      'Basculer le buste pour gagner les derniers degrés',
    ],
  ),
  'hip-adduction-machine': e(
    'Machine à adducteurs',
    ['adducteurs', 'adduction de hanche', 'intérieur des cuisses'],
    [
      'Assieds-toi le dos contre le dossier, genoux contre les coussins intérieurs.',
      'Serre les genoux jusqu’à ce que les coussins se touchent presque.',
      'Laisse-les se rouvrir avec contrôle, seulement jusqu’à un étirement confortable.',
    ],
    ['Serrer, pas balancer', 'Arrêter le retour là où l’étirement commence, pas là où ça fait mal'],
    [
      'Charger tellement que le retour devient une chute',
      'Ouvrir plus que les hanches ne sont échauffées',
    ],
  ),
  'incline-barbell-press': e(
    'Développé incliné barre',
    ['développé incliné', 'couché incliné'],
    [
      'Règle le banc à environ 30 degrés.',
      'Sors la barre et descends-la sur le haut de la poitrine.',
      'Pousse vers le haut et légèrement vers l’arrière au-dessus des épaules.',
    ],
    ['Rester calé contre le banc', 'Barre vers la clavicule, pas vers la gorge'],
    ['Régler le banc trop droit, ce qui en fait un développé épaules'],
  ),
  'incline-cable-curl': e(
    'Curl incliné aux poulies',
    ['curl biceps sur banc incliné aux poulies'],
    [
      'Centre un banc légèrement incliné entre deux poulies basses, tête vers la machine. Prends une poignée dans chaque main et allonge-toi, pieds ancrés, paumes vers l’avant.',
      'Bras pendants le long ou légèrement derrière le buste ; monte les deux poignées vers les épaules. Les câbles ne touchent ni le banc ni le corps.',
      'Redescends lentement presque jusqu’à l’extension sans décoller le dos ni avancer les bras.',
    ],
    ['Le dos reste sur le banc', 'Câbles bien dégagés', 'Bras immobiles'],
    [
      'Placer le banc de sorte que les câbles frottent le cadre ou le corps',
      'Lever les épaules pour balancer les poignées',
    ],
  ),
  'incline-dumbbell-curl': e(
    'Curl incliné haltères',
    ['curl incliné', 'curl sur banc incliné'],
    [
      'Assieds-toi sur un banc incliné à environ 45 degrés, bras pendants.',
      'Monte les haltères sans avancer les coudes.',
      'Redescends complètement jusqu’à l’étirement.',
    ],
    ['Les coudes restent derrière le corps', 'Maîtriser l’étirement en bas'],
    ['Décoller les épaules du banc pour lancer la charge'],
  ),
  'incline-dumbbell-fly': e(
    'Écarté incliné haltères',
    ['écartés sur banc incliné'],
    [
      'Règle un banc légèrement incliné, autour de 30 degrés. Allonge-toi, pieds ancrés, haltères légers au-dessus du haut de la poitrine, paumes face à face.',
      'Garde les coudes légèrement et fixement fléchis et ouvre les bras en arc jusqu’à ce qu’ils soient à peu près au niveau du buste ou que la poitrine soit confortablement étirée.',
      'Rapproche les haltères au-dessus du haut de la poitrine par le même arc, sans les entrechoquer ni changer l’angle des coudes.',
    ],
    ['Inclinaison modérée', 'Angle des coudes fixe', 'Contrôler l’étirement en bas'],
    ['Descendre les bras loin derrière le buste', 'Pousser au lieu d’ouvrir ou prendre trop lourd'],
  ),
  'incline-dumbbell-press': e(
    'Développé incliné haltères',
    ['incliné haltères', 'développé haltères incliné'],
    [
      'Règle le banc à environ 30 degrés.',
      'Descends les haltères à hauteur de poitrine, coudes sous les poignets.',
      'Pousse jusqu’à bras tendus.',
    ],
    ['Côtes basses', 'Ne pas entrechoquer les haltères en haut'],
    ['Hausser les épaules vers les oreilles'],
  ),
  'incline-hammer-curl': e(
    'Curl marteau incliné',
    ['curl marteau sur banc incliné'],
    [
      'Assieds-toi contre un banc incliné entre 45 et 60 degrés, pieds ancrés. Laisse pendre les haltères le long du corps, paumes vers l’intérieur.',
      'Bras immobiles, monte les haltères vers les épaules sans tourner les paumes vers le haut.',
      'Redescends lentement presque jusqu’à l’extension, dos contre le dossier.',
    ],
    ['Paumes vers l’intérieur', 'Bras immobiles', 'Dos appuyé'],
    ['Balancer les épaules vers l’avant', 'Tourner les paumes vers le haut ou raccourcir le bas'],
  ),
  'incline-machine-chest-press': e(
    'Presse inclinée à la machine',
    ['développé incliné machine', 'presse pectoraux inclinée'],
    [
      'Choisis une charge maîtrisable. Sur une machine à disques, charge les deux côtés de façon égale. Règle le siège ou le dossier pour que les poignées partent à côté du haut de la poitrine.',
      'Appuie-toi contre le dossier incliné, pieds ancrés et hanches calées. Ramène doucement les omoplates en arrière et vers le bas.',
      'Prends une prise complète, poignets droits. Coudes légèrement sous les épaules, avant-bras alignés avec les poignées.',
      'Expire et pousse les poignées vers l’avant et le haut selon la trajectoire de la machine. Épaules et dos contre le dossier ; tends sans claquer les coudes.',
      'Inspire en redescendant lentement jusqu’à ce que les poignées reviennent près du haut de la poitrine, ou jusqu’à la position la plus basse que tu contrôles confortablement. Sans rebond ni étirement forcé.',
      'Répète avec la même amplitude et le même rythme. Ramène doucement les poignées à leurs butées avant de lâcher.',
    ],
    [
      'Omoplates en arrière et vers le bas',
      'Dos et hanches contre les coussins',
      'Pousser en douceur, contrôler le retour',
      'Poignets droits, coudes sous les épaules',
    ],
    [
      'Régler de sorte que les poignées partent près du cou plutôt que du haut de la poitrine',
      'Décoller hanches ou épaules pour bouger trop lourd',
      'Ouvrir les coudes à hauteur d’épaules ou casser les poignets',
      'Rebondir en bas, forcer l’amplitude ou claquer les coudes',
    ],
  ),
  'incline-push-up': e(
    'Pompe inclinée',
    ['pompes mains surélevées', 'pompe sur banc'],
    [
      'Pose les mains un peu plus larges que les épaules sur un banc stable ou une surface surélevée fixe. Recule jusqu’à ce que le corps forme une ligne droite de la tête aux talons.',
      'Gaine le ventre et plie les coudes pour descendre la poitrine vers le bord, coudes à environ 30 à 45 degrés du buste.',
      'Pousse dans les paumes jusqu’à bras tendus sans laisser les hanches s’affaisser. Un appui plus haut rend le mouvement plus facile.',
    ],
    [
      'Ligne droite passant par les hanches',
      'Amener la poitrine vers l’appui',
      'Un appui qui ne glisse ni ne bascule',
    ],
    ['Laisser le bas du dos s’affaisser', 'Ouvrir les coudes ou ne poser que le bout des doigts'],
  ),
  'jm-press': e(
    'JM press',
    ['développé JM', 'JM press triceps'],
    [
      'Allonge-toi sur un banc plat sous une barre en rack, pieds ancrés. Règle les sécurités et prends une prise fermée à largeur d’épaules. Apprends la trajectoire avec une barre vide ou très légère.',
      'Sors la barre au-dessus du haut de la poitrine. Plie les coudes en les gardant hauts et orientés vers les pieds pendant que la barre va vers l’espace entre menton et haut de la poitrine.',
      'Arrête à la flexion de coude que tu contrôles, barre loin du visage et de la gorge. Tends les coudes pour ramener la barre au-dessus de la poitrine.',
      'Garde le haut du dos sur le banc tout du long et repose la barre en sécurité après la série.',
    ],
    [
      'Commencer léger et apprendre la trajectoire des coudes',
      'Barre loin du visage et de la gorge',
      'Coudes hauts pendant la descente',
    ],
    [
      'Descendre la barre sur la gorge ou le visage',
      'Transformer chaque répétition en développé serré',
      'Forcer la flexion des coudes ou charger au-delà du contrôle',
    ],
  ),
  'jumping-jacks': e(
    'Jumping jacks',
    ['sauts écartés', 'jumping jack'],
    [
      'Tiens-toi droit, pieds joints, bras le long du corps. Garde assez d’espace pour tendre les deux bras au-dessus de la tête.',
      'Fais un petit saut pour écarter les pieds tout en montant les bras sur les côtés jusqu’au-dessus de la tête. Réceptionne-toi en douceur, genoux dans l’axe des orteils.',
      'Saute de nouveau pieds joints pendant que les bras reviennent le long du corps. Une ouverture et une fermeture font une répétition ; pour moins d’impact, écarte un pied à la fois.',
    ],
    [
      'Petites réceptions en douceur',
      'Genoux alignés avec les orteils',
      'Ouverture plus fermeture font une répétition',
    ],
    ['Atterrir genoux verrouillés', 'Sauter plus large ou plus vite que tu ne contrôles'],
  ),
  'kettlebell-clean': e(
    'Épaulé kettlebell',
    ['clean kettlebell', 'épaulé à un bras kettlebell'],
    [
      'Commence comme un swing à un bras, la kettlebell lancée en arrière entre les jambes.',
      'Pousse les hanches vers l’avant et tire la kettlebell près du corps en la laissant tourner autour du poignet.',
      'Reçois-la en douceur en position rack, puis laisse-la redescendre dans la flexion de hanches. Termine le côté, puis change.',
    ],
    [
      'Kettlebell près du corps, comme une fermeture éclair',
      'Les hanches font le travail',
      'Réception en douceur',
    ],
    ['Lancer la kettlebell loin pour qu’elle claque sur l’avant-bras'],
  ),
  'kettlebell-deadlift': e(
    'Soulevé de terre kettlebell',
    ['deadlift kettlebell', 'SDT kettlebell'],
    [
      'Debout, la kettlebell entre les pieds, sous le milieu du pied.',
      'Pousse les hanches en arrière, dos plat, et attrape la poignée à deux mains.',
      'Relève-toi en poussant les hanches vers l’avant, puis repose-la de la même façon.',
    ],
    ['Dos plat', 'Repousser le sol', 'Hanches et épaules montent ensemble'],
    ['Arrondir le bas du dos pour atteindre la kettlebell', 'En faire un squat'],
  ),
  'kettlebell-press': e(
    'Développé kettlebell',
    ['développé kettlebell un bras', 'développé militaire kettlebell'],
    [
      'Amène la kettlebell en position rack : sur l’avant-bras, contre la poitrine, poignet droit.',
      'Gaine le tronc et serre les fessiers.',
      'Pousse-la au-dessus de la tête jusqu’au verrouillage, puis redescends en rack. Termine le côté, puis change.',
    ],
    [
      'Poignet droit, phalanges vers le plafond',
      'Côtes basses',
      'Biceps près de l’oreille en haut',
    ],
    ['Se pencher en arrière pour pousser', 'Laisser le poignet casser sous la kettlebell'],
  ),
  'kettlebell-snatch': e(
    'Arraché kettlebell',
    ['snatch kettlebell', 'arraché à un bras'],
    [
      'Commence comme un swing à un bras, la kettlebell lancée en arrière entre les jambes.',
      'Pousse les hanches vers l’avant et tire la kettlebell près du corps vers le haut.',
      'Passe la main à travers pendant la montée pour qu’elle arrive en douceur au-dessus de la tête, bras verrouillé. Redescends-la dans la flexion de hanches.',
    ],
    [
      'Passer la main à travers en haut',
      'Garder près du corps en montant',
      'Verrouiller le bras au-dessus de la tête',
    ],
    [
      'Laisser la kettlebell basculer et frapper l’avant-bras',
      'La pousser vers le haut avec le bras',
    ],
  ),
  'kettlebell-swing': e(
    'Swing kettlebell',
    ['swing russe', 'swing à deux mains', 'kettlebell swing'],
    [
      'Debout, pieds à largeur d’épaules, la kettlebell au sol une trentaine de centimètres devant toi.',
      'Plie aux hanches, attrape la poignée à deux mains et lance-la en arrière entre les jambes.',
      'Projette les hanches vers l’avant pour faire flotter la kettlebell à hauteur de poitrine, bras tendus, puis laisse-la redescendre dans la flexion de hanches.',
    ],
    [
      'C’est une flexion de hanches, pas un squat',
      'Les hanches claquent, les bras ne font que tenir',
      'Fessiers serrés en haut',
    ],
    [
      'Monter la kettlebell avec les bras ou les épaules',
      'S’accroupir au lieu de plier aux hanches',
      'Se pencher en arrière en haut',
    ],
  ),
  'lat-pulldown': e(
    'Tirage vertical',
    ['tirage poitrine', 'tirage nuque', 'lat pulldown'],
    [
      'Règle le coussin de cuisses pour rester assis.',
      'Prends la barre plus large que les épaules et penche-toi légèrement en arrière.',
      'Tire la barre vers le haut de la poitrine, puis reviens à l’étirement complet.',
    ],
    ['Poitrine haute, barre vers la clavicule', 'Laisser les omoplates monter en haut'],
    ['Se pencher tellement que ça devient un rowing', 'Tirer derrière la nuque'],
  ),
  'lateral-raise': e(
    'Élévations latérales',
    ['élévation latérale haltères', 'élévations latérales'],
    [
      'Debout, haltères le long du corps, coudes légèrement fléchis.',
      'Monte sur les côtés jusqu’à ce que les bras soient à hauteur d’épaules.',
      'Redescends lentement.',
    ],
    ['Mener avec les coudes', 'S’arrêter à hauteur d’épaules'],
    ['Lancer la charge avec le bas du dos', 'Prendre beaucoup trop lourd'],
  ),
  'leg-extension': e(
    'Leg extension',
    ['extension des jambes', 'extension quadriceps'],
    [
      'Place le boudin juste au-dessus des chevilles.',
      'Tends les genoux jusqu’à jambes droites.',
      'Redescends avec contrôle sans reposer la charge.',
    ],
    ['Courte pause en haut', 'Lentement à la descente'],
    ['Balancer le buste pour lancer chaque répétition'],
  ),
  'leg-press': e(
    'Presse à cuisses',
    ['presse', 'leg press'],
    [
      'Assieds-toi, pieds à largeur d’épaules sur la plateforme.',
      'Descends jusqu’à ce que les genoux atteignent environ 90 degrés.',
      'Repousse sans verrouiller brutalement les genoux.',
    ],
    ['Ne pas laisser le bas du dos décoller du dossier', 'Contrôler la descente'],
    ['Descendre les genoux si bas que le bassin s’enroule'],
  ),
  'log-press': e(
    'Log press',
    ['développé log', 'log strongman'],
    [
      'Utilise un log de strongman avec poignées neutres intérieures et une zone dégagée. Amène-le en front rack stable par un épaulé maîtrisé ou depuis des supports adaptés, et gaine-toi pieds à largeur d’épaules.',
      'Buste droit, fléchis légèrement les genoux, puis pousse avec les jambes et développe le log au-dessus de la tête, paumes face à face.',
      'Termine bras et genoux tendus, log en équilibre au-dessus des épaules et du milieu du pied. Évite de te cambrer en arrière.',
      'Redescends en front rack avec contrôle en amortissant avec les genoux. Replace-toi avant le développé suivant et repose le log de façon maîtrisée. Chaque développé au-dessus de la tête est une répétition.',
    ],
    [
      'Tenir fermement les poignées intérieures',
      'Fléchir et pousser à la verticale',
      'Finir avec le log en équilibre au-dessus de la tête',
    ],
    [
      'Pousser depuis un front rack instable',
      'Se pencher loin en arrière au lieu de passer sous le log',
      'Lâcher le log sans zone de réception dégagée',
    ],
  ),
  'lying-leg-curl': e(
    'Leg curl allongé',
    ['leg curl', 'curl ischios allongé'],
    [
      'Allonge-toi sur le ventre, boudin juste au-dessus des talons.',
      'Ramène les talons vers les fessiers.',
      'Redescends lentement jusqu’à l’étirement complet.',
    ],
    ['Les hanches restent collées au banc', 'Négative lente'],
    ['Lever les hanches pour lancer la charge'],
  ),
  'lying-leg-raise': e(
    'Relevé de jambes allongé',
    ['relevé de jambes au sol', 'leg raise allongé'],
    [
      'Allonge-toi sur le dos, tête et omoplates au sol, bras le long des hanches, paumes vers le bas. Gaine le ventre et garde le bas du dos doucement contre le sol.',
      'Monte les deux jambes ensemble, genoux souplement tendus. En approchant de la verticale, enroule doucement le bassin vers les côtes sans te balancer.',
      'Redescends lentement seulement aussi bas que le dos reste stable. Plie les genoux ou réduis l’amplitude si le bas du dos se cambre.',
    ],
    ['Tête et épaules au sol', 'Bas du dos stable', 'Contrôler l’amplitude de descente'],
    [
      'Se cambrer quand les talons approchent du sol',
      'Balancer les jambes ou lever la tête pour compenser',
    ],
  ),
  'machine-chest-press': e(
    'Presse à pectoraux',
    ['chest press', 'développé machine'],
    [
      'Règle le siège pour que les poignées soient au milieu de la poitrine.',
      'Pousse jusqu’à bras tendus sans verrouiller brutalement.',
      'Reviens avec contrôle jusqu’à sentir un étirement.',
    ],
    ['Omoplates en arrière et vers le bas', 'Amplitude complète, sans rebond'],
    ['Siège trop haut, ce qui en fait un développé incliné'],
  ),
  'machine-lateral-raise': e(
    'Élévation latérale machine',
    ['machine à élévations latérales'],
    [
      'Règle le siège pour que les épaules soient alignées avec l’axe de la machine et que les coussins soient à l’extérieur des bras, au-dessus des coudes.',
      'Assieds-toi droit, pieds ancrés, coudes légèrement fléchis. Monte les bras sur les côtés jusqu’à hauteur d’épaules.',
      'Redescends les coussins lentement sans laisser la pile claquer.',
    ],
    [
      'Mener avec les bras',
      'Épaules loin des oreilles',
      'Finir confortablement à hauteur d’épaules',
    ],
    [
      'Hausser les épaules ou balancer le buste',
      'Régler le siège avec l’axe bien au-dessus ou en dessous des épaules',
    ],
  ),
  'machine-shrug': e(
    'Shrug à la machine',
    ['machine à shrugs'],
    [
      'Place-toi dans la machine à shrugs, pieds ancrés, et prends les poignées latérales en prise fermée. Règle les butées avant de charger.',
      'Bras tendus et buste immobile, monte les deux épaules vers les oreilles.',
      'Marque une courte pause, puis redescends avec contrôle jusqu’à un étirement confortable.',
    ],
    ['Monter les épaules droit', 'Coudes tendus', 'Tête alignée avec le buste'],
    ['Faire rouler les épaules', 'Plier les coudes ou rebondir avec les genoux'],
  ),
  'machine-triceps-extension': e(
    'Extension triceps à la machine',
    ['machine à triceps', 'extension bras machine'],
    [
      'Règle le siège pour que les bras reposent sur le coussin avant et que les coudes soient alignés avec l’axe du levier. Tiens les deux poignées, poignets droits.',
      'Bras sur le coussin, tends les coudes pour faire avancer les poignées selon la trajectoire de la machine.',
      'Reviens lentement à une flexion de coude confortable sans lever les bras ni laisser la pile claquer.',
    ],
    [
      'Les bras restent sur le coussin',
      'Bouger depuis les coudes',
      'Finir sans claquer les coudes',
    ],
    [
      'Lever les épaules ou les bras pour bouger les poignées',
      'Utiliser l’élan ou forcer l’étirement en bas',
    ],
  ),
  'mountain-climbers': e(
    'Mountain climbers',
    ['grimpeur', 'mountain climber'],
    [
      'Commence en planche haute, mains sous les épaules, corps aligné.',
      'Ramène un genou vers la poitrine sans lever les hanches, puis repose le pied pendant que l’autre genou avance.',
      'Alterne à un rythme qui te permet de garder les épaules au-dessus des mains et le tronc immobile. Chaque genou compte pour une répétition.',
    ],
    ['Hanches à niveau', 'Épaules au-dessus des mains', 'Contrôler chaque montée de genou'],
    [
      'Faire rebondir les hanches ou creuser le bas du dos',
      'Aller si vite que pieds et tronc perdent le contrôle',
    ],
  ),
  'muscle-up': e(
    'Muscle-up',
    ['muscle up à la barre', 'bar muscle-up'],
    [
      'Utilise une barre droite solide avec assez d’espace au-dessus et autour pour la bascule et le balancement. Commence en pronation fermée, épaules actives. Cette version utilise un kip contrôlé.',
      'Crée un petit balancement creux-cambré, puis pousse les hanches et tire la barre vers le bas de la poitrine en la gardant proche.',
      'Quand le buste passe au-dessus de la barre, fais passer les deux coudes ensemble et penche la poitrine vers l’avant en dip stable à la barre.',
      'Pousse jusqu’à l’appui bras tendus. Inverse la bascule avec contrôle et recale le balancement avant la répétition suivante. Travaille séparément la traction, la bascule et le dip à la barre avant de les enchaîner.',
    ],
    [
      'Barre proche pendant la bascule',
      'Passer les deux coudes ensemble',
      'Contrôler le balancement et la descente',
    ],
    [
      'Passer un coude avant l’autre',
      'Tenter la bascule sans traction et dip à la barre solides',
      'Utiliser une barre avec trop peu d’espace au-dessus ou pour le balancement',
    ],
  ),
  'neck-curl': e(
    'Flexion de la nuque',
    ['flexion du cou allongé', 'renforcement du cou'],
    [
      'Allonge-toi sur le dos sur un banc plat, omoplates et buste appuyés, pieds ancrés, tête juste au-delà du bord. Commence sans charge.',
      'Rentre doucement le menton et lève la tête sur une courte distance avec l’avant du cou. Les épaules restent sur le banc.',
      'Redescends lentement vers une position confortable sans laisser tomber la tête en arrière. Utilise une petite amplitude sans douleur et arrête en cas de douleur au cou ou de vertige.',
    ],
    ['Commencer sans charge', 'Épaules appuyées', 'Bouger lentement sur une petite amplitude'],
    [
      'En faire un relevé de buste',
      'Tomber dans un étirement profond du cou ou forcer le menton vers l’avant',
    ],
  ),
  'one-arm-cable-bicep-curl': e(
    'Curl biceps unilatéral à la poulie',
    ['curl à un bras poulie', 'curl unilatéral câble'],
    [
      'Fixe une poignée à une poulie basse et tiens-la d’une main, paume vers l’avant. Face à la machine, posture stable, coude contre les côtes.',
      'Monte la poignée vers l’épaule qui travaille, bras immobile et poignet droit. La main libre sur la hanche ou relâchée.',
      'Redescends lentement presque jusqu’à l’extension sans tourner le buste. Fais les deux côtés et note les répétitions par bras.',
    ],
    ['Paume vers le haut', 'Coude contre les côtes', 'Buste immobile'],
    ['Tourner le buste pour bouger la poignée', 'Casser le poignet ou avancer le bras'],
  ),
  'one-arm-pull-ups': e(
    'Tractions à un bras',
    ['traction à un bras', 'one arm pull-up'],
    [
      'Utilise une barre solide avec de l’espace pour une descente contrôlée. Il s’agit d’une traction à un bras sans assistance, en pronation ; développe d’abord des progressions assistées contrôlées.',
      'Prends une prise fermée d’une main et active l’épaule, pieds décollés du sol. L’autre main reste libre, sans tenir le poignet ni la barre.',
      'Tire le coude vers les côtes jusqu’à ce que le menton dépasse la barre, sans coup de pied. Accepte une petite rotation confortable du corps plutôt que de forcer l’épaule.',
      'Redescends avec contrôle jusqu’au bras long sans t’affaisser dans l’épaule. Arrête avant que la prise ou le contrôle de l’épaule lâche. Travaille les deux côtés et note les répétitions par bras.',
    ],
    [
      'Épaule qui travaille active',
      'Main libre loin de la barre et du poignet',
      'Contrôler toute la descente',
    ],
    [
      'Tomber d’un coup en suspension passive à un bras',
      'Donner des coups de pied ou compter comme libres des répétitions aidées au poignet',
    ],
  ),
  'one-arm-push-ups': e(
    'Pompes à un bras',
    ['pompe à un bras', 'one arm push-up'],
    [
      'Pose une paume fermement sous la poitrine et écarte les pieds bien au-delà de la largeur d’épaules pour la stabilité. Place la main libre dans le dos et gaine le tronc.',
      'Plie le coude d’appui vers les côtes pour descendre la poitrine avec contrôle. Les hanches ne s’affaissent pas ; une petite rotation naturelle du buste est acceptable.',
      'Pousse dans la paume d’appui jusqu’à bras tendu sans te tordre brusquement. Fais les deux côtés et note les répétitions par bras. Entraîne-toi la main sur une surface surélevée stable avant de passer au sol.',
    ],
    [
      'Écart de pieds large et stable',
      'Gainer contre la rotation excessive',
      'Coude qui travaille près des côtes',
    ],
    [
      'Utiliser un écart étroit avant de contrôler la rotation',
      'Creuser le bas du dos ou pousser avec la main libre',
    ],
  ),
  'one-arm-seated-cable-row': e(
    'Tirage horizontal unilatéral',
    ['rowing poulie basse un bras', 'tirage assis à un bras'],
    [
      'Fixe une poignée au tirage horizontal. Assieds-toi, les deux pieds bien calés sur les repose-pieds, genoux légèrement fléchis, poitrine droite. Tiens la poignée d’une main en prise neutre.',
      'Bassin et buste de face, tire le coude vers la hanche et la poignée vers le bas des côtes. La main libre repose sur la cuisse.',
      'Tends le bras lentement en laissant l’omoplate avancer confortablement, sans arrondir le bas du dos. Fais les deux côtés et note les répétitions par bras.',
    ],
    ['Buste de face', 'Tirer le coude vers la hanche', 'Laisser l’omoplate bouger avec contrôle'],
    [
      'Tourner ou basculer le buste pour bouger la charge',
      'Hausser l’épaule ou arrondir le bas du dos',
    ],
  ),
  'overhead-press': e(
    'Développé militaire',
    ['développé debout', 'military press', 'développé au-dessus de la tête'],
    [
      'Prends la barre à hauteur de clavicule, prise à largeur d’épaules.',
      'Gaine le tronc et serre les fessiers.',
      'Pousse au-dessus de la tête en reculant légèrement la tête, puis repasse sous la barre en haut.',
    ],
    ['Côtes basses', 'Trajectoire proche du visage', 'Finir barre au-dessus des oreilles'],
    ['Se pencher en arrière jusqu’à en faire un développé incliné'],
  ),
  'overhead-squat': e(
    'Squat bras tendus',
    ['overhead squat', 'squat barre au-dessus de la tête'],
    [
      'Apprends avec un bâton ou une barre légère dans une zone dégagée et pratique une sortie sûre avant de charger. Prends une prise large d’arraché et monte la barre avec une technique que tu maîtrises déjà.',
      'Place les pieds dans une position de squat confortable. Gaine-toi et soutiens activement la barre au-dessus du milieu du pied, coudes tendus.',
      'Descends lentement, pied entier au sol, genoux dans l’axe des orteils. Ne descends que jusqu’où la barre reste en équilibre au-dessus de la tête.',
      'Relève-toi en gardant le même soutien. Repose la barre en sécurité avec ta technique maîtrisée ; arrête la série si les coudes plient ou si tu perds l’équilibre.',
    ],
    [
      'Barre en équilibre au-dessus du milieu du pied',
      'Pousser vers le haut dans la barre',
      'Pied entier au sol',
    ],
    [
      'Forcer la profondeur pendant que la barre part vers l’avant',
      'Plier les coudes ou charger au-delà du contrôle au-dessus de la tête',
    ],
  ),
  'overhead-triceps-extension': e(
    'Extension triceps au-dessus de la tête',
    ['barre au front debout', 'extension nuque', 'extension triceps poulie au-dessus de la tête'],
    [
      'Dos à une poulie basse, ou tiens un haltère au-dessus de la tête.',
      'Bras près des oreilles, descends derrière la tête.',
      'Tends à nouveau jusqu’à l’extension.',
    ],
    ['Les bras ne bougent pas', 'Chercher un bon étirement en bas'],
    ['Laisser les coudes s’écarter largement'],
  ),
  'pec-deck': e(
    'Pec deck',
    ['butterfly', 'écartés à la machine'],
    [
      'Règle le siège pour que les poignées soient à hauteur de poitrine.',
      'Rapproche les coussins devant toi.',
      'Reviens jusqu’à sentir un étirement, sans reposer la charge.',
    ],
    ['Poitrine haute', 'Courte pause en contraction'],
    ['Hausser les épaules en fin de chaque répétition'],
  ),
  'pike-push-up': e(
    'Pompe pike',
    ['pike push-up', 'pompe en V'],
    [
      'Commence en appui sur les mains et les pieds, mains à largeur d’épaules. Monte les hanches en V inversé, tête entre les bras.',
      'Plie les coudes vers l’arrière et descends la tête vers un point légèrement devant les mains, hanches hautes.',
      'Repousse le sol jusqu’à bras tendus et reviens en V inversé. La tête ne touche pas le sol.',
    ],
    [
      'Hanches hautes',
      'Coudes orientés vers l’arrière',
      'Contrôler la trajectoire de la tête devant les mains',
    ],
    [
      'Baisser les hanches jusqu’à une pompe classique',
      'Poser le poids sur la tête ou ouvrir largement les coudes',
    ],
  ),
};
