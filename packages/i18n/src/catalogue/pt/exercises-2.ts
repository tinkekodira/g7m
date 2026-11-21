import { exercise as e } from '../entry.js';
import type { ExerciseText } from '../types.js';

export const exercises2: Readonly<Record<string, ExerciseText>> = {
  'dumbbell-shrug': e(
    'Encolhimento com halteres',
    ['encolhimento', 'encolhimento de ombros com halteres'],
    [
      'Em pé, pés na largura do quadril, um halter em cada mão ao lado do corpo, palmas voltadas para as coxas.',
      'Peito alto, cabeça neutra e braços estendidos. Suba os dois ombros em direção às orelhas sem dobrar os cotovelos nem girar os ombros.',
      'Pause brevemente em cima e desça os ombros devagar até um alongamento confortável.',
      'Repita com o tronco parado e a mesma amplitude controlada dos dois lados. Apoie os halteres com controle ao terminar.',
    ],
    ['Ombros sobem e descem em linha reta', 'Braços estendidos', 'Pausa em cima', 'Cabeça neutra'],
    [
      'Girar os ombros',
      'Dobrar os cotovelos ou quicar com as pernas',
      'Projetar a cabeça para a frente',
      'Usar uma carga que impede subir os ombros com controle',
    ],
  ),
  'ez-bar-curl': e(
    'Rosca direta com barra W',
    ['rosca barra W', 'rosca bíceps barra W'],
    [
      'Em pé, segure a barra W pelas pegadas inclinadas, braços estendidos.',
      'Suba a barra até a altura dos ombros com os cotovelos ao lado do corpo.',
      'Desça com controle até a extensão completa.',
    ],
    ['Cotovelos colados nas costelas', 'Extensão completa embaixo'],
    ['Balançar o quadril para começar cada repetição'],
  ),
  'face-pull': e(
    'Face pull',
    ['puxada para o rosto', 'face pull com corda'],
    [
      'Ajuste uma corda mais ou menos na altura do rosto.',
      'Puxe a corda em direção ao rosto afastando as pontas.',
      'Termine com as mãos ao lado das orelhas e os cotovelos altos.',
    ],
    ['Cotovelos acima dos punhos', 'Afaste as pontas, não só puxe para trás'],
    ['Colocar tanto peso que o tronco balança para trás'],
  ),
  'farmer-carry': e(
    'Caminhada do fazendeiro',
    ['farmer walk', 'caminhada com carga'],
    [
      'Pegue um halter ou kettlebell pesado em cada mão.',
      'Fique ereto com os ombros para trás.',
      'Caminhe em linha reta por distância ou tempo.',
    ],
    ['Postura alta, sem inclinar', 'Aperte forte as pegadas'],
    ['Deixar os ombros arredondarem sob a carga'],
  ),
  'flat-bench-dumbbell-fly': e(
    'Crucifixo reto com halteres',
    ['crucifixo reto', 'crucifixo com halteres'],
    [
      'Deite num banco reto com os pés firmes. Segure halteres leves acima do peito, palmas voltadas uma para a outra e cotovelos levemente dobrados.',
      'Abra os braços num arco amplo mantendo essa dobra. Pare num alongamento confortável do peito com os braços mais ou menos alinhados com o tronco.',
      'Traga os halteres de volta acima do peito pelo mesmo arco de abraço, sem transformar o movimento em supino.',
    ],
    [
      'Dobra do cotovelo leve e fixa',
      'Abra e feche como num abraço',
      'Alongamento confortável do peito',
    ],
    [
      'Descer os pesos muito abaixo do tronco',
      'Estender totalmente os cotovelos ou empurrar os pesos',
    ],
  ),
  'goblet-squat': e(
    'Agachamento goblet',
    ['goblet squat', 'agachamento taça', 'agachamento com kettlebell'],
    [
      'Segure um halter ou kettlebell na altura do peito.',
      'Agache entre os joelhos mantendo o peito alto.',
      'Suba empurrando com o pé inteiro.',
    ],
    ['Cotovelos por dentro dos joelhos embaixo', 'Peito estufado'],
    ['Deixar os calcanhares saírem do chão'],
  ),
  'hack-squat': e(
    'Agachamento hack',
    ['hack', 'hack machine'],
    [
      'Coloque os ombros sob os apoios com os pés no meio da plataforma.',
      'Desça até as coxas ficarem pelo menos paralelas.',
      'Suba de volta empurrando com o pé inteiro.',
    ],
    ['Costas retas contra o encosto', 'Joelhos na linha dos pés'],
    ['Quicar na saída do fundo'],
  ),
  'hammer-curl': e(
    'Rosca martelo',
    ['rosca martelo com halteres', 'rosca neutra'],
    [
      'Segure os halteres com as palmas voltadas uma para a outra.',
      'Suba até a altura dos ombros sem girar os punhos.',
      'Desça com controle.',
    ],
    ['Polegares para cima o tempo todo', 'Cotovelos parados'],
    ['Girar para uma rosca normal no meio do movimento'],
  ),
  'handstand-push-ups': e(
    'Flexão em parada de mão',
    ['flexão invertida', 'HSPU', 'flexão na parada de mão livre'],
    [
      'Esta é uma flexão estrita em parada de mão livre. Desenvolva antes uma parada de mão estável e pratique uma saída controlada numa área livre; use progressões em pike ou com apoio enquanto aprende.',
      'Fique em parada de mão com as palmas na largura dos ombros, dedos afastados e tronco travado. Pernas juntas acima do quadril.',
      'Dobre os cotovelos com controle levando a cabeça a um ponto um pouco à frente das mãos. Desça só até onde consegue voltar sem apoiar peso na cabeça.',
      'Empurre forte com as palmas até estender os braços e recupere o equilíbrio. Não chute com as pernas para terminar; saia da parada antes de perder o controle.',
    ],
    ['Afaste os dedos e empurre com as palmas', 'Tronco travado', 'Nada de peso na cabeça'],
    [
      'Desabar sobre a cabeça ou o pescoço',
      'Usar impulso das pernas ou tentar sem uma saída controlada',
    ],
  ),
  'hanging-knee-raise': e(
    'Elevação de joelhos na barra',
    ['elevação de joelhos suspenso', 'abdominal suspenso joelhos'],
    [
      'Pendure-se numa barra segura com pegada pronada fechada e braços longos. Ative os ombros e deixe o corpo parar.',
      'Dobre os dois joelhos e leve-os em direção ao peito, enrolando levemente a pelve em vez de só subir as coxas.',
      'Desça devagar até ficar pendurado sem balançar. Subir e descer os dois joelhos conta como uma repetição.',
    ],
    [
      'Comece cada repetição sem balanço',
      'Enrole a pelve em direção às costelas',
      'Desça os joelhos devagar',
    ],
    [
      'Usar um balanço de pêndulo para subir os joelhos',
      'Deixar as pernas caírem ou afundar nos ombros',
    ],
  ),
  'hanging-leg-raise': e(
    'Elevação de pernas na barra',
    ['elevação de pernas suspenso', 'leg raise na barra'],
    [
      'Pendure-se numa barra com os ombros ativos.',
      'Suba as pernas até o quadril enrolar levemente.',
      'Desça com controle, sem balançar.',
    ],
    ['Enrole a pelve em cima', 'Sem balançar entre as repetições'],
    ['Usar embalo e mexer só o quadril'],
  ),
  'hip-abduction-machine': e(
    'Cadeira abdutora',
    ['abdutora', 'abdução de quadril', 'máquina abdutora'],
    [
      'Sente com as costas no encosto e os joelhos contra os apoios externos.',
      'Afaste os joelhos até onde for confortável.',
      'Traga-os de volta com controle, em vez de deixar o peso puxá-los.',
    ],
    ['Sente ereto; inclinar muda que parte do glúteo trabalha', 'Pause no ponto mais aberto'],
    [
      'Colocar a pilha inteira e mexer cinco centímetros',
      'Balançar o tronco para ganhar os últimos graus',
    ],
  ),
  'hip-adduction-machine': e(
    'Cadeira adutora',
    ['adutora', 'adução de quadril', 'máquina adutora'],
    [
      'Sente com as costas no encosto e os joelhos contra os apoios internos.',
      'Aperte os joelhos até os apoios quase se tocarem.',
      'Deixe abrir de novo com controle, só até onde o alongamento for confortável.',
    ],
    ['Aperte, não balance', 'Pare a volta onde o alongamento começa, não onde dói'],
    ['Carregar tanto que a volta vira queda', 'Abrir mais do que o quadril está aquecido'],
  ),
  'incline-barbell-press': e(
    'Supino inclinado com barra',
    ['supino inclinado', 'supino inclinado barra'],
    [
      'Ajuste o banco a uns 30 graus.',
      'Tire a barra e desça até a parte alta do peito.',
      'Empurre para cima e um pouco para trás, sobre os ombros.',
    ],
    ['Firme contra o banco', 'Barra na clavícula, não no pescoço'],
    ['Deixar o banco inclinado demais, o que vira desenvolvimento'],
  ),
  'incline-cable-curl': e(
    'Rosca inclinada na polia',
    ['rosca no banco inclinado com polias'],
    [
      'Centralize um banco pouco inclinado entre duas polias baixas, com a cabeceira voltada para a máquina. Pegue uma alça em cada mão e recoste com os pés firmes, palmas para a frente.',
      'Braços pendurados ao lado ou um pouco atrás do tronco; suba as duas alças em direção aos ombros. Os cabos não encostam no banco nem no corpo.',
      'Desça devagar até quase estender os cotovelos sem tirar as costas nem levar os braços para a frente.',
    ],
    ['Costas no encosto', 'Cabos livres', 'Braços parados'],
    [
      'Posicionar o banco de modo que os cabos raspem na estrutura ou no corpo',
      'Levantar os ombros para balançar as alças',
    ],
  ),
  'incline-dumbbell-curl': e(
    'Rosca inclinada com halteres',
    ['rosca inclinada', 'rosca no banco inclinado'],
    [
      'Recoste num banco a uns 45 graus com os braços pendurados retos.',
      'Suba os halteres sem trazer os cotovelos para a frente.',
      'Desça até o alongamento completo.',
    ],
    ['Cotovelos ficam atrás do corpo', 'Controle o alongamento embaixo'],
    ['Tirar os ombros do banco para jogar o peso para cima'],
  ),
  'incline-dumbbell-fly': e(
    'Crucifixo inclinado com halteres',
    ['crucifixo inclinado'],
    [
      'Ajuste um banco com pouca inclinação, uns 30 graus. Deite com os pés firmes e halteres leves acima da parte alta do peito, palmas voltadas uma para a outra.',
      'Mantenha os cotovelos levemente dobrados e fixos e abra os braços em arco até ficarem mais ou menos na altura do tronco ou o peito alongar com conforto.',
      'Junte os halteres acima da parte alta do peito pelo mesmo arco, sem bater um no outro nem mudar o ângulo do cotovelo.',
    ],
    ['Inclinação moderada', 'Ângulo do cotovelo fixo', 'Controle o alongamento embaixo'],
    ['Descer os braços muito atrás do tronco', 'Empurrar em vez de abrir ou usar peso demais'],
  ),
  'incline-dumbbell-press': e(
    'Supino inclinado com halteres',
    ['supino inclinado halteres'],
    [
      'Ajuste o banco a uns 30 graus.',
      'Desça os halteres até a altura do peito com os cotovelos sob os punhos.',
      'Empurre até estender os braços.',
    ],
    ['Costelas baixas', 'Não bata os halteres em cima'],
    ['Encolher os ombros em direção às orelhas'],
  ),
  'incline-hammer-curl': e(
    'Rosca martelo inclinada',
    ['rosca martelo no banco inclinado'],
    [
      'Sente num banco entre 45 e 60 graus com os pés firmes. Deixe os halteres pendurados ao lado, palmas para dentro.',
      'Braços parados, suba os halteres em direção aos ombros sem girar as palmas para cima.',
      'Desça devagar até quase estender os cotovelos com as costas no encosto.',
    ],
    ['Palmas para dentro', 'Braços parados', 'Costas apoiadas'],
    ['Jogar os ombros para a frente', 'Girar as palmas para cima ou encurtar embaixo'],
  ),
  'incline-machine-chest-press': e(
    'Supino inclinado na máquina',
    ['supino inclinado máquina', 'máquina de supino inclinado'],
    [
      'Escolha uma carga controlável. Em máquina de anilhas, carregue os dois lados igualmente. Ajuste o banco ou o encosto para as alças começarem ao lado da parte alta do peito.',
      'Recoste no encosto inclinado com os pés firmes e o quadril apoiado. Leve as escápulas suavemente para trás e para baixo.',
      'Pegue firme com os punhos retos. Cotovelos um pouco abaixo da altura dos ombros e antebraços alinhados com as alças.',
      'Solte o ar e empurre as alças para a frente e para cima seguindo o trajeto da máquina. Ombros e costas no encosto; estenda sem travar os cotovelos com tranco.',
      'Puxe o ar enquanto desce devagar até as alças voltarem ao lado da parte alta do peito, ou à posição mais funda que você controla com conforto. Sem quicar nem forçar o alongamento.',
      'Repita com a mesma amplitude e ritmo. Devolva as alças suavemente aos batentes antes de soltar.',
    ],
    [
      'Escápulas para trás e para baixo',
      'Costas e quadril nos apoios',
      'Empurre suave e controle a volta',
      'Punhos retos, cotovelos abaixo dos ombros',
    ],
    [
      'Ajustar de modo que as alças comecem perto do pescoço em vez do peito alto',
      'Tirar quadril ou ombros dos apoios para mover peso demais',
      'Abrir os cotovelos na altura dos ombros ou dobrar os punhos para trás',
      'Quicar embaixo, forçar a profundidade ou travar os cotovelos com tranco',
    ],
  ),
  'incline-push-up': e(
    'Flexão inclinada',
    ['flexão com mãos elevadas', 'flexão no banco'],
    [
      'Apoie as mãos um pouco mais abertas que os ombros num banco estável ou superfície elevada fixa. Recue até o corpo formar uma linha reta da cabeça aos calcanhares.',
      'Contraia o abdômen e dobre os cotovelos para levar o peito até a borda, com os cotovelos a uns 30 a 45 graus do tronco.',
      'Empurre com as palmas até estender os braços sem deixar o quadril cair. Um apoio mais alto deixa o movimento mais fácil.',
    ],
    [
      'Linha reta passando pelo quadril',
      'Leve o peito em direção ao apoio',
      'Use um apoio que não escorregue nem tombe',
    ],
    ['Deixar a lombar cair', 'Abrir os cotovelos ou apoiar só a ponta dos dedos'],
  ),
  'jm-press': e(
    'JM press',
    ['supino JM', 'JM press tríceps'],
    [
      'Deite num banco reto sob uma barra no suporte com os pés firmes. Ajuste as travas e pegue fechado na largura dos ombros. Aprenda o trajeto com a barra vazia ou bem leve.',
      'Tire a barra sobre a parte alta do peito. Dobre os cotovelos mantendo-os altos e voltados para os pés enquanto a barra vai para o espaço entre o queixo e a parte alta do peito.',
      'Pare na dobra de cotovelo que controla, com a barra longe do rosto e do pescoço. Estenda os cotovelos para levar a barra de volta acima do peito.',
      'Mantenha a parte alta das costas no banco o tempo todo e devolva a barra com segurança após a série.',
    ],
    [
      'Comece leve e aprenda o trajeto dos cotovelos',
      'Barra longe do rosto e do pescoço',
      'Cotovelos altos durante a descida',
    ],
    [
      'Descer a barra no pescoço ou no rosto',
      'Transformar cada repetição em supino fechado',
      'Forçar a dobra do cotovelo ou carregar além do controle',
    ],
  ),
  'jumping-jacks': e(
    'Polichinelo',
    ['polichinelos', 'jumping jack'],
    [
      'Fique em pé com os pés juntos e os braços ao lado do corpo. Deixe espaço livre para estender os dois braços acima da cabeça.',
      'Dê um pequeno salto para afastar os pés enquanto leva os braços pelos lados até acima da cabeça. Aterrisse suave com os joelhos na linha dos pés.',
      'Salte de volta com os pés juntos enquanto os braços voltam ao lado do corpo. Abrir e fechar conta como uma repetição; para menos impacto, leve um pé de cada vez.',
    ],
    [
      'Aterrissagens pequenas e suaves',
      'Joelhos alinhados com os pés',
      'Abrir e fechar conta como uma repetição',
    ],
    ['Aterrissar com os joelhos travados', 'Saltar mais aberto ou mais rápido do que controla'],
  ),
  'kettlebell-clean': e(
    'Clean com kettlebell',
    ['clean kettlebell', 'clean unilateral com kettlebell'],
    [
      'Comece como num swing com uma mão, com o kettlebell lançado para trás entre as pernas.',
      'Empurre o quadril para a frente e puxe o kettlebell perto do corpo, deixando-o girar em volta do punho.',
      'Receba-o suave na posição de rack e deixe-o voltar para a dobra de quadril. Termine o lado e troque.',
    ],
    ['Kettlebell perto, como subir um zíper', 'O quadril faz o trabalho', 'Recepção suave'],
    ['Jogar o kettlebell para longe e deixá-lo bater no antebraço'],
  ),
  'kettlebell-deadlift': e(
    'Levantamento terra com kettlebell',
    ['terra com kettlebell', 'deadlift kettlebell'],
    [
      'Fique em pé com o kettlebell entre os pés, sob o meio do pé.',
      'Leve o quadril para trás com as costas retas e segure a alça com as duas mãos.',
      'Levante empurrando o quadril para a frente e desça da mesma forma.',
    ],
    ['Costas retas', 'Empurre o chão', 'Quadril e ombros sobem juntos'],
    ['Arredondar a lombar para alcançar o kettlebell', 'Transformar em agachamento'],
  ),
  'kettlebell-press': e(
    'Desenvolvimento com kettlebell',
    ['desenvolvimento unilateral com kettlebell', 'press com kettlebell'],
    [
      'Leve o kettlebell à posição de rack: sobre o antebraço, contra o peito, punho reto.',
      'Trave o tronco e contraia os glúteos.',
      'Empurre acima da cabeça até travar e desça de volta ao rack. Termine o lado e troque.',
    ],
    [
      'Punho reto, nós dos dedos para o teto',
      'Costelas baixas',
      'Bíceps ao lado da orelha em cima',
    ],
    ['Inclinar para trás para empurrar', 'Deixar o punho dobrar sob o kettlebell'],
  ),
  'kettlebell-snatch': e(
    'Snatch com kettlebell',
    ['arranco com kettlebell', 'snatch unilateral'],
    [
      'Comece como num swing com uma mão, com o kettlebell lançado para trás entre as pernas.',
      'Empurre o quadril para a frente e suba o kettlebell perto do corpo.',
      'Passe a mão por dentro enquanto ele sobe para que chegue suave acima da cabeça com o braço travado. Desça de volta à dobra de quadril.',
    ],
    ['Passe a mão por dentro em cima', 'Perto do corpo na subida', 'Trave o braço acima da cabeça'],
    ['Deixar o kettlebell virar e bater no antebraço', 'Empurrar para cima com o braço'],
  ),
  'kettlebell-swing': e(
    'Swing com kettlebell',
    ['swing russo', 'swing com as duas mãos', 'swing'],
    [
      'Fique em pé com os pés na largura dos ombros e o kettlebell no chão uns 30 centímetros à frente.',
      'Dobre o quadril, segure a alça com as duas mãos e lance-o para trás entre as pernas.',
      'Projete o quadril para a frente para o kettlebell flutuar até a altura do peito com os braços retos, e deixe-o voltar para a dobra de quadril.',
    ],
    [
      'É dobra de quadril, não agachamento',
      'O quadril explode, os braços só seguram',
      'Glúteos contraídos em cima',
    ],
    [
      'Subir o kettlebell com os braços ou os ombros',
      'Agachar em vez de dobrar o quadril',
      'Inclinar para trás em cima',
    ],
  ),
  'lat-pulldown': e(
    'Puxada frontal',
    ['puxada alta', 'pulldown', 'puxador'],
    [
      'Ajuste o apoio das coxas para ficar sentado.',
      'Pegue mais aberto que os ombros e incline um pouco para trás.',
      'Puxe a barra até a parte alta do peito e volte ao alongamento completo.',
    ],
    ['Peito para cima, barra na clavícula', 'Deixe as escápulas subirem em cima'],
    ['Inclinar tanto que vira remada', 'Puxar atrás da nuca'],
  ),
  'lateral-raise': e(
    'Elevação lateral',
    ['elevação lateral com halteres', 'elevação lateral em pé'],
    [
      'Em pé com os halteres ao lado do corpo e os cotovelos levemente dobrados.',
      'Suba para os lados até os braços ficarem na altura dos ombros.',
      'Desça devagar.',
    ],
    ['Conduza com os cotovelos', 'Pare na altura dos ombros'],
    ['Jogar o peso para cima com a lombar', 'Usar peso demais'],
  ),
  'leg-extension': e(
    'Cadeira extensora',
    ['extensora', 'extensão de joelhos'],
    [
      'Ajuste o rolo logo acima dos tornozelos.',
      'Estenda os joelhos até as pernas ficarem retas.',
      'Desça com controle sem deixar o peso descansar.',
    ],
    ['Pausa breve em cima', 'Devagar na descida'],
    ['Balançar o tronco para começar cada repetição'],
  ),
  'leg-press': e(
    'Leg press',
    ['leg press 45', 'prensa de pernas'],
    [
      'Sente com os pés na largura dos ombros na plataforma.',
      'Desça até os joelhos chegarem a uns 90 graus.',
      'Empurre de volta sem travar os joelhos com força.',
    ],
    ['Não deixe a lombar sair do encosto', 'Controle a descida'],
    ['Descer tanto os joelhos que a pelve vira para dentro'],
  ),
  'log-press': e(
    'Log press',
    ['desenvolvimento com log', 'log strongman'],
    [
      'Use um log de strongman com pegadas neutras internas e uma área livre. Leve-o a um front rack estável com um clean praticado ou a partir de suportes adequados, e trave com os pés na largura dos ombros.',
      'Com o tronco ereto, flexione um pouco os joelhos, impulsione com as pernas e empurre o log acima da cabeça com as palmas voltadas uma para a outra.',
      'Termine com braços e joelhos estendidos e o log equilibrado sobre os ombros e o meio do pé. Não incline para trás pela lombar.',
      'Desça ao front rack com controle, amortecendo com os joelhos. Reajuste antes do próximo e devolva o log de um jeito praticado. Cada desenvolvimento acima da cabeça é uma repetição.',
    ],
    [
      'Segure firme as pegadas internas',
      'Flexione e impulsione na vertical',
      'Termine com o log equilibrado em cima',
    ],
    [
      'Empurrar a partir de um front rack instável',
      'Inclinar muito para trás em vez de entrar sob o log',
      'Largar o log sem uma área de queda livre',
    ],
  ),
  'lying-leg-curl': e(
    'Mesa flexora',
    ['flexora deitada', 'flexão de pernas deitado'],
    [
      'Deite de bruços com o rolo logo acima dos calcanhares.',
      'Puxe os calcanhares em direção aos glúteos.',
      'Desça devagar até o alongamento completo.',
    ],
    ['O quadril fica no banco', 'Negativa lenta'],
    ['Levantar o quadril para jogar o peso'],
  ),
  'lying-leg-raise': e(
    'Elevação de pernas deitado',
    ['abdominal infra', 'elevação de pernas no chão'],
    [
      'Deite de costas com a cabeça e as escápulas apoiadas, braços ao lado do quadril e palmas para baixo. Contraia o abdômen e mantenha a lombar suave contra o chão.',
      'Suba as duas pernas juntas com os joelhos levemente estendidos. Perto da vertical, enrole suavemente a pelve em direção às costelas sem balançar.',
      'Desça devagar só até onde as costas ficam estáveis. Dobre os joelhos ou diminua a descida se a lombar arquear.',
    ],
    ['Cabeça e ombros apoiados', 'Lombar estável', 'Controle a amplitude da descida'],
    [
      'Arquear as costas quando os calcanhares se aproximam do chão',
      'Balançar as pernas ou levantar a cabeça para compensar',
    ],
  ),
  'machine-chest-press': e(
    'Supino máquina',
    ['chest press', 'supino sentado na máquina'],
    [
      'Ajuste o banco para as alças ficarem no meio do peito.',
      'Empurre até estender os braços sem travar com força.',
      'Volte com controle até sentir alongar.',
    ],
    ['Escápulas para trás e para baixo', 'Amplitude completa, sem quicar'],
    ['Banco alto demais, o que vira supino inclinado'],
  ),
  'machine-lateral-raise': e(
    'Elevação lateral na máquina',
    ['máquina de elevação lateral'],
    [
      'Ajuste o banco para os ombros ficarem alinhados com o eixo da máquina e os apoios por fora dos braços, acima dos cotovelos.',
      'Sente ereto com os pés firmes e os cotovelos levemente dobrados. Suba os braços para os lados até a altura dos ombros.',
      'Desça os apoios devagar sem deixar a pilha de peso bater.',
    ],
    [
      'Conduza com os braços',
      'Ombros longe das orelhas',
      'Termine confortável na altura dos ombros',
    ],
    [
      'Encolher os ombros ou balançar o tronco',
      'Ajustar o banco com o eixo muito acima ou abaixo dos ombros',
    ],
  ),
  'machine-shrug': e(
    'Encolhimento na máquina',
    ['máquina de encolhimento'],
    [
      'Fique na máquina de encolhimento com os pés firmes e pegue fechado as alças laterais. Ajuste os limitadores antes de carregar.',
      'Braços estendidos e tronco parado enquanto sobe os dois ombros em direção às orelhas.',
      'Pause brevemente e desça os ombros com controle até um alongamento confortável.',
    ],
    ['Suba os ombros em linha reta', 'Cotovelos estendidos', 'Cabeça alinhada com o tronco'],
    ['Girar os ombros', 'Dobrar os cotovelos ou quicar com os joelhos'],
  ),
  'machine-triceps-extension': e(
    'Tríceps na máquina',
    ['extensão de tríceps na máquina', 'máquina de tríceps'],
    [
      'Ajuste o banco para os braços apoiarem no estofado da frente e os cotovelos alinharem com o eixo da alavanca. Segure as duas alças com os punhos retos.',
      'Com os braços no apoio, estenda os cotovelos para mover as alças pelo trajeto da máquina.',
      'Volte devagar a uma dobra confortável do cotovelo sem levantar os braços nem deixar a pilha bater.',
    ],
    ['Braços ficam no apoio', 'Mova pelos cotovelos', 'Termine sem travar os cotovelos com tranco'],
    [
      'Levantar ombros ou braços para mover as alças',
      'Usar embalo ou forçar o alongamento embaixo',
    ],
  ),
  'mountain-climbers': e(
    'Escalador',
    ['mountain climber', 'alpinista'],
    [
      'Comece em prancha alta com as mãos sob os ombros e o corpo em linha reta.',
      'Leve um joelho em direção ao peito sem subir o quadril e volte o pé enquanto o outro joelho avança.',
      'Alterne num ritmo que mantenha os ombros sobre as mãos e o tronco parado. Cada joelho conta como uma repetição.',
    ],
    ['Quadril nivelado', 'Ombros sobre as mãos', 'Controle cada joelho'],
    ['Quicar o quadril ou afundar a lombar', 'Ir tão rápido que pés e tronco perdem o controle'],
  ),
  'muscle-up': e(
    'Muscle-up',
    ['muscle up na barra', 'bar muscle-up'],
    [
      'Use uma barra reta segura com espaço de sobra acima e em volta para a transição e o balanço. Comece com pegada pronada fechada e ombros ativos. Esta versão usa um kip controlado.',
      'Faça um pequeno balanço de canoa a arco, depois empurre o quadril e puxe a barra em direção ao peito baixo, mantendo-a perto.',
      'Quando o tronco passar acima da barra, passe os dois cotovelos juntos e incline o peito para a frente até uma paralela estável na barra.',
      'Empurre até o apoio com os braços retos. Inverta a transição com controle e reajuste o balanço antes da próxima. Pratique separadamente a puxada, a transição e a paralela na barra antes de juntá-las.',
    ],
    [
      'Barra perto na transição',
      'Passe os dois cotovelos juntos',
      'Controle o balanço e a descida',
    ],
    [
      'Passar um cotovelo antes do outro',
      'Tentar a transição sem barra fixa e paralela na barra fortes',
      'Usar uma barra com pouco espaço acima ou para o balanço',
    ],
  ),
  'neck-curl': e(
    'Flexão de pescoço',
    ['flexão cervical deitado', 'fortalecimento de pescoço'],
    [
      'Deite de costas num banco reto com as escápulas e o tronco apoiados, pés firmes e a cabeça logo além da ponta. Comece sem peso adicional.',
      'Recolha o queixo suavemente e levante a cabeça um pouco usando a frente do pescoço. Os ombros ficam no banco.',
      'Desça devagar a uma posição confortável sem deixar a cabeça cair para trás. Use uma amplitude pequena e sem dor, e pare se sentir dor no pescoço ou tontura.',
    ],
    ['Comece sem peso adicional', 'Ombros apoiados', 'Movimento lento e pequeno'],
    [
      'Transformar em abdominal',
      'Cair num alongamento profundo do pescoço ou forçar o queixo para a frente',
    ],
  ),
  'one-arm-cable-bicep-curl': e(
    'Rosca unilateral na polia',
    ['rosca com um braço na polia', 'rosca bíceps unilateral no cabo'],
    [
      'Prenda uma alça numa polia baixa e segure com uma mão, palma para a frente. Fique de frente para a máquina com uma base estável e o cotovelo ao lado das costelas.',
      'Suba a alça em direção ao ombro que trabalha com o braço parado e o punho reto. A mão livre no quadril ou relaxada.',
      'Desça devagar até quase estender o braço sem girar o tronco. Faça os dois lados e registre as repetições por braço.',
    ],
    ['Palma para cima', 'Cotovelo ao lado das costelas', 'Tronco parado'],
    ['Girar o tronco para mover a alça', 'Dobrar o punho ou levar o braço para a frente'],
  ),
  'one-arm-pull-ups': e(
    'Barra fixa com um braço',
    ['barra com um braço', 'one arm pull-up'],
    [
      'Use uma barra segura com espaço para descer com controle. É uma barra com um braço, sem ajuda e com pegada pronada; desenvolva antes progressões assistidas controladas.',
      'Pegue fechado com uma mão e ative o ombro com os pés fora do chão. A outra mão fica livre, sem segurar o punho nem a barra.',
      'Puxe o cotovelo em direção às costelas até o queixo passar a barra, sem chutar. Aceite uma pequena rotação confortável do corpo em vez de forçar o ombro.',
      'Desça com controle até o braço longo sem afundar no ombro. Pare antes de a pegada ou o controle do ombro falharem. Treine os dois lados e registre as repetições por braço.',
    ],
    ['Ombro que trabalha ativo', 'Mão livre longe da barra e do punho', 'Controle toda a descida'],
    [
      'Cair de repente num pendurado passivo com um braço',
      'Chutar ou contar repetições com ajuda do punho como livres',
    ],
  ),
  'one-arm-push-ups': e(
    'Flexão com um braço',
    ['flexão unilateral', 'one arm push-up'],
    [
      'Apoie uma palma firme sob o peito e afaste bem os pés além da largura dos ombros para ter estabilidade. Coloque a mão livre nas costas e trave o tronco.',
      'Dobre o cotovelo de apoio em direção às costelas para descer o peito com controle. Não deixe o quadril cair; uma pequena rotação natural do tronco é aceitável.',
      'Empurre com a palma de apoio até estender o braço sem torcer bruscamente. Faça os dois lados e registre as repetições por braço. Pratique com a mão numa superfície elevada estável antes do chão.',
    ],
    [
      'Base larga e estável',
      'Trave contra rotação excessiva',
      'Cotovelo que trabalha perto das costelas',
    ],
    [
      'Usar base estreita antes de controlar a rotação',
      'Afundar a lombar ou empurrar com a mão livre',
    ],
  ),
  'one-arm-seated-cable-row': e(
    'Remada baixa unilateral',
    ['remada sentada com um braço', 'remada unilateral na polia'],
    [
      'Prenda uma alça no cabo da remada sentada. Sente com os dois pés firmes nos apoios, joelhos levemente dobrados e peito ereto. Segure a alça com uma mão em pegada neutra.',
      'Pelve e tronco de frente enquanto leva o cotovelo em direção ao quadril e a alça às costelas baixas. A mão livre na coxa.',
      'Estenda o braço devagar, deixando a escápula avançar com conforto sem arredondar a lombar. Faça os dois lados e registre as repetições por braço.',
    ],
    ['Tronco de frente', 'Leve o cotovelo ao quadril', 'Deixe a escápula se mover com controle'],
    ['Girar ou balançar o tronco para mover a carga', 'Encolher o ombro ou arredondar a lombar'],
  ),
  'overhead-press': e(
    'Desenvolvimento militar',
    ['desenvolvimento em pé', 'press militar', 'desenvolvimento com barra'],
    [
      'Pegue a barra na altura da clavícula com pegada na largura dos ombros.',
      'Trave o abdômen e contraia os glúteos.',
      'Empurre acima da cabeça afastando um pouco a cabeça e passe-a por baixo da barra no topo.',
    ],
    ['Costelas baixas', 'Barra perto do rosto', 'Termine com a barra sobre as orelhas'],
    ['Inclinar para trás até virar supino inclinado'],
  ),
  'overhead-squat': e(
    'Agachamento overhead',
    ['agachamento com barra acima da cabeça', 'OHS'],
    [
      'Aprenda com um bastão ou barra leve numa área livre e pratique uma saída segura antes de carregar. Use uma pegada larga de arranco e leve a barra acima da cabeça com uma técnica que você já domina.',
      'Posicione os pés numa base de agachamento confortável. Trave e sustente ativamente a barra sobre o meio do pé com os cotovelos estendidos.',
      'Agache devagar com o pé inteiro no chão e os joelhos na linha dos pés. Desça só até onde a barra continua equilibrada acima da cabeça.',
      'Levante mantendo o mesmo suporte em cima. Devolva a barra com segurança usando sua técnica praticada; pare a série se os cotovelos dobrarem ou perder o equilíbrio.',
    ],
    [
      'Barra equilibrada sobre o meio do pé',
      'Empurre para cima contra a barra',
      'Pé inteiro no chão',
    ],
    [
      'Forçar a profundidade enquanto a barra vai para a frente',
      'Dobrar os cotovelos ou carregar além do controle acima da cabeça',
    ],
  ),
  'overhead-triceps-extension': e(
    'Tríceps francês',
    [
      'extensão de tríceps acima da cabeça',
      'tríceps testa em pé',
      'tríceps na polia acima da cabeça',
    ],
    [
      'Fique de costas para uma polia baixa ou segure um halter acima da cabeça.',
      'Braços ao lado das orelhas, desça atrás da cabeça.',
      'Estenda de volta até ficar reto.',
    ],
    ['Os braços ficam parados', 'Busque um bom alongamento embaixo'],
    ['Deixar os cotovelos abrirem demais'],
  ),
  'pec-deck': e(
    'Voador',
    ['peck deck', 'crucifixo na máquina', 'fly na máquina'],
    [
      'Ajuste o banco para as alças ficarem na altura do peito.',
      'Junte os apoios na sua frente.',
      'Volte até sentir alongar, sem deixar o peso descansar.',
    ],
    ['Peito alto', 'Pausa breve na contração'],
    ['Encolher os ombros no fim de cada repetição'],
  ),
  'pike-push-up': e(
    'Flexão pike',
    ['pike push-up', 'flexão em V'],
    [
      'Comece apoiado nas mãos e nos pés com as mãos na largura dos ombros. Suba o quadril formando um V invertido com a cabeça entre os braços.',
      'Dobre os cotovelos para trás e desça a cabeça em direção a um ponto um pouco à frente das mãos, quadril alto.',
      'Empurre o chão até estender os braços e volte ao V invertido. A cabeça não toca o chão.',
    ],
    [
      'Quadril alto',
      'Cotovelos em ângulo para trás',
      'Controle o caminho da cabeça à frente das mãos',
    ],
    [
      'Baixar o quadril até uma flexão comum',
      'Apoiar o peso na cabeça ou abrir muito os cotovelos',
    ],
  ),
};
