/** Informativa sulla privacy ed eliminazione dell'account, in italiano. Tradotto da `en.ts`. ADR-0189. */
import { CONTACT_EMAIL, CONTROLLER_NAME } from './details.js';
import type { LegalText } from './types.js';

export const legal: LegalText = {
  chrome: {
    back: 'Indietro',
    openApp: 'Apri g7m',
    updated: (date) => `Ultimo aggiornamento: ${date}`,
    contents: 'Indice',
    inShort: 'In breve',
    contact: 'Domande sui tuoi dati',
    translationNote:
      'Questa è una traduzione. Se differisce dalla versione inglese, prevale la versione inglese.',
  },

  privacy: {
    title: 'Informativa sulla privacy',
    summary: [
      'g7m conserva ciò che registri per mostrartelo su ogni dispositivo su cui accedi. Non viene usato per nient’altro.',
      'Niente pubblicità, niente statistiche, niente tracciamento, e nulla viene venduto o condiviso a fini di marketing.',
      'I tuoi dati sono conservati nell’UE, presso Supabase (Francoforte) e PowerSync (Irlanda).',
      'Dalle Impostazioni puoi scaricare tutto in un unico file ed eliminare l’account con tutti i dati, in qualsiasi momento.',
    ],
    sections: [
      {
        id: 'who',
        heading: 'Chi è responsabile',
        blocks: [
          `g7m è sviluppata da ${CONTROLLER_NAME}, in Croazia, titolare del trattamento dei tuoi dati personali ai sensi del Regolamento generale sulla protezione dei dati (GDPR). Scrivi a ${CONTACT_EMAIL} per qualsiasi domanda su questa informativa.`,
          'Questa informativa riguarda la web app g7m e le app g7m per Android e iOS, che sono la stessa app.',
        ],
      },
      {
        id: 'collected',
        heading: 'Quali dati raccogliamo',
        blocks: [
          'Solo ciò che inserisci, più quanto serve per farti accedere e tenere sincronizzati i tuoi dispositivi:',
          {
            terms: [
              {
                term: 'Il tuo account',
                detail:
                  'Il tuo indirizzo email e, se ne usi una, la password, conservata solo come hash irreversibile. Se continui con Google, Google ci comunica il tuo indirizzo email e l’ID del tuo account Google, e può inviare anche nome e foto del profilo, che l’app non usa. Conserviamo inoltre la data di creazione dell’account e quella dell’ultimo accesso.',
              },
              {
                term: 'Il tuo profilo',
                detail:
                  'Il nome che scegli e, se li indichi, data di nascita, sesso, paese, peso corporeo e livello di esperienza. Anche le impostazioni dell’app: unità, lingua, tempi di recupero, inizio settimana, esercizi preferiti, palestre e quali obiettivi hai già visto.',
              },
              {
                term: 'Il tuo allenamento',
                detail:
                  'Gli allenamenti con orari, note e palestra; gli esercizi e le serie al loro interno (peso, ripetizioni, sforzo e, per il cardio, durata, distanza, velocità, pendenza, resistenza, potenza, piani e calorie); record personali, routine, obiettivi di allenamento e il tuo livello.',
              },
              {
                term: 'Misure corporee',
                detail:
                  'Pesate, altezza, percentuale di grasso corporeo, livello di attività e note, solo se le inserisci.',
              },
              {
                term: 'Amici, se li usi',
                detail:
                  'Il tuo codice amico, le richieste che invii e accetti, le sfide con gli amici e i loro risultati, i tuoi due interruttori di condivisione, quando l’app è stata aperta l’ultima volta e se ti stai allenando in questo momento (come ID opaco che scade dopo cinque minuti, mai cosa stai facendo).',
              },
              {
                term: 'Feedback che invii',
                detail:
                  'La categoria e il messaggio che scrivi nelle Impostazioni, con la versione dell’app e il tipo di dispositivo.',
              },
              {
                term: 'Log tecnici',
                detail:
                  'Come ogni sito web, i servizi indicati sotto registrano l’indirizzo IP, il browser o il dispositivo e l’ora di ogni richiesta. Conservano questi log per poco tempo, per sicurezza e per correggere errori, e non vengono usati per profilarti.',
              },
            ],
          },
          'Non raccogliamo la tua posizione (il paese lo scegli tu), i tuoi contatti, le tue foto né nulla da altre app.',
        ],
      },
      {
        id: 'why',
        heading: 'Perché, e su quale base giuridica',
        blocks: [
          {
            terms: [
              {
                term: 'Per fornire l’app (art. 6, par. 1, lett. b GDPR, contratto)',
                detail:
                  'Account, profilo e allenamenti sono l’app: vengono conservati perché tu possa registrare gli allenamenti, vedere storico e progressi, ricevere piani e suggerimenti e usare lo stesso account su più dispositivi. Le funzioni amici si attivano solo quando aggiungi un amico, e mostrano solo ciò che i tuoi interruttori di condivisione consentono.',
              },
              {
                term: 'Misure corporee e altri dati sulla salute (art. 9, par. 2, lett. a GDPR, consenso esplicito)',
                detail:
                  'Peso, altezza e grasso corporeo possono essere dati sulla salute. Sono facoltativi: dai il consenso inserendoli e puoi revocarlo in qualsiasi momento eliminandoli o eliminando l’account. La revoca non incide su quanto fatto prima.',
              },
              {
                term: 'Feedback e sicurezza (art. 6, par. 1, lett. f GDPR, legittimo interesse)',
                detail:
                  'Leggere ciò che scegli di inviarci per migliorare l’app, e conservare brevi log tecnici perché il servizio resti sicuro e funzionante.',
              },
              {
                term: 'Obblighi di legge (art. 6, par. 1, lett. c GDPR)',
                detail: 'Rispondere alle richieste sui tuoi diritti e tenerne traccia.',
              },
            ],
          },
          'Non vengono prese decisioni automatizzate su di te con effetti giuridici o analoghi. Piani e suggerimenti di allenamento sono solo suggerimenti.',
        ],
      },
      {
        id: 'no-tracking',
        heading: 'Niente pubblicità, niente tracciamento',
        blocks: [
          'g7m non mostra pubblicità e non contiene codice di statistiche, pubblicità o tracciamento, né segnalazioni di crash a terzi. Non vendiamo i tuoi dati, non li condividiamo per marketing e non li usiamo per profilarti.',
          'L’app non usa cookie. Conserva la sessione e le impostazioni (tema, lingua, timer di recupero e simili) nella memoria del tuo browser o telefono, perché senza non può funzionare.',
        ],
      },
      {
        id: 'where',
        heading: 'Dove sono i tuoi dati e chi li tratta',
        blocks: [
          'I tuoi dati sono conservati sul tuo dispositivo e presso questi servizi, che li trattano per nostro conto, in base ad accordi sul trattamento dei dati e solo per far funzionare g7m:',
          {
            terms: [
              {
                term: 'Supabase',
                detail:
                  'Il database e l’accesso. Server a Francoforte, Germania. Supabase invia anche le email di conferma dell’account e di reimpostazione della password.',
              },
              {
                term: 'PowerSync',
                detail:
                  'Tiene allineata la copia sul tuo dispositivo con il database, ed è ciò che permette di usare l’app offline. Server in Irlanda. Conserva una copia dei dati sincronizzati per consegnarli ai tuoi dispositivi.',
              },
              {
                term: 'GitHub Pages',
                detail:
                  'Ospita i file della web app. GitHub (USA) riceve il tuo indirizzo IP quando carichi l’app. Nessun dato dell’account passa da lì.',
              },
              {
                term: 'Google',
                detail:
                  'Solo se scegli «Continua con Google»: Google conferma chi sei e ci comunica il tuo indirizzo email. Il tuo account Google è regolato dall’informativa sulla privacy di Google.',
              },
              {
                term: 'Apple',
                detail:
                  'L’accesso con Apple arriverà presto. Se lo usi, Apple ci comunica il tuo indirizzo email, o un indirizzo di inoltro privato se scegli di nasconderlo, e, se lo consenti, il tuo nome. Il tuo account Apple è regolato dall’informativa sulla privacy di Apple.',
              },
            ],
          },
          'Se installi g7m da Google Play o dall’App Store, lo store gestisce il download secondo la propria informativa; l’app non riceve nulla.',
          'Alcune di queste aziende hanno sede fuori dallo Spazio economico europeo. Dove i tuoi dati possono essere accessibili dall’esterno, il trasferimento è tutelato dalle clausole contrattuali tipo della Commissione europea o dal Data Privacy Framework UE-USA.',
          'I tuoi amici vedono il tuo nome, il livello e gli obiettivi raggiunti e, finché la condivisione dell’allenamento è attiva, i tuoi allenamenti, i migliori risultati e le routine. Nessun altro vede i tuoi dati.',
        ],
      },
      {
        id: 'retention',
        heading: 'Per quanto tempo li conserviamo',
        blocks: [
          {
            list: [
              'L’account e tutto ciò che contiene: finché non lo elimini. Gli account non vengono eliminati per inattività.',
              'Quando elimini l’account, viene rimosso subito dal database, tutto in un solo passaggio, e da PowerSync insieme a esso. Gli altri tuoi dispositivi cancellano la loro copia alla prossima sincronizzazione o al prossimo accesso di qualcuno su di essi.',
              'Il database non ha backup (usa il piano gratuito di Supabase, che non ne fa), quindi di un account eliminato non resta lì alcuna copia.',
              'Feedback: finché non elimini l’account, o prima, una volta gestito.',
              'Log tecnici: conservati da ciascun servizio per poco tempo, di solito pochi giorni.',
              'Sul tuo dispositivo: finché non esci (se non resta nulla da caricare) o elimini l’account. Anche cancellare i dati del sito o disinstallare l’app li rimuove.',
            ],
          },
        ],
      },
      {
        id: 'rights',
        heading: 'I tuoi diritti',
        blocks: [
          'Secondo il GDPR hai il diritto di:',
          {
            list: [
              'accedere ai tuoi dati e averne una copia: Impostazioni → I tuoi dati scarica tutto in un unico file;',
              'portarli a un altro servizio (portabilità): quel file è in formato JSON;',
              'rettificarli: tutto ciò che hai inserito si può modificare nell’app;',
              'cancellarli: Impostazioni → Elimina il tuo account, oppure via email (vedi la pagina sull’eliminazione dell’account);',
              'limitarne il trattamento od opporti, e revocare in qualsiasi momento il consenso dato.',
            ],
          },
          `Per esercitarli, usa l’app o scrivi a ${CONTACT_EMAIL} dall’indirizzo email del tuo account. Rispondiamo entro un mese.`,
          'Se ritieni che i tuoi dati siano stati trattati in modo scorretto, puoi presentare reclamo a un’autorità per la protezione dei dati. In Croazia è l’Agenzia per la protezione dei dati personali (Agencija za zaštitu osobnih podataka, AZOP), Selska cesta 136, 10000 Zagreb, azop.hr. Puoi anche rivolgerti all’autorità del paese in cui vivi o lavori (in Italia, il Garante per la protezione dei dati personali).',
        ],
      },
      {
        id: 'security',
        heading: 'Sicurezza',
        blocks: [
          'Tutto viaggia su connessioni cifrate (HTTPS). Il database consente a ogni account di leggere e scrivere solo le proprie righe, e l’allenamento di un amico viene letto solo dopo aver verificato che l’amicizia esista e che la condivisione sia attiva. Le password non vengono mai conservate, solo i loro hash.',
        ],
      },
      {
        id: 'children',
        heading: 'Minori',
        blocks: [
          'g7m non è pensata per i minori di 13 anni, e l’app non accetta una data di nascita che ti renda più giovane. Se hai meno di 16 anni, usala solo con il permesso di un genitore o tutore.',
        ],
      },
      {
        id: 'changes',
        heading: 'Modifiche a questa informativa',
        blocks: [
          'Quando questa informativa cambia, cambia anche la data in alto. Se una modifica riguarda quali dati vengono raccolti o perché, l’app te lo dirà prima che entri in vigore.',
        ],
      },
    ],
  },

  deletion: {
    title: 'Elimina il tuo account g7m',
    intro:
      'Puoi eliminare il tuo account g7m con tutti i dati in qualsiasi momento, in uno di questi due modi. Non serve installare l’app per chiederlo.',
    inApp: {
      heading: 'Nell’app: subito',
      steps: (labels) => [
        'Accedi a g7m, dalla web app o dal telefono.',
        `Apri ${labels.settings} e, in ${labels.account}, tocca «${labels.open}».`,
        `Scrivi ${labels.word} e conferma. Serve una connessione a internet.`,
      ],
      action: 'Apri Impostazioni → Elimina account',
    },
    byEmail: {
      heading: 'Via email',
      body: `Scrivi a ${CONTACT_EMAIL} dall’indirizzo email con cui ti sei registrato e chiedi di eliminare il tuo account. Se scrivi da un altro indirizzo, ti chiederemo prima di confermare da quello dell’account, così nessuno tranne te può eliminarlo. Lo eliminiamo entro un mese al massimo, di solito in pochi giorni, e ti rispondiamo quando è fatto.`,
      action: `Scrivi a ${CONTACT_EMAIL}`,
      subject: 'Elimina il mio account g7m',
    },
    sections: [
      {
        id: 'deleted',
        heading: 'Cosa viene eliminato',
        blocks: [
          'Tutto, in un solo passaggio: o viene eliminato tutto o, se qualcosa non va, niente:',
          {
            list: [
              'il tuo accesso: indirizzo email, password, il collegamento con Google o Apple e tutte le sessioni, quindi esci ovunque;',
              'il tuo profilo e le impostazioni;',
              'tutti gli allenamenti, esercizi e serie, i record personali, le routine, le palestre, gli obiettivi e il livello;',
              'le pesate e le altre misure corporee;',
              'il feedback inviato dall’app;',
              'il tuo codice amico, le amicizie, le richieste e le sfide, che spariscono anche dalle app dei tuoi amici.',
            ],
          },
          'L’app svuota anche il dispositivo da cui elimini l’account. Sugli altri dispositivi esci dall’account, e la loro copia viene cancellata alla prossima sincronizzazione o al prossimo accesso di qualcuno. Per cancellarla subito, disinstalla l’app su quel dispositivo o cancella i dati del sito.',
        ],
      },
      {
        id: 'kept',
        heading: 'Cosa resta',
        blocks: [
          {
            list: [
              'Nulla nel database, né in un backup: g7m non conserva backup del database, quindi un account eliminato non può essere ripristinato.',
              'I brevi log tecnici dei servizi (indirizzi IP e orari) scadono da soli, di solito in pochi giorni.',
              'Se l’hai chiesto via email, conserviamo quell’email per il tempo necessario a dimostrare che la richiesta è stata gestita.',
              'I file scaricati con «I tuoi dati» restano dove li hai salvati.',
            ],
          },
        ],
      },
      {
        id: 'before',
        heading: 'Prima di eliminare',
        blocks: [
          'L’eliminazione non si può annullare. Se vuoi una copia dei tuoi allenamenti, usa prima Impostazioni → I tuoi dati → Scarica.',
        ],
      },
    ],
  },
};
