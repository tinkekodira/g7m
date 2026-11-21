import type { Messages } from '../en/index.js';

export const app: Messages['app'] = {
  accountReady: {
    title: 'Stiamo preparando il tuo account',
    notArrived:
      'Il tuo profilo non è ancora arrivato su questo dispositivo. Controlla la connessione e riprova.',
  },
  update: {
    ready: 'È pronta una nuova versione di g7m.',
  },
  tabs: {
    main: 'Principale',
    learn: 'Impara',
    friends: 'Amici',
    home: 'Home',
    profile: 'Profilo',
    settings: 'Impostazioni',
    needsAttention: '(richiede attenzione)',
  },
  loadingStates: {
    account: 'Caricamento del tuo account…',
    train: 'Allenati',
    workout: 'Caricamento allenamento…',
    yourProfile: 'Il tuo profilo',
    exercises: 'Esercizi',
    profile: 'Caricamento del tuo profilo…',
    exerciseList: 'Caricamento esercizi…',
    bodyView: 'Caricamento della vista del corpo…',
    leaderboard: 'Caricamento classifica…',
    requests: 'Caricamento richieste…',
    friends: 'Caricamento amici…',
    numbers: 'Caricamento dei tuoi numeri…',
    thisMonth: 'Caricamento di questo mese…',
  },
  crash: {
    updatedTitle: 'g7m è stato aggiornato',
    updatedDetail:
      'È arrivata una nuova versione mentre questa schermata era aperta, e una parte non è più dove la vecchia se l’aspetta. Ricarica per completare l’aggiornamento. Niente di ciò che hai registrato è andato perso.',
    bugTitle: 'Qualcosa è andato storto in questa schermata',
    bugDetailInWorkout:
      'Il tuo allenamento è al sicuro. Ogni serie viene salvata su questo dispositivo appena la spunti, quindi puoi riaprire l’allenamento dalla Home e riprendere da dove eri.',
    bugDetail:
      'Tutto ciò che hai registrato è salvato su questo dispositivo, quindi non si perde nulla. Riprova o torna alla Home.',
    goToHome: 'Vai alla Home',
    reloadApp: 'Ricarica l’app',
    reportDetails: 'Dettagli per una segnalazione di bug',
    reportSafe: 'Niente qui ti identifica, quindi puoi incollarlo in un messaggio senza problemi.',
    copied: 'Copiato',
    copyDetails: 'Copia i dettagli',
    copyFailed:
      'Questo browser non lo lascia copiare. Tieni premuto il testo qui sopra per selezionarlo.',
  },
  serverErrors: {
    clockSkew:
      'L’orologio di questo dispositivo è avanti rispetto al server, quindi il token di accesso sembra arrivare dal futuro. Attiva Impostazioni → Generali → Data e ora → Imposta automaticamente, poi riapri l’app.',
    sessionExpired: 'La sessione è scaduta. Esci e accedi di nuovo.',
    offline:
      'Impossibile raggiungere il server. I tuoi allenamenti sono salvati su questo dispositivo e si sincronizzeranno quando tornerai online.',
    noAccess:
      'Non hai accesso a questo contenuto. Se hai appena effettuato l’accesso, prova a riaprire l’app.',
    gone: 'Questo elemento non esiste più.',
  },
};
