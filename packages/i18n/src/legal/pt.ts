/** Política de privacidade e exclusão da conta, em português. Traduzido de `en.ts`. ADR-0189. */
import { BACKUP_RETENTION, CONTACT_EMAIL, CONTROLLER_ADDRESS, CONTROLLER_NAME } from './details.js';
import type { LegalText } from './types.js';

export const legal: LegalText = {
  chrome: {
    back: 'Voltar',
    openApp: 'Abrir o g7m',
    updated: (date) => `Última atualização: ${date}`,
    contents: 'Sumário',
    inShort: 'Em resumo',
    contact: 'Dúvidas sobre seus dados',
    translationNote:
      'Esta é uma tradução. Se ela divergir da versão em inglês, prevalece a versão em inglês.',
  },

  privacy: {
    title: 'Política de privacidade',
    summary: [
      'O g7m guarda o que você registra para mostrar de volta em cada dispositivo em que você entra. Não é usado para mais nada.',
      'Não há anúncios, nem análises, nem rastreamento, e nada é vendido ou compartilhado para marketing.',
      'Seus dados ficam na UE, no Supabase (Frankfurt) e no PowerSync (Irlanda).',
      'Em Ajustes, você pode baixar tudo em um arquivo e excluir sua conta com todos os dados a qualquer momento.',
    ],
    sections: [
      {
        id: 'who',
        heading: 'Quem é o responsável',
        blocks: [
          `O g7m é feito por ${CONTROLLER_NAME}, ${CONTROLLER_ADDRESS}, Croácia, controlador dos seus dados pessoais nos termos do Regulamento Geral sobre a Proteção de Dados da UE (RGPD). Escreva para ${CONTACT_EMAIL} sobre qualquer ponto desta política.`,
          'Esta política cobre o app web do g7m e os apps do g7m para Android e iOS, que são o mesmo app.',
        ],
      },
      {
        id: 'collected',
        heading: 'O que coletamos',
        blocks: [
          'Só o que você insere, mais o necessário para você entrar e manter seus dispositivos sincronizados:',
          {
            terms: [
              {
                term: 'Sua conta',
                detail:
                  'Seu e-mail e, se você usar uma, sua senha, guardada apenas como hash irreversível. Se você continuar com o Google, o Google nos informa seu e-mail e o ID da sua conta Google, e pode enviar também seu nome e foto de perfil, que o app não usa. Também guardamos quando a conta foi criada e quando você entrou pela última vez.',
              },
              {
                term: 'Seu perfil',
                detail:
                  'O nome que você escolher e, se informar, data de nascimento, sexo, país, peso corporal e nível de experiência. Também seus ajustes do app: unidades, idioma, descansos, início da semana, exercícios favoritos, academias e quais conquistas você já viu.',
              },
              {
                term: 'Seu treino',
                detail:
                  'Treinos com horários, notas e academia; os exercícios e séries deles (carga, repetições, esforço e, no cardio, tempo, distância, velocidade, inclinação, resistência, potência, andares e calorias); recordes pessoais, rotinas, objetivos de treino e seu nível.',
              },
              {
                term: 'Medidas corporais',
                detail:
                  'Pesagens, altura, percentual de gordura, nível de atividade e notas, só se você inserir.',
              },
              {
                term: 'Amigos, se você usar',
                detail:
                  'Seu código de amigo, os pedidos que você envia e aceita, desafios com amigos e seus resultados, suas duas chaves de compartilhamento, quando o app foi aberto pela última vez e se você está treinando agora (como um ID opaco que expira em cinco minutos, nunca o que você está fazendo).',
              },
              {
                term: 'Feedback que você envia',
                detail:
                  'A categoria e a mensagem que você escreve em Ajustes, com a versão do app e o tipo de dispositivo.',
              },
              {
                term: 'Registros técnicos',
                detail:
                  'Como qualquer site, os serviços abaixo registram o endereço IP, o navegador ou dispositivo e o horário de cada requisição. Eles guardam esses registros por pouco tempo, por segurança e para corrigir falhas, e eles não são usados para traçar seu perfil.',
              },
            ],
          },
          'Não coletamos sua localização (o país é você quem escolhe), seus contatos, suas fotos nem nada de outros apps.',
        ],
      },
      {
        id: 'why',
        heading: 'Por que, e com qual base legal',
        blocks: [
          {
            terms: [
              {
                term: 'Para oferecer o app (art. 6.º, n.º 1, al. b do RGPD, contrato)',
                detail:
                  'Sua conta, seu perfil e seu treino são o app: eles são guardados para você registrar treinos, ver histórico e progresso, receber planos e sugestões e usar a mesma conta em vários dispositivos. Os recursos de amigos só funcionam quando você adiciona um amigo, e só mostram o que suas chaves de compartilhamento permitem.',
              },
              {
                term: 'Medidas corporais e outros dados de saúde (art. 9.º, n.º 2, al. a do RGPD, consentimento explícito)',
                detail:
                  'Peso, altura e gordura corporal podem ser dados de saúde. São opcionais: você dá seu consentimento ao inseri-los e pode retirá-lo a qualquer momento excluindo-os ou excluindo sua conta. Retirar não afeta o que foi feito antes.',
              },
              {
                term: 'Feedback e segurança (art. 6.º, n.º 1, al. f do RGPD, interesses legítimos)',
                detail:
                  'Ler o que você decide nos enviar para melhorar o app, e manter registros técnicos curtos para o serviço continuar seguro e funcionando.',
              },
              {
                term: 'Obrigações legais (art. 6.º, n.º 1, al. c do RGPD)',
                detail: 'Responder a pedidos sobre seus direitos e registrar que respondemos.',
              },
            ],
          },
          'Nenhuma decisão com efeitos jurídicos ou semelhantes é tomada sobre você de forma automática. Planos e sugestões de treino são só sugestões.',
        ],
      },
      {
        id: 'no-tracking',
        heading: 'Sem anúncios, sem rastreamento',
        blocks: [
          'O g7m não mostra publicidade e não contém código de análise, publicidade ou rastreamento, nem relatórios de falhas para terceiros. Não vendemos seus dados, não os compartilhamos para marketing e não os usamos para traçar seu perfil.',
          'O app não usa cookies. Ele guarda sua sessão e seus ajustes (tema, idioma, timer de descanso e afins) no armazenamento do seu navegador ou celular, porque não funciona sem eles.',
        ],
      },
      {
        id: 'where',
        heading: 'Onde ficam seus dados e quem os trata',
        blocks: [
          'Seus dados ficam no seu dispositivo e nestes serviços, que os tratam em nosso nome, com acordos de tratamento de dados e apenas para fazer o g7m funcionar:',
          {
            terms: [
              {
                term: 'Supabase',
                detail:
                  'O banco de dados e o login. Servidores em Frankfurt, Alemanha. O Supabase também envia os e-mails de confirmação de conta e de redefinição de senha.',
              },
              {
                term: 'PowerSync',
                detail:
                  'Mantém a cópia do seu dispositivo em sincronia com o banco de dados, o que permite usar o app offline. Servidores na Irlanda. Guarda uma cópia dos seus dados sincronizados para entregá-los aos seus dispositivos.',
              },
              {
                term: 'GitHub Pages',
                detail:
                  'Hospeda os arquivos do app web. O GitHub (EUA) recebe seu endereço IP quando você carrega o app. Nenhum dado da conta passa por ele.',
              },
              {
                term: 'Google',
                detail:
                  'Só se você escolher “Continuar com o Google”: o Google confirma quem você é e nos informa seu e-mail. Sua conta Google segue a política de privacidade do próprio Google.',
              },
              {
                term: 'Apple',
                detail:
                  'O login com a Apple chega em breve. Se você usar, a Apple nos informa seu e-mail, ou um endereço de retransmissão privado se você escolher ocultá-lo, e, se você permitir, seu nome. Sua conta Apple segue a política de privacidade da própria Apple.',
              },
            ],
          },
          'Se você instalar o g7m pelo Google Play ou pela App Store, a loja cuida do download segundo a política dela; o app não recebe nada dela.',
          'Algumas dessas empresas têm sede fora do Espaço Econômico Europeu. Quando seus dados puderem ser acessados de fora dele, a transferência é protegida pelas cláusulas contratuais-padrão da Comissão Europeia ou pelo Quadro de Privacidade de Dados UE-EUA.',
          'Seus amigos veem seu nome, nível e conquistas e, enquanto o compartilhamento de treino estiver ligado, seus treinos, melhores marcas e rotinas. Ninguém mais vê seus dados.',
        ],
      },
      {
        id: 'retention',
        heading: 'Por quanto tempo guardamos',
        blocks: [
          {
            list: [
              'Sua conta e tudo nela: até você excluir a conta. Contas não são excluídas por inatividade.',
              'Quando você exclui sua conta, ela é removida do banco de dados na hora, tudo de uma vez, e do PowerSync junto. Seus outros dispositivos apagam a cópia deles na próxima sincronização ou na próxima vez que alguém entrar neles.',
              `Os backups do Supabase expiram no próprio cronograma, em até ${BACKUP_RETENTION}.`,
              'Feedback: até você excluir sua conta, ou antes, depois de tratado.',
              'Registros técnicos: guardados por cada serviço por pouco tempo, geralmente dias.',
              'No seu dispositivo: até você sair (quando não houver nada esperando para enviar) ou excluir a conta. Limpar os dados do site ou desinstalar o app também os remove.',
            ],
          },
        ],
      },
      {
        id: 'rights',
        heading: 'Seus direitos',
        blocks: [
          'Pelo RGPD você tem o direito de:',
          {
            list: [
              'acessar seus dados e obter uma cópia: Ajustes → Seus dados baixa tudo em um arquivo;',
              'levá-los para outro serviço (portabilidade): esse arquivo é JSON;',
              'corrigi-los: tudo o que você inseriu pode ser editado no app;',
              'apagá-los: Ajustes → Excluir sua conta, ou por e-mail (veja a página de exclusão da conta);',
              'limitar ou se opor ao tratamento, e retirar a qualquer momento um consentimento dado.',
            ],
          },
          `Para exercê-los, use o app ou escreva para ${CONTACT_EMAIL} a partir do e-mail da sua conta. Respondemos em até um mês.`,
          'Se você achar que seus dados foram tratados de forma errada, pode reclamar a uma autoridade de proteção de dados. Na Croácia, é a Agência de Proteção de Dados Pessoais (Agencija za zaštitu osobnih podataka, AZOP), Selska cesta 136, 10000 Zagreb, azop.hr. Você também pode procurar a autoridade de onde vive ou trabalha.',
        ],
      },
      {
        id: 'security',
        heading: 'Segurança',
        blocks: [
          'Tudo trafega por conexões criptografadas (HTTPS). O banco de dados só deixa cada conta ler e gravar as próprias linhas, e o treino de um amigo só é lido depois de verificar que a amizade existe e que o compartilhamento está ligado. Senhas nunca são guardadas, só os hashes delas.',
        ],
      },
      {
        id: 'children',
        heading: 'Crianças',
        blocks: [
          'O g7m não é para crianças com menos de 13 anos, e o app não aceita uma data de nascimento que deixe você mais novo. Se você tem menos de 16, use só com a permissão dos pais ou responsáveis.',
        ],
      },
      {
        id: 'changes',
        heading: 'Mudanças nesta política',
        blocks: [
          'Quando esta política mudar, a data no topo muda junto. Se uma mudança afetar o que é coletado ou por quê, o app avisa você antes de ela valer.',
        ],
      },
    ],
  },

  deletion: {
    title: 'Excluir sua conta do g7m',
    intro:
      'Você pode excluir sua conta do g7m e todos os dados dela a qualquer momento, de uma destas duas formas. Não é preciso instalar o app para pedir.',
    inApp: {
      heading: 'No app: na hora',
      steps: (labels) => [
        'Entre no g7m, no app web ou no celular.',
        `Abra ${labels.settings} e, em ${labels.account}, toque em “${labels.open}”.`,
        `Digite ${labels.word} e confirme. É preciso ter conexão com a internet.`,
      ],
      action: 'Abrir Ajustes → Excluir conta',
    },
    byEmail: {
      heading: 'Por e-mail',
      body: `Escreva para ${CONTACT_EMAIL} a partir do e-mail com que você se cadastrou e peça a exclusão da sua conta. Se você escrever de outro endereço, vamos pedir primeiro que confirme pelo endereço da conta, para que ninguém além de você possa excluí-la. Excluímos em até um mês, geralmente em poucos dias, e respondemos quando estiver feito.`,
      action: `Escrever para ${CONTACT_EMAIL}`,
      subject: 'Excluir minha conta do g7m',
    },
    sections: [
      {
        id: 'deleted',
        heading: 'O que é excluído',
        blocks: [
          'Tudo, de uma vez: ou tudo é excluído ou, se algo falhar, nada:',
          {
            list: [
              'seu login: e-mail, senha, o vínculo com o Google ou a Apple e todas as sessões, então você sai de todos os lugares;',
              'seu perfil e seus ajustes;',
              'todos os treinos, exercícios e séries, seus recordes pessoais, rotinas, academias, objetivos e nível;',
              'suas pesagens e outras medidas corporais;',
              'o feedback que você enviou pelo app;',
              'seu código de amigo, amizades, pedidos e desafios, que somem também dos apps dos seus amigos.',
            ],
          },
          'O app também limpa o dispositivo em que você excluiu a conta. Seus outros dispositivos saem da conta e apagam a cópia deles na próxima sincronização ou na próxima vez que alguém entrar neles. Para apagar na hora, desinstale o app nesse dispositivo ou limpe os dados do site.',
        ],
      },
      {
        id: 'kept',
        heading: 'O que fica',
        blocks: [
          {
            list: [
              `Nada no banco de dados ativo. Os backups do Supabase expiram em até ${BACKUP_RETENTION}, e nenhuma conta é restaurada a partir deles.`,
              'Os registros técnicos curtos dos serviços (endereços IP e horários) expiram sozinhos, geralmente em poucos dias.',
              'Se você pediu por e-mail, guardamos esse e-mail pelo tempo necessário para mostrar que o pedido foi atendido.',
              'Os arquivos que você baixou com “Seus dados” continuam onde você os salvou.',
            ],
          },
        ],
      },
      {
        id: 'before',
        heading: 'Antes de excluir',
        blocks: [
          'A exclusão não pode ser desfeita. Se quiser uma cópia do seu treino, use antes Ajustes → Seus dados → Baixar.',
        ],
      },
    ],
  },
};
