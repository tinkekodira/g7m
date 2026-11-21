import type { Messages } from '../en/index.js';

export const auth: Messages['auth'] = {
  tagline: 'Seu histórico de treinos é sincronizado em todos os dispositivos em que você entrar.',
  language: 'Idioma',
  resetIntro:
    'Digite o e-mail que você usou no cadastro e enviaremos um link para criar uma nova senha.',
  modes: 'Entre ou crie uma conta',
  signIn: 'Entrar',
  createAccount: 'Criar conta',
  email: 'E-mail',
  password: 'Senha',
  passwordHint: 'Pelo menos 8 caracteres.',
  createAnAccount: 'Criar uma conta',
  resetMyPassword: 'Redefinir minha senha',
  working: 'Um momento…',
  sendResetLink: 'Enviar link',
  backToSignIn: 'Voltar para entrar',
  or: 'ou',
  google: 'Continuar com o Google',
  forgot: 'Esqueceu a senha?',
  newPassword: {
    title: 'Escolha uma nova senha',
    accountOpen: 'Sua conta está aberta.',
    signedInAs: (email: string) => `Conectado como ${email}.`,
    explain:
      'Este link abriu sua conta. Defina uma senha agora: ela será a que você vai usar daqui em diante.',
    label: 'Nova senha',
    minimum: (length: number) => `Pelo menos ${String(length)} caracteres.`,
    again: 'Digite de novo',
    mismatch: 'As senhas não coincidem.',
    set: 'Definir senha',
    keep: 'Pular e manter minha senha atual',
  },
  notices: {
    confirm: 'Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre.',
    googleFailed: 'Não foi possível abrir a página de login.',
    unsent: (count: number) =>
      `${String(count)} alterações ainda não tinham chegado ao servidor, então nada foi apagado deste dispositivo. Entre de novo com conexão para salvá-las.`,
    resetSent: 'Se esse e-mail tiver uma conta, o link já está a caminho. Ele expira em uma hora.',
  },
  errors: {
    credentials:
      'Esse e-mail e essa senha não coincidem. Confira os dois, ou crie uma conta se ainda não tiver.',
    registered: 'Esse e-mail já tem uma conta. Entre em vez disso.',
    short: 'A senha precisa ter pelo menos 8 caracteres.',
    rateLimit: 'Tentativas demais. Espere um minuto e tente de novo.',
    network: 'Não foi possível acessar o servidor. Verifique sua conexão.',
    samePassword: 'Essa já é a sua senha. Escolha outra.',
    otherBrowser: 'Abra o link no mesmo navegador em que você pediu a redefinição e tente de novo.',
  },
};
