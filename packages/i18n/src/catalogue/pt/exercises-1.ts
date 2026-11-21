import { exercise as e } from '../entry.js';
import type { ExerciseText } from '../types.js';

export const exercises1: Readonly<Record<string, ExerciseText>> = {
  'ab-crunch': e(
    'Abdominal crunch',
    ['abdominal', 'crunch', 'abdominal supra'],
    [
      'Deite de costas com os joelhos dobrados e os pés apoiados, mãos ao lado da cabeça ou uma anilha no peito.',
      'Tire os ombros do chão arredondando a parte alta das costas, costelas em direção ao quadril.',
      'Pause em cima e desça com controle até os ombros tocarem o chão.',
    ],
    ['Costelas em direção ao quadril', 'A lombar fica no chão', 'Solte o ar ao subir'],
    [
      'Puxar a cabeça com as mãos',
      'Subir até sentar, o que transfere o trabalho para os flexores do quadril',
    ],
  ),
  'ab-wheel-rollout': e(
    'Roda abdominal',
    ['rolinho abdominal', 'ab wheel', 'rollout ajoelhado'],
    [
      'Ajoelhe em uma superfície confortável com as duas mãos na roda abaixo dos ombros. Contraia glúteos e abdômen.',
      'Role para a frente devagar, abrindo ombros e quadril com as costelas baixas e a lombar estável. Pare antes de perder essa posição.',
      'Puxe a roda de volta aos joelhos com o tronco firme. Comece com percursos curtos e aumente conforme o controle melhora.',
    ],
    [
      'Costelas baixas e glúteos contraídos',
      'Pare antes de a lombar arquear',
      'Mova ombros e quadril juntos',
    ],
    ['Rolar mais longe do que o abdômen controla', 'Dobrar bruscamente o quadril para voltar'],
  ),
  'air-bike': e(
    'Air bike',
    ['assault bike', 'echo bike', 'bicicleta de ar'],
    [
      'Ajuste o banco como numa bicicleta comum.',
      'Empurre e puxe as alavancas junto com os pedais: quanto mais forte, mais o ventilador resiste.',
      'Nos intervalos, forte no esforço e pedalada leve no descanso.',
    ],
    ['Braços e pernas juntos', 'Solte o ar ao empurrar'],
    ['Começar o intervalo no máximo e não ter mais nada na metade'],
  ),
  'arnold-press': e(
    'Desenvolvimento Arnold',
    ['arnold press', 'desenvolvimento arnold com halteres'],
    [
      'Em pé, pés na largura do quadril e joelhos soltos. Segure os halteres na frente dos ombros, palmas para você e cotovelos dobrados. Contraia abdômen e glúteos.',
      'Empurre para cima girando as palmas para a frente e abrindo os cotovelos. Costelas sobre a pelve, sem impulso das pernas.',
      'Desça devagar desfazendo o giro até os halteres voltarem à frente dos ombros. Use uma amplitude confortável sem forçar o giro.',
    ],
    ['Gire suavemente ao empurrar', 'Costelas baixas', 'Punhos sobre os antebraços'],
    ['Arquear a lombar para terminar', 'Forçar os ombros numa posição baixa desconfortável'],
  ),
  'back-extension': e(
    'Extensão lombar',
    ['hiperextensão', 'extensão lombar 45 graus', 'banco romano'],
    [
      'Ajuste o apoio logo abaixo da dobra do quadril.',
      'Desça dobrando o quadril até sentir alongar os posteriores.',
      'Suba até o corpo formar uma linha reta.',
    ],
    ['Pare na linha reta, sem arquear além', 'Contraia os glúteos em cima'],
    ['Hiperestender a coluna em cima'],
  ),
  'barbell-back-squat': e(
    'Agachamento livre',
    ['agachamento', 'agachamento com barra', 'back squat'],
    [
      'Apoie a barra na parte alta das costas e trave bem o tronco.',
      'Tire a barra, dê um passo atrás e afaste os pés um pouco mais que o quadril.',
      'Sente entre os quadris até as coxas ficarem pelo menos paralelas e suba com força.',
    ],
    ['Respire fundo e trave', 'Joelhos na linha dos pés', 'Empurre o chão com o pé inteiro'],
    [
      'Deixar o peito cair para a frente na saída do fundo',
      'Diminuir a profundidade quando a carga sobe',
    ],
  ),
  'barbell-bench-press': e(
    'Supino reto com barra',
    ['supino', 'supino reto', 'bench press'],
    [
      'Deite com os olhos sob a barra e os pés apoiados no chão.',
      'Pegue um pouco mais aberto que os ombros e aperte a barra.',
      'Tire a barra, desça com controle até o meio do peito e empurre de volta.',
    ],
    ['Peito para cima', 'Cotovelos a uns 45 graus', 'Empurre o chão com os pés'],
    ['Quicar a barra no peito', 'Abrir os cotovelos totalmente para os lados'],
  ),
  'barbell-calf-raise': e(
    'Panturrilha em pé com barra',
    ['elevação de panturrilha com barra', 'panturrilha na anilha'],
    [
      'No rack com as travas de segurança ajustadas, coloque uma anilha plana e estável sob a ponta dos pés, calcanhares livres atrás da borda. Comece com uma barra leve na parte alta das costas, abaixo do pescoço.',
      'Trave o tronco e suba na ponta dos dois pés o mais alto que controlar, joelhos levemente estendidos.',
      'Pause e desça os calcanhares devagar até um alongamento confortável, sem balançar a anilha nem quicar. Devolva a barra ao rack antes de descer.',
    ],
    [
      'Ponta dos pés firme na anilha',
      'Suba reto pelos tornozelos',
      'Controle o alongamento e o topo',
    ],
    [
      'Equilibrar-se numa anilha que balança ou escorrega',
      'Quicar embaixo ou dobrar os joelhos para subir a barra',
    ],
  ),
  'barbell-curl': e(
    'Rosca direta com barra',
    ['rosca direta', 'rosca bíceps', 'rosca barra reta'],
    [
      'Em pé, segure a barra na largura dos ombros, braços estendidos.',
      'Suba a barra até a altura dos ombros com os cotovelos ao lado do corpo.',
      'Desça com controle até a extensão completa.',
    ],
    ['Cotovelos colados nas costelas', 'Extensão completa embaixo'],
    ['Balançar o quadril para começar cada repetição'],
  ),
  'barbell-front-squat': e(
    'Agachamento frontal',
    ['front squat', 'agachamento frontal com barra'],
    [
      'Apoie a barra na frente dos ombros com os cotovelos altos.',
      'Agache mantendo o tronco ereto.',
      'Suba sem deixar os cotovelos caírem.',
    ],
    ['Cotovelos altos', 'Peito alto'],
    ['Baixar os cotovelos, o que derruba a barra para a frente'],
  ),
  'barbell-hip-thrust': e(
    'Elevação pélvica com barra',
    ['hip thrust', 'elevação pélvica', 'ponte de glúteo com barra'],
    [
      'Sente com a parte alta das costas apoiada num banco e a barra sobre o quadril.',
      'Suba o quadril até o tronco ficar paralelo ao chão.',
      'Desça com controle sem apoiar a barra no chão.',
    ],
    ['Queixo recolhido, costelas baixas', 'Contraia forte os glúteos em cima'],
    ['Hiperestender a lombar em cima em vez de terminar com os glúteos'],
  ),
  'barbell-lunge': e(
    'Avanço com barra',
    ['afundo com barra', 'passada com barra', 'lunge com barra'],
    [
      'Tire uma barra sobre a parte alta das costas com pegada fechada e trave o tronco. Fique em pé, pés na largura do quadril e espaço livre à frente.',
      'Dê um passo à frente num trilho próprio, na largura do quadril. Dobre os dois joelhos com controle, pé da frente firme e pelve nivelada.',
      'Empurre com o pé da frente para voltar à posição inicial. Alterne os lados ou termine um lado, e registre as repetições por perna.',
    ],
    [
      'Pise em dois trilhos',
      'O pé da frente fica firme',
      'Controle a volta antes do próximo passo',
    ],
    [
      'Pisar como numa corda bamba ou deixar o joelho da frente cair para dentro',
      'Bater o joelho de trás no chão',
    ],
  ),
  'barbell-preacher-curl': e(
    'Rosca Scott (barra)',
    ['rosca scott com barra', 'rosca scott', 'preacher curl'],
    [
      'Ajuste o apoio para que as axilas fiquem na borda de cima.',
      'Pegue uma barra reta na largura dos ombros, palmas para cima, e suba sem chegar à vertical.',
      'Desça devagar até os braços ficarem quase estendidos.',
    ],
    ['Os cotovelos não saem do apoio', 'Punhos retos, sem dobrar para trás'],
    [
      'Deixar o peso cair embaixo, o que força o cotovelo',
      'Carregar como na barra W; a pegada reta é mais dura para os punhos',
    ],
  ),
  'barbell-row': e(
    'Remada curvada com barra',
    ['remada curvada', 'remada com barra', 'remada pendlay'],
    [
      'Incline-se a partir do quadril até o tronco ficar a uns 45 graus, costas retas.',
      'Puxe a barra até a parte baixa das costelas.',
      'Desça com controle sem deixar as costas arredondarem.',
    ],
    ['Costas retas o tempo todo', 'Cotovelos além das costelas'],
    ['Levantar o tronco quando a série fica difícil', 'Puxar no tranco com a lombar'],
  ),
  'barbell-shrug': e(
    'Encolhimento com barra',
    ['encolhimento', 'encolhimento de ombros', 'shrug'],
    [
      'Segure a barra com os braços estendidos na frente das coxas.',
      'Suba os ombros em linha reta em direção às orelhas.',
      'Desça com controle até o alongamento completo.',
    ],
    ['Sobe e desce em linha reta', 'Pausa em cima'],
    ['Girar os ombros, o que não acrescenta nada e irrita a articulação'],
  ),
  'bench-dips': e(
    'Tríceps banco',
    ['mergulho no banco', 'paralela no banco'],
    [
      'Sente na beirada de um banco estável com as mãos ao lado do quadril, dedos para a frente. Firme os pés e leve o quadril logo à frente da borda. Comece com os joelhos dobrados.',
      'Dobre os cotovelos para trás e desça o quadril perto do banco só até onde os ombros permitirem com conforto.',
      'Empurre com as palmas para estender os cotovelos e subir o quadril. Mantenha o peito aberto e pare se a posição do ombro ficar desconfortável.',
    ],
    ['Quadril perto do banco', 'Ombros baixos', 'Use uma profundidade curta e confortável'],
    [
      'Deixar os ombros muito abaixo dos cotovelos',
      'Deixar o banco escorregar ou o quadril ir longe para a frente',
    ],
  ),
  'bicycle-crunch': e(
    'Abdominal bicicleta',
    ['bicicleta', 'abdominal bicicleta alternado'],
    [
      'Deite de costas com os joelhos dobrados acima do quadril e as mãos levemente ao lado da cabeça. Tire um pouco as escápulas do chão e contraia o abdômen.',
      'Gire o peito em direção a um joelho dobrado enquanto estende a perna oposta. Leve o ombro ao joelho sem puxar a cabeça.',
      'Troque de lado devagar com a lombar estável. Cada lado conta como uma repetição.',
    ],
    [
      'Gire o peito, não só o cotovelo',
      'Mãos só encostadas ao lado da cabeça',
      'Estenda a perna só até onde controla',
    ],
    ['Puxar o pescoço para a frente com as mãos', 'Pedalar rápido sem girar o tronco'],
  ),
  'box-squat': e(
    'Agachamento no caixote',
    ['box squat', 'agachamento sentando na caixa'],
    [
      'Coloque um caixote estável atrás de você dentro de um rack com travas. Escolha uma altura que consiga controlar. Tire a barra sobre a parte alta das costas e ajuste a base.',
      'Trave o tronco e dobre quadril e joelhos, sentando para trás no caixote com os pés firmes e os joelhos na linha dos pés.',
      'Encoste com suavidade e pause brevemente sem perder a tensão do tronco nem a pressão dos pés.',
      'Empurre com os dois pés para levantar sem balançar para a frente nem quicar no caixote.',
    ],
    ['Sente com suavidade e controle', 'Fique travado no caixote', 'Levante sem balançar'],
    ['Despencar no caixote ou relaxar a lombar', 'Usar um caixote instável ou baixo demais'],
  ),
  'bulgarian-split-squat': e(
    'Agachamento búlgaro',
    ['búlgaro', 'afundo búlgaro', 'split squat com pé elevado'],
    [
      'Apoie o pé de trás num banco atrás de você.',
      'Desça até a coxa da frente ficar mais ou menos paralela.',
      'Suba empurrando com o pé da frente.',
    ],
    ['Peso no calcanhar da frente', 'Tronco um pouco inclinado para os glúteos'],
    ['Ficar perto demais do banco, o que aperta o joelho da frente'],
  ),
  burpees: e(
    'Burpees',
    ['burpee'],
    [
      'Em pé, pés na largura dos ombros. Agache e apoie as duas palmas firmes no chão à sua frente.',
      'Salte ou leve os pés para trás até uma prancha alta firme. Esta versão não inclui flexão; quadril alinhado com os ombros.',
      'Traga os pés por fora das mãos, levante o peito e fique em pé com um pequeno salto vertical, braços para cima.',
      'Aterrisse suave e comece a próxima com controle. Agachamento, prancha, volta e salto contam como uma repetição.',
    ],
    [
      'Trave antes de levar os pés para trás',
      'Pés por fora das mãos',
      'Aterrisse suave e reajuste',
    ],
    ['Deixar o quadril cair na prancha', 'Voltar com pressa ou aterrissar com os joelhos rígidos'],
  ),
  'cable-crunch': e(
    'Abdominal na polia',
    ['abdominal ajoelhado na polia', 'abdominal com corda'],
    [
      'Ajoelhe de costas para uma polia alta com a corda ao lado da cabeça.',
      'Encolha para baixo arredondando a coluna, não dobrando o quadril.',
      'Volte com controle.',
    ],
    ['O quadril fica parado', 'Arredonde a coluna de propósito'],
    ['Transformar em dobra de quadril e trabalhar os flexores do quadril'],
  ),
  'cable-curl': e(
    'Rosca na polia',
    ['rosca bíceps na polia', 'rosca com corda'],
    [
      'Fique de frente para uma polia baixa com barra reta ou corda.',
      'Suba até a altura dos ombros com os cotovelos ao lado do corpo.',
      'Desça até estender os braços mantendo a tensão no cabo.',
    ],
    ['Cotovelos parados', 'Contraia em cima'],
    ['Inclinar para trás para terminar a repetição'],
  ),
  'cable-fly': e(
    'Crucifixo na polia',
    ['crossover', 'crucifixo no cabo', 'cross over'],
    [
      'Ajuste as duas polias na altura dos ombros ou acima.',
      'Dê um passo à frente em base afastada, com os cotovelos levemente dobrados.',
      'Junte as alças na frente do peito e volte com controle.',
    ],
    ['Ângulo do cotovelo fixo', 'Contraia no meio'],
    ['Transformar em supino dobrando e estendendo os cotovelos'],
  ),
  'cable-hammer-curl': e(
    'Rosca martelo na polia',
    ['rosca martelo com corda', 'rosca neutra na polia'],
    [
      'Prenda uma corda numa polia baixa. De frente para a máquina, segure uma ponta em cada mão, palmas voltadas uma para a outra e polegares para cima.',
      'Em pé, cotovelos ao lado das costelas, suba a corda em direção aos ombros sem mover os braços.',
      'Desça devagar até quase estender os cotovelos, punhos neutros e a carga sob controle.',
    ],
    ['Polegares para cima', 'Cotovelos ao lado das costelas', 'Desça sem balançar'],
    [
      'Inclinar para trás para mover a carga',
      'Dobrar os punhos ou levar os cotovelos para a frente',
    ],
  ),
  'cable-kickback': e(
    'Coice na polia',
    ['glúteo no cabo', 'kickback na polia', 'extensão de quadril na polia'],
    [
      'Prenda uma caneleira numa polia baixa em volta de um tornozelo. De frente para a máquina, segure com as duas mãos e solte o joelho de apoio.',
      'Trave o tronco com leve inclinação. Leve a perna com a caneleira para trás a partir do quadril, pelve reta e joelho levemente dobrado.',
      'Pare antes de a lombar arquear e volte devagar sem apoiar a carga. Faça os dois lados e registre as repetições por perna.',
    ],
    ['Mova a partir do quadril', 'Pelve reta', 'Pare antes de arquear a lombar'],
    ['Balançar a perna ou girar a pelve', 'Arquear as costas para subir mais o pé'],
  ),
  'cable-lat-pullover': e(
    'Pulldown com braços estendidos',
    ['pullover na polia', 'pullover com corda', 'pullover'],
    [
      'Pegue uma corda na polia alta, dê um passo atrás e incline-se até os braços ficarem acima da cabeça.',
      'Com os cotovelos levemente dobrados e fixos, puxe a corda em arco até passar o quadril.',
      'Deixe subir de volta até sentir o alongamento dos dorsais.',
    ],
    ['Quadril para trás, peito para baixo', 'Termine com as mãos junto ao quadril'],
    ['Dobrar os cotovelos e virar um tríceps na polia', 'Ficar ereto, o que encurta o alongamento'],
  ),
  'cable-lateral-raise': e(
    'Elevação lateral na polia',
    ['elevação lateral unilateral na polia', 'elevação lateral no cabo'],
    [
      'Fique de lado para uma polia baixa e segure a alça com a mão mais distante, cabo cruzando na frente das coxas. Use a outra mão para se apoiar.',
      'Com o cotovelo levemente dobrado e fixo, suba o braço para o lado até a altura do ombro, sem inclinar nem encolher o ombro.',
      'Desça devagar na frente do corpo mantendo a tensão. Faça os dois lados e registre as repetições por braço.',
    ],
    ['Conduza com o cotovelo', 'Tronco parado', 'Pare na altura do ombro'],
    ['Balançar para longe da máquina', 'Encolher o ombro ou mudar o ângulo do cotovelo'],
  ),
  'cable-woodchop': e(
    'Lenhador na polia',
    ['lenhador', 'woodchop', 'rotação na polia'],
    [
      'Ajuste o cabo na altura dos ombros e fique de lado.',
      'Segure a alça com as duas mãos, braços quase estendidos.',
      'Gire pelo tronco e puxe cruzando o corpo, depois volte devagar.',
    ],
    ['Gire pelas costelas, não pelos braços', 'Quadril voltado para a frente'],
    ['Puxar com os braços em vez de girar o tronco'],
  ),
  'chest-dip': e(
    'Paralelas (foco no peito)',
    ['paralelas', 'mergulho', 'mergulho para peito'],
    [
      'Apoie-se nas barras com os braços estendidos.',
      'Incline o tronco uns 30 graus para a frente e deixe os cotovelos abrirem um pouco.',
      'Desça até os braços ficarem na horizontal e empurre de volta.',
    ],
    ['Incline para focar o peito', 'Ombros longe das orelhas'],
    ['Descer mais do que os ombros toleram', 'Ficar ereto, o que vira paralela de tríceps'],
  ),
  'chest-supported-dumbbell-row': e(
    'Remada com halteres apoiada no banco',
    ['remada apoiada', 'remada no banco inclinado', 'remada serrote apoiada'],
    [
      'Ajuste um banco entre 30 e 45 graus e deite de bruços, peito no apoio.',
      'Deixe um halter pendurado em cada mão.',
      'Leve os dois cotovelos para trás além do tronco, contraia e desça até o alongamento completo.',
    ],
    ['O peito fica no apoio', 'Conduza com os cotovelos', 'Junte as escápulas'],
    [
      'Tirar o peito do apoio para puxar a carga no tranco',
      'Encolher os ombros em direção às orelhas',
    ],
  ),
  'chin-up': e(
    'Barra fixa supinada',
    ['chin up', 'barra supinada', 'barra pegada supinada'],
    [
      'Pendure-se na barra com pegada supinada na largura dos ombros.',
      'Puxe até o queixo passar a barra.',
      'Desça com controle até ficar totalmente pendurado.',
    ],
    ['Leve os cotovelos para baixo e para trás', 'Pendure totalmente embaixo'],
    ['Encurtar o final da descida'],
  ),
  'clean-and-jerk': e(
    'Arremesso',
    ['clean and jerk', 'arremesso olímpico'],
    [
      'Use uma área livre com anilhas bumper e aprenda separadamente o clean, a posição de front rack e o jerk em tesoura com uma barra leve antes de juntá-los. Fique com a barra sobre o meio do pé, mãos por fora das pernas e costas travadas.',
      'Empurre o chão com a barra perto ao passar pelos joelhos. Estenda pernas e quadril e entre debaixo para receber a barra na frente dos ombros, cotovelos à frente.',
      'Fique totalmente em pé depois do clean, acomode a barra no front rack e trave para o jerk.',
      'Flexione um pouco na vertical, impulsione com as pernas e entre sob a barra numa tesoura estável com os dois cotovelos travados. Pés em trilhos separados, na largura do quadril.',
      'Saia da tesoura com passos controlados até juntar os pés com a barra estável em cima. Devolva a barra de um jeito praticado e adequado à carga e ao espaço. Um clean mais um jerk é uma repetição.',
    ],
    [
      'Barra perto no clean',
      'Fique em pé e estabilize antes do jerk',
      'Flexione na vertical e impulsione com as pernas',
      'Receba o jerk em dois trilhos',
    ],
    [
      'Puxar cedo com os braços ou afastar a barra',
      'Arremessar a partir de um front rack instável',
      'Receber com cotovelos moles ou pés numa linha só',
    ],
  ),
  'close-grip-bench-press': e(
    'Supino pegada fechada',
    ['supino fechado', 'supino pegada estreita'],
    [
      'Segure a barra mais ou menos na largura dos ombros.',
      'Desça até a parte baixa do peito com os cotovelos fechados.',
      'Empurre de volta usando o tríceps.',
    ],
    ['Cotovelos fechados a uns 30 graus', 'Punhos sobre os cotovelos'],
    ['Pegar tão fechado que os punhos doem'],
  ),
  'close-grip-dumbbell-bench-press': e(
    'Supino com halteres pegada fechada',
    ['squeeze press', 'supino fechado com halteres'],
    [
      'Deite num banco reto com os pés firmes e a parte alta das costas apoiada. Segure dois halteres encostados sobre o peito, palmas voltadas uma para a outra.',
      'Punhos retos e cotovelos perto do corpo ao descer os halteres até a parte baixa do peito. Os pesos ficam nivelados e juntos.',
      'Empurre os dois juntos até estender os braços sem travar os cotovelos com tranco. Mantenha a pegada neutra e fechada o tempo todo.',
    ],
    ['Halteres juntos e nivelados', 'Punhos sobre os antebraços', 'Cotovelos perto das costelas'],
    [
      'Deixar um halter inclinar ou passar na frente do outro',
      'Abrir os cotovelos ou perder o punho neutro',
    ],
  ),
  'close-grip-incline-bench-press': e(
    'Supino inclinado pegada fechada',
    ['supino inclinado fechado com barra'],
    [
      'Ajuste um banco inclinado a uns 30 graus num rack com travas. Deite com os pés firmes e pegue a barra em pronação fechada na largura dos ombros.',
      'Tire a barra sobre a parte alta do peito. Desça com controle até ela, punhos sobre os antebraços e cotovelos em ângulo para o tronco.',
      'Empurre pelo mesmo caminho sem levantar o quadril. Use um parceiro ou travas bem ajustadas e devolva com segurança.',
    ],
    [
      'Pegada fechada na largura dos ombros',
      'Parte alta das costas no banco',
      'Desça com os punhos sobre os antebraços',
    ],
    [
      'Pegar tão fechado que os punhos dobram para o lado',
      'Abrir os cotovelos ou quicar a barra no peito',
    ],
  ),
  'close-grip-lat-pulldown': e(
    'Puxada com pegada fechada',
    ['puxada triângulo', 'puxada neutra', 'pulldown fechado'],
    [
      'Prenda um triângulo fechado no puxador e ajuste o apoio das coxas para segurar bem as pernas. Segure as duas alças com as palmas voltadas uma para a outra e os polegares fechados.',
      'Sente ereto com uma leve inclinação para trás fixa. Puxe o triângulo até a parte alta do peito levando os cotovelos para baixo ao lado das costelas.',
      'Volte devagar até os braços longos e um alongamento confortável, sem balançar o tronco nem deixar a carga bater.',
    ],
    ['Leve os cotovelos para baixo', 'Punhos retos', 'Ângulo do tronco estável'],
    [
      'Balançar para trás para mover a carga',
      'Puxar atrás da nuca ou dobrar os punhos para dentro',
    ],
  ),
  'concentration-curl': e(
    'Rosca concentrada',
    ['rosca concentrada sentado', 'rosca unilateral'],
    [
      'Sente num banco e apoie a parte de trás de um braço contra o lado interno da coxa.',
      'Suba o halter em direção ao ombro.',
      'Desça com controle até estender o braço, depois troque de lado.',
    ],
    ['O braço fica na coxa', 'Devagar na descida'],
    ['Empurrar o braço com a coxa'],
  ),
  'conventional-deadlift': e(
    'Levantamento terra',
    ['terra', 'deadlift', 'levantamento terra convencional'],
    [
      'Posicione o meio do pé sob a barra, canelas perto.',
      'Desça dobrando o quadril, segure logo por fora das pernas e tire a folga da barra.',
      'Levante empurrando o chão e termine ereto.',
    ],
    [
      'Costas retas, peito para cima',
      'A barra fica encostada nas pernas',
      'Contraia os glúteos em cima',
    ],
    ['Arredondar a lombar', 'Arrancar a barra do chão no tranco'],
  ),
  'decline-ab-crunch': e(
    'Abdominal declinado',
    ['abdominal no banco declinado', 'crunch declinado'],
    [
      'Prenda os pés sob os rolos de um banco declinado e deite, mãos ao lado da cabeça ou uma anilha no peito.',
      'Suba os ombros arredondando a parte alta das costas, costelas em direção ao quadril.',
      'Desça com controle e pare antes de os ombros encostarem no banco para manter a tensão no abdômen.',
    ],
    ['Arredonde a coluna, não dobre o quadril', 'Devagar na descida', 'Solte o ar ao subir'],
    [
      'Subir no embalo e despencar',
      'Subir até sentar, o que passa o trabalho aos flexores do quadril',
    ],
  ),
  'decline-bench-press': e(
    'Supino declinado',
    ['supino declinado com barra'],
    [
      'Prenda as pernas num banco levemente declinado sob uma barra no suporte. Ajuste as travas ou use um parceiro. Cabeça, costas e quadril apoiados.',
      'Pegada fechada um pouco mais aberta que os ombros e tire a barra. Desça devagar até a parte baixa do peito com os punhos sobre os cotovelos.',
      'Empurre de volta acima dos ombros sem quicar nem levantar o quadril. Devolva a barra com segurança antes de soltá-la ou sair do banco.',
    ],
    [
      'Prenda as pernas antes de tirar a barra',
      'Desça até a parte baixa do peito',
      'Ombros no banco',
    ],
    [
      'Quicar a barra ou abrir muito os cotovelos',
      'Começar sem as pernas presas ou sem um plano seguro para devolver a barra',
    ],
  ),
  'decline-dumbbell-bench-press': e(
    'Supino declinado com halteres',
    ['supino declinado halteres'],
    [
      'Prenda as pernas num banco levemente declinado e leve os halteres à altura do peito de forma controlada ou com ajuda. Cabeça, ombros e quadril apoiados.',
      'Empurre os halteres acima do peito com os punhos sobre os cotovelos e as palmas para a frente ou levemente para dentro.',
      'Desça devagar até uma posição confortável na altura do peito, cotovelos em ângulo para trás, e empurre de novo. Saia com controle após a última repetição.',
    ],
    ['Pernas bem presas', 'Punhos sobre os cotovelos', 'Controle a entrada e a saída'],
    [
      'Abrir os cotovelos ou descer além do confortável',
      'Tentar sentar com halteres pesados numa posição instável',
    ],
  ),
  'decline-dumbbell-fly': e(
    'Crucifixo declinado com halteres',
    ['crucifixo declinado'],
    [
      'Prenda as pernas num banco levemente declinado e leve halteres leves acima do peito, palmas voltadas uma para a outra. Planeje como entrar e sair com controle.',
      'Com os cotovelos levemente dobrados e fixos, abra os braços num arco amplo. Pare quando os braços chegarem mais ou menos ao nível do tronco, ou antes se precisar.',
      'Traga os halteres de volta acima do peito pelo mesmo arco sem mudar o ângulo do cotovelo nem bater os pesos.',
    ],
    [
      'Ângulo do cotovelo fixo',
      'Cargas leves e controladas',
      'Pare num alongamento confortável do peito',
    ],
    ['Descer os braços muito abaixo do tronco', 'Dobrar os cotovelos e transformar em supino'],
  ),
  'decline-push-up': e(
    'Flexão declinada',
    ['flexão com pés elevados', 'flexão declinada'],
    [
      'Apoie os pés num banco baixo e estável e as mãos no chão um pouco mais abertas que os ombros.',
      'Trave numa linha reta dos ombros aos calcanhares e desça o peito em direção ao chão com os cotovelos em ângulo para trás.',
      'Empurre o chão até estender os braços, quadril alinhado com o tronco.',
    ],
    [
      'Quadril alinhado com o tronco',
      'Desça o peito entre as mãos',
      'Comece com pouca elevação dos pés',
    ],
    ['Empinar ou afundar o quadril', 'Usar um apoio de pés instável ou alto demais'],
  ),
  'decline-smith-bench-press': e(
    'Supino declinado no Smith',
    ['supino declinado na máquina smith'],
    [
      'Centralize um banco levemente declinado sob a barra do Smith, prenda as pernas e ajuste as travas de segurança. Teste a barra vazia para que desça até a parte baixa do peito.',
      'Deite com cabeça, ombros e quadril apoiados. Pegada fechada um pouco mais aberta que os ombros, solte os ganchos e desça devagar.',
      'Empurre pelos trilhos sem quicar nem levantar o quadril. Gire a barra nos dois ganchos e confirme que está presa antes de soltar.',
    ],
    [
      'Teste o trajeto antes de carregar',
      'Travas abaixo da sua posição mais baixa',
      'Confira os dois ganchos antes de soltar',
    ],
    [
      'Posicionar o banco de modo que a barra vá para o pescoço',
      'Dispensar as travas ou soltar uma barra não presa',
    ],
  ),
  'diamond-push-ups': e(
    'Flexão diamante',
    ['flexão fechada', 'flexões diamante'],
    [
      'Comece em prancha alta com as mãos juntas sob o peito. Polegares e indicadores formam um diamante se for confortável; senão, deixe um pouco de espaço para os punhos.',
      'Trave o tronco e dobre os cotovelos para trás para descer o peito em direção às mãos.',
      'Empurre até estender os braços com o corpo em linha. Mantenha os joelhos no chão se precisar de uma versão mais fácil.',
    ],
    [
      'Cotovelos em ângulo para trás',
      'Quadril alinhado',
      'Escolha uma posição de mãos confortável para os punhos',
    ],
    ['Abrir os cotovelos ou encolher os ombros', 'Afundar a lombar para chegar às mãos'],
  ),
  'dumbbell-bench-press': e(
    'Supino reto com halteres',
    ['supino com halteres', 'supino halter'],
    [
      'Sente com os halteres sobre as coxas e leve-os para trás com um impulso dos joelhos ao deitar.',
      'Desça até os braços ficarem na altura do tronco.',
      'Empurre para cima e levemente para o centro.',
    ],
    ['Punhos sobre os cotovelos', 'Controle a descida'],
    ['Deixar os halteres se afastarem demais embaixo'],
  ),
  'dumbbell-curl': e(
    'Rosca com halteres',
    ['rosca alternada', 'rosca bíceps com halteres', 'rosca direta com halteres'],
    [
      'Em pé com um halter em cada mão, braços estendidos e palmas para a frente.',
      'Suba até a altura dos ombros com os cotovelos ao lado do corpo.',
      'Desça com controle até a extensão completa, juntos ou alternando.',
    ],
    ['Cotovelos colados nas costelas', 'Extensão completa embaixo'],
    ['Balançar o quadril para começar cada repetição', 'Deixar os cotovelos irem para a frente'],
  ),
  'dumbbell-preacher-curl': e(
    'Rosca Scott (halter)',
    ['rosca scott com halter', 'rosca scott unilateral'],
    [
      'Ajuste o apoio para que uma axila fique na borda de cima, com o halter nessa mão.',
      'Suba parando antes da vertical para manter a tensão.',
      'Desça devagar até o braço ficar quase estendido, depois troque de lado.',
    ],
    ['O cotovelo fica no apoio', 'Gire o dedo mínimo para cima no topo'],
    ['Deixar o peso cair embaixo, o que força o cotovelo'],
  ),
  'dumbbell-pullover': e(
    'Pullover com halter',
    ['pullover', 'pullover no banco'],
    [
      'Deite ao longo ou atravessado num banco reto segurando um halter acima do peito.',
      'Leve-o para trás da cabeça com os cotovelos só levemente dobrados.',
      'Traga de volta sobre o peito sem deixar as costelas abrirem.',
    ],
    ['Costelas baixas', 'Pare onde o alongamento termina, não onde o ombro cede'],
    [
      'Deixar os cotovelos dobrarem, o que passa o trabalho ao tríceps',
      'Descer mais do que o ombro aceita só pela amplitude',
    ],
  ),
  'dumbbell-romanian-deadlift': e(
    'Stiff com halteres',
    ['terra romeno com halteres', 'rdl com halteres', 'stiff halter'],
    [
      'Em pé, pés na largura do quadril, um halter em cada mão na frente das coxas. Joelhos soltos e tronco travado.',
      'Leve o quadril para trás e deixe os halteres descerem perto das pernas com os braços estendidos. Coluna estável e dobra dos joelhos quase igual.',
      'Pare num alongamento controlado dos posteriores antes de as costas arredondarem e empurre o quadril para a frente para subir. Os pesos não precisam tocar o chão.',
    ],
    ['Leve o quadril para trás', 'Pesos perto das pernas', 'Termine ereto sem inclinar para trás'],
    ['Agachar dobrando os joelhos a cada repetição', 'Buscar o chão arredondando as costas'],
  ),
  'dumbbell-shoulder-press': e(
    'Desenvolvimento com halteres',
    ['desenvolvimento sentado', 'desenvolvimento de ombros com halteres'],
    [
      'Sente com apoio nas costas e os halteres na altura das orelhas.',
      'Empurre acima da cabeça até estender os braços.',
      'Desça com controle de volta à altura das orelhas.',
    ],
    ['Punhos sobre os cotovelos', 'Não arqueie a lombar'],
    ['Meias repetições que nunca chegam à altura das orelhas'],
  ),
};
