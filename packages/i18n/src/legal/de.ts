/** Datenschutzerklärung und Kontolöschung, auf Deutsch. Übersetzt aus `en.ts`. ADR-0189. */
import { BACKUP_RETENTION, CONTACT_EMAIL, CONTROLLER_ADDRESS, CONTROLLER_NAME } from './details.js';
import type { LegalText } from './types.js';

export const legal: LegalText = {
  chrome: {
    back: 'Zurück',
    openApp: 'g7m öffnen',
    updated: (date) => `Zuletzt aktualisiert am ${date}`,
    contents: 'Inhalt',
    inShort: 'Kurz gesagt',
    contact: 'Fragen zu deinen Daten',
    translationNote:
      'Dies ist eine Übersetzung. Weicht sie von der englischen Fassung ab, gilt die englische.',
  },

  privacy: {
    title: 'Datenschutzerklärung',
    summary: [
      'g7m speichert, was du einträgst, damit du es auf jedem Gerät wiederfindest, auf dem du dich anmeldest. Für nichts anderes wird es verwendet.',
      'Es gibt keine Werbung, keine Analyse und kein Tracking, und nichts wird verkauft oder für Werbung weitergegeben.',
      'Deine Daten liegen in der EU, bei Supabase (Frankfurt) und PowerSync (Irland).',
      'In den Einstellungen kannst du jederzeit alles als eine Datei herunterladen und dein Konto samt allen Daten löschen.',
    ],
    sections: [
      {
        id: 'who',
        heading: 'Wer verantwortlich ist',
        blocks: [
          `g7m wird von ${CONTROLLER_NAME}, ${CONTROLLER_ADDRESS}, Kroatien, entwickelt. Diese Person ist Verantwortliche im Sinne der EU-Datenschutz-Grundverordnung (DSGVO). Schreib an ${CONTACT_EMAIL}, wenn du Fragen zu dieser Erklärung hast.`,
          'Diese Erklärung gilt für die g7m-Web-App und die g7m-Apps für Android und iOS, die dieselbe App sind.',
        ],
      },
      {
        id: 'collected',
        heading: 'Welche Daten wir erheben',
        blocks: [
          'Nur was du eingibst, und was nötig ist, um dich anzumelden und deine Geräte abzugleichen:',
          {
            terms: [
              {
                term: 'Dein Konto',
                detail:
                  'Deine E-Mail-Adresse und, falls du eines nutzt, dein Passwort – gespeichert nur als Einweg-Hash. Wenn du „Weiter mit Google“ wählst, teilt Google uns deine E-Mail-Adresse und deine Google-Konto-ID mit und schickt eventuell deinen Namen und dein Profilbild, die die App nicht verwendet. Außerdem speichern wir, wann das Konto erstellt wurde und wann du dich zuletzt angemeldet hast.',
              },
              {
                term: 'Dein Profil',
                detail:
                  'Der Anzeigename, den du wählst, und, falls du sie angibst, Geburtsdatum, Geschlecht, Land, Körpergewicht und Erfahrungsstufe. Dazu deine App-Einstellungen: Einheiten, Sprache, Pausenzeiten, Wochenbeginn, Lieblingsübungen, Studios und welche Erfolge du schon gesehen hast.',
              },
              {
                term: 'Dein Training',
                detail:
                  'Workouts mit Zeiten, Notizen und Studio; die Übungen und Sätze darin (Gewicht, Wiederholungen, Anstrengung und bei Cardio Zeit, Strecke, Tempo, Steigung, Widerstand, Leistung, Stockwerke und Kalorien); persönliche Rekorde, Routinen, Trainingsziele und dein Level.',
              },
              {
                term: 'Körpermaße',
                detail:
                  'Gewicht, Größe, Körperfettanteil, Aktivitätslevel und Notizen – nur wenn du sie einträgst.',
              },
              {
                term: 'Freunde, falls du sie nutzt',
                detail:
                  'Dein Freundescode, die Freundschaftsanfragen, die du sendest und annimmst, Challenges mit Freunden und ihre Ergebnisse, deine zwei Teilen-Schalter, wann die App zuletzt geöffnet war und ob du gerade trainierst (als undurchsichtige ID, die nach fünf Minuten verfällt – nie, was du gerade machst).',
              },
              {
                term: 'Feedback, das du sendest',
                detail:
                  'Kategorie und Nachricht, die du in den Einstellungen schreibst, mit der App-Version und der Art des Geräts.',
              },
              {
                term: 'Technische Protokolle',
                detail:
                  'Wie bei jeder Website zeichnen die unten genannten Dienste IP-Adresse, Browser oder Gerät und Zeitpunkt jeder Anfrage auf. Sie bewahren diese Protokolle kurz auf, zur Sicherheit und zur Fehlerbehebung, und sie werden nicht genutzt, um ein Profil von dir zu erstellen.',
              },
            ],
          },
          'Wir erheben nicht deinen Standort (dein Land wählst du selbst), deine Kontakte, deine Fotos oder etwas aus anderen Apps.',
        ],
      },
      {
        id: 'why',
        heading: 'Wozu und auf welcher Rechtsgrundlage',
        blocks: [
          {
            terms: [
              {
                term: 'Um die App bereitzustellen (Art. 6 Abs. 1 lit. b DSGVO, Vertrag)',
                detail:
                  'Konto, Profil und Training sind die App: Sie werden gespeichert, damit du Workouts eintragen, Verlauf und Fortschritt sehen, Pläne und Vorschläge bekommen und dasselbe Konto auf mehreren Geräten nutzen kannst. Freunde-Funktionen laufen nur, wenn du einen Freund hinzufügst, und zeigen nur, was deine Teilen-Schalter erlauben.',
              },
              {
                term: 'Körpermaße und andere Gesundheitsdaten (Art. 9 Abs. 2 lit. a DSGVO, ausdrückliche Einwilligung)',
                detail:
                  'Gewicht, Größe und Körperfett können Gesundheitsdaten sein. Sie sind freiwillig: Du willigst ein, indem du sie einträgst, und kannst die Einwilligung jederzeit widerrufen, indem du sie oder dein Konto löschst. Der Widerruf berührt nicht, was vorher geschehen ist.',
              },
              {
                term: 'Feedback und Sicherheit (Art. 6 Abs. 1 lit. f DSGVO, berechtigte Interessen)',
                detail:
                  'Lesen, was du uns schickst, damit die App verbessert werden kann, und kurze technische Protokolle, damit der Dienst sicher läuft.',
              },
              {
                term: 'Rechtliche Pflichten (Art. 6 Abs. 1 lit. c DSGVO)',
                detail:
                  'Anfragen zu deinen Rechten beantworten und festhalten, dass wir es getan haben.',
              },
            ],
          },
          'Über dich werden keine automatisierten Entscheidungen mit rechtlicher oder ähnlich erheblicher Wirkung getroffen. Trainingspläne und Vorschläge sind nur Vorschläge.',
        ],
      },
      {
        id: 'no-tracking',
        heading: 'Keine Werbung, kein Tracking',
        blocks: [
          'g7m zeigt keine Werbung und enthält keinen Analyse-, Werbe- oder Tracking-Code und keine Absturzberichte an Dritte. Wir verkaufen deine Daten nicht, geben sie nicht für Werbung weiter und erstellen kein Profil von dir.',
          'Die App verwendet keine Cookies. Deine Anmeldung und deine Einstellungen (Design, Sprache, Pausentimer und Ähnliches) liegen im Speicher deines Browsers oder Telefons, weil die App ohne sie nicht funktioniert.',
        ],
      },
      {
        id: 'where',
        heading: 'Wo deine Daten liegen und wer sie verarbeitet',
        blocks: [
          'Deine Daten liegen auf deinem Gerät und bei diesen Diensten, die sie in unserem Auftrag, auf Grundlage von Auftragsverarbeitungsverträgen und nur für den Betrieb von g7m verarbeiten:',
          {
            terms: [
              {
                term: 'Supabase',
                detail:
                  'Datenbank und Anmeldung. Server in Frankfurt, Deutschland. Supabase verschickt auch die E-Mails zur Kontobestätigung und zum Zurücksetzen des Passworts.',
              },
              {
                term: 'PowerSync',
                detail:
                  'Gleicht die Kopie auf deinem Gerät mit der Datenbank ab – deshalb funktioniert die App offline. Server in Irland. Es hält eine Kopie deiner synchronisierten Daten, um sie an deine Geräte zu liefern.',
              },
              {
                term: 'GitHub Pages',
                detail:
                  'Hostet die Dateien der Web-App. GitHub (USA) erhält deine IP-Adresse, wenn du die App lädst. Kontodaten laufen nicht darüber.',
              },
              {
                term: 'Google',
                detail:
                  'Nur wenn du „Weiter mit Google“ wählst: Google bestätigt, wer du bist, und teilt uns deine E-Mail-Adresse mit. Für dein Google-Konto gilt Googles eigene Datenschutzerklärung.',
              },
              {
                term: 'Apple',
                detail:
                  '„Mit Apple anmelden“ kommt bald. Wenn du es nutzt, teilt Apple uns deine E-Mail-Adresse mit – oder eine private Weiterleitungsadresse, wenn du deine verbirgst – und, wenn du es erlaubst, deinen Namen. Für dein Apple-Konto gilt Apples eigene Datenschutzerklärung.',
              },
            ],
          },
          'Wenn du g7m über Google Play oder den App Store installierst, wickelt der Store den Download nach seinen eigenen Regeln ab; die App erhält davon nichts.',
          'Einige dieser Unternehmen haben ihren Sitz außerhalb des Europäischen Wirtschaftsraums. Wo deine Daten von dort aus erreichbar sein können, ist die Übermittlung durch die Standardvertragsklauseln der Europäischen Kommission oder das EU-US Data Privacy Framework abgesichert.',
          'Deine Freunde sehen deinen Anzeigenamen, dein Level und deine Erfolge und, solange das Teilen des Trainings an ist, deine Workouts, Bestleistungen und Routinen. Sonst sieht niemand deine Daten.',
        ],
      },
      {
        id: 'retention',
        heading: 'Wie lange wir Daten aufbewahren',
        blocks: [
          {
            list: [
              'Dein Konto mit allem darin: bis du es löschst. Konten werden nicht wegen Inaktivität gelöscht.',
              'Wenn du dein Konto löschst, wird es sofort und vollständig in einem Schritt aus der Datenbank entfernt, und mit ihr aus PowerSync. Deine anderen Geräte entfernen ihre Kopie, wenn sie das nächste Mal synchronisieren oder sich dort jemand anmeldet.',
              `Datenbank-Backups bei Supabase laufen nach ihrem eigenen Zeitplan ab, innerhalb von ${BACKUP_RETENTION}.`,
              'Feedback: bis du dein Konto löschst, oder früher, sobald es erledigt ist.',
              'Technische Protokolle: von jedem Dienst kurz aufbewahrt, meist einige Tage.',
              'Auf deinem Gerät: bis du dich abmeldest (wenn nichts mehr auf den Upload wartet) oder das Konto löschst. Auch das Löschen der Websitedaten oder das Deinstallieren der App entfernt sie.',
            ],
          },
        ],
      },
      {
        id: 'rights',
        heading: 'Deine Rechte',
        blocks: [
          'Nach der DSGVO hast du das Recht,',
          {
            list: [
              'auf deine Daten zuzugreifen und eine Kopie zu erhalten – Einstellungen → Deine Daten lädt alles als eine Datei herunter;',
              'sie zu einem anderen Dienst mitzunehmen (Datenübertragbarkeit) – die Datei ist einfaches JSON;',
              'sie zu berichtigen – alles, was du eingegeben hast, lässt sich in der App ändern;',
              'sie löschen zu lassen – Einstellungen → Konto löschen, oder per E-Mail (siehe Seite zur Kontolöschung);',
              'die Verarbeitung einschränken zu lassen oder ihr zu widersprechen und eine erteilte Einwilligung jederzeit zu widerrufen.',
            ],
          },
          `Nutze dafür die App oder schreib an ${CONTACT_EMAIL}, von der E-Mail-Adresse deines Kontos. Wir antworten innerhalb eines Monats.`,
          'Wenn du meinst, dass mit deinen Daten falsch umgegangen wurde, kannst du dich bei einer Datenschutzbehörde beschweren. In Kroatien ist das die Agentur für den Schutz personenbezogener Daten (Agencija za zaštitu osobnih podataka, AZOP), Selska cesta 136, 10000 Zagreb, azop.hr. Du kannst dich auch an die Behörde dort wenden, wo du lebst oder arbeitest.',
        ],
      },
      {
        id: 'security',
        heading: 'Sicherheit',
        blocks: [
          'Alles wird über verschlüsselte Verbindungen (HTTPS) übertragen. Die Datenbank lässt jedes Konto nur seine eigenen Zeilen lesen und schreiben, und das Training eines Freundes wird nur nach Prüfung gelesen, dass die Freundschaft besteht und das Teilen an ist. Passwörter werden nie gespeichert, nur ihre Hashes.',
        ],
      },
      {
        id: 'children',
        heading: 'Kinder',
        blocks: [
          'g7m ist nicht für Kinder unter 13 Jahren gedacht, und die App akzeptiert kein Geburtsdatum, das dich jünger macht. Wenn du unter 16 bist, nutze sie nur mit Erlaubnis deiner Eltern oder Erziehungsberechtigten.',
        ],
      },
      {
        id: 'changes',
        heading: 'Änderungen dieser Erklärung',
        blocks: [
          'Wenn sich diese Erklärung ändert, ändert sich das Datum oben mit. Betrifft eine Änderung, was erhoben wird oder wozu, sagt dir die App vorher Bescheid.',
        ],
      },
    ],
  },

  deletion: {
    title: 'Dein g7m-Konto löschen',
    intro:
      'Du kannst dein g7m-Konto mit allen Daten jederzeit löschen, auf einem von zwei Wegen. Dafür musst du die App nicht installieren.',
    inApp: {
      heading: 'In der App – sofort',
      steps: (labels) => [
        'Melde dich bei g7m an, in der Web-App oder auf deinem Telefon.',
        `Öffne ${labels.settings} und tippe unter ${labels.account} auf „${labels.open}“.`,
        `Gib ${labels.word} ein und bestätige. Du brauchst eine Internetverbindung.`,
      ],
      action: 'Einstellungen → Konto löschen öffnen',
    },
    byEmail: {
      heading: 'Per E-Mail',
      body: `Schreib an ${CONTACT_EMAIL}, von der E-Mail-Adresse, mit der du dich registriert hast, und bitte um die Löschung deines Kontos. Schreibst du von einer anderen Adresse, bitten wir dich zuerst um eine Bestätigung von der Adresse des Kontos, damit niemand außer dir dein Konto löschen kann. Wir löschen es spätestens innerhalb eines Monats – meist innerhalb weniger Tage – und antworten, sobald es erledigt ist.`,
      action: `E-Mail an ${CONTACT_EMAIL}`,
      subject: 'Bitte mein g7m-Konto löschen',
    },
    sections: [
      {
        id: 'deleted',
        heading: 'Was gelöscht wird',
        blocks: [
          'Alles, in einem Schritt – entweder alles wird gelöscht oder, falls etwas fehlschlägt, nichts:',
          {
            list: [
              'deine Anmeldung: E-Mail-Adresse, Passwort, die Verknüpfung mit Google oder Apple und jede Sitzung, sodass du überall abgemeldet bist;',
              'dein Profil und deine Einstellungen;',
              'alle Workouts, Übungen und Sätze, deine persönlichen Rekorde, Routinen, Studios, Trainingsziele und dein Level;',
              'deine Gewichtseinträge und anderen Körpermaße;',
              'Feedback, das du aus der App gesendet hast;',
              'dein Freundescode, deine Freundschaften, Anfragen und Challenges – sie verschwinden auch aus den Apps deiner Freunde.',
            ],
          },
          'Die App leert außerdem das Gerät, auf dem du löschst. Deine anderen Geräte werden abgemeldet und entfernen ihre Kopie, wenn sie das nächste Mal synchronisieren oder sich dort jemand anmeldet. Um sie sofort zu entfernen, deinstalliere die App dort oder lösche die Websitedaten.',
        ],
      },
      {
        id: 'kept',
        heading: 'Was bleibt',
        blocks: [
          {
            list: [
              `Nichts in der laufenden Datenbank. Die Backups von Supabase laufen innerhalb von ${BACKUP_RETENTION} ab, und Konten werden daraus nicht wiederhergestellt.`,
              'Die kurzen technischen Protokolle der Dienste (IP-Adressen und Zeitpunkte) laufen von selbst ab, meist innerhalb weniger Tage.',
              'Wenn du per E-Mail gefragt hast, bewahren wir diese E-Mail so lange auf, wie wir belegen müssen, dass die Anfrage erledigt wurde.',
              'Dateien, die du mit „Deine Daten“ heruntergeladen hast, bleiben dort, wo du sie gespeichert hast.',
            ],
          },
        ],
      },
      {
        id: 'before',
        heading: 'Bevor du löschst',
        blocks: [
          'Das Löschen lässt sich nicht rückgängig machen. Wenn du eine Kopie deines Trainings möchtest, nutze vorher Einstellungen → Deine Daten → Herunterladen.',
        ],
      },
    ],
  },
};
