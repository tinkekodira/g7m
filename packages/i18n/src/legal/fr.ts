/** Politique de confidentialité et suppression du compte, en français. Traduit de `en.ts`. ADR-0189. */
import { BACKUP_RETENTION, CONTACT_EMAIL, CONTROLLER_ADDRESS, CONTROLLER_NAME } from './details.js';
import type { LegalText } from './types.js';

export const legal: LegalText = {
  chrome: {
    back: 'Retour',
    openApp: 'Ouvrir g7m',
    updated: (date) => `Dernière mise à jour : ${date}`,
    contents: 'Sommaire',
    inShort: 'En bref',
    contact: 'Questions sur tes données',
    translationNote:
      'Ceci est une traduction. En cas de différence avec la version anglaise, la version anglaise prévaut.',
  },

  privacy: {
    title: 'Politique de confidentialité',
    summary: [
      'g7m conserve ce que tu enregistres pour te le montrer sur chaque appareil où tu te connectes. Il ne sert à rien d’autre.',
      'Pas de publicité, pas d’analyse d’audience, pas de pistage, et rien n’est vendu ni partagé à des fins marketing.',
      'Tes données sont stockées dans l’UE, chez Supabase (Francfort) et PowerSync (Irlande).',
      'Depuis les Réglages, tu peux tout télécharger dans un fichier et supprimer ton compte avec toutes ses données, à tout moment.',
    ],
    sections: [
      {
        id: 'who',
        heading: 'Qui est responsable',
        blocks: [
          `g7m est développé par ${CONTROLLER_NAME}, ${CONTROLLER_ADDRESS}, Croatie, responsable du traitement de tes données personnelles au sens du Règlement général sur la protection des données (RGPD). Écris à ${CONTACT_EMAIL} pour toute question sur cette politique.`,
          'Cette politique couvre l’application web g7m et les applications g7m pour Android et iOS, qui sont la même application.',
        ],
      },
      {
        id: 'collected',
        heading: 'Ce que nous collectons',
        blocks: [
          'Uniquement ce que tu saisis, plus ce qu’il faut pour te connecter et synchroniser tes appareils :',
          {
            terms: [
              {
                term: 'Ton compte',
                detail:
                  'Ton adresse e-mail et, si tu en utilises un, ton mot de passe, stocké uniquement sous forme de hachage irréversible. Si tu continues avec Google, Google nous transmet ton adresse e-mail et l’identifiant de ton compte Google, et parfois ton nom et ta photo de profil, que l’application n’utilise pas. Nous conservons aussi la date de création du compte et celle de ta dernière connexion.',
              },
              {
                term: 'Ton profil',
                detail:
                  'Le nom que tu choisis et, si tu les indiques, ta date de naissance, ton sexe, ton pays, ton poids et ton niveau d’expérience. Ainsi que tes réglages : unités, langue, temps de repos, début de semaine, exercices favoris, salles et succès déjà vus.',
              },
              {
                term: 'Ton entraînement',
                detail:
                  'Les séances avec leurs horaires, notes et salle ; leurs exercices et séries (charge, répétitions, effort et, pour le cardio, durée, distance, vitesse, inclinaison, résistance, puissance, étages et calories) ; records personnels, routines, objectifs et ton niveau.',
              },
              {
                term: 'Mensurations',
                detail:
                  'Pesées, taille, pourcentage de masse grasse, niveau d’activité et notes, seulement si tu les saisis.',
              },
              {
                term: 'Amis, si tu les utilises',
                detail:
                  'Ton code ami, les demandes que tu envoies et acceptes, les défis entre amis et leurs résultats, tes deux interrupteurs de partage, la dernière ouverture de l’application et si tu es en train de t’entraîner (sous forme d’identifiant opaque qui expire après cinq minutes, jamais ce que tu fais).',
              },
              {
                term: 'Les avis que tu envoies',
                detail:
                  'La catégorie et le message que tu écris dans les Réglages, avec la version de l’application et le type d’appareil.',
              },
              {
                term: 'Journaux techniques',
                detail:
                  'Comme tout site web, les services ci-dessous enregistrent l’adresse IP, le navigateur ou l’appareil et l’heure de chaque requête. Ils conservent ces journaux peu de temps, pour la sécurité et la correction d’erreurs, et ils ne servent pas à établir ton profil.',
              },
            ],
          },
          'Nous ne collectons pas ta position (ton pays, c’est toi qui le choisis), tes contacts, tes photos ni quoi que ce soit venant d’autres applications.',
        ],
      },
      {
        id: 'why',
        heading: 'Pourquoi, et sur quelle base légale',
        blocks: [
          {
            terms: [
              {
                term: 'Fournir l’application (art. 6, par. 1, b) du RGPD, contrat)',
                detail:
                  'Ton compte, ton profil et ton entraînement sont l’application : ils sont conservés pour que tu puisses enregistrer tes séances, voir ton historique et tes progrès, recevoir des programmes et des suggestions et utiliser le même compte sur plusieurs appareils. Les fonctions amis ne s’activent que si tu ajoutes un ami, et ne montrent que ce que tes interrupteurs de partage autorisent.',
              },
              {
                term: 'Mensurations et autres données de santé (art. 9, par. 2, a) du RGPD, consentement explicite)',
                detail:
                  'Le poids, la taille et la masse grasse peuvent être des données de santé. Elles sont facultatives : tu donnes ton consentement en les saisissant, et tu peux le retirer à tout moment en les supprimant ou en supprimant ton compte. Le retrait n’affecte pas ce qui a été fait avant.',
              },
              {
                term: 'Avis et sécurité (art. 6, par. 1, f) du RGPD, intérêts légitimes)',
                detail:
                  'Lire ce que tu choisis de nous envoyer pour améliorer l’application, et conserver de courts journaux techniques pour que le service reste sûr et fonctionnel.',
              },
              {
                term: 'Obligations légales (art. 6, par. 1, c) du RGPD)',
                detail:
                  'Répondre aux demandes liées à tes droits et garder une trace de ces réponses.',
              },
            ],
          },
          'Aucune décision produisant des effets juridiques ou similaires n’est prise automatiquement à ton sujet. Les programmes et suggestions ne sont que des suggestions.',
        ],
      },
      {
        id: 'no-tracking',
        heading: 'Pas de publicité, pas de pistage',
        blocks: [
          'g7m n’affiche aucune publicité et ne contient aucun code d’analyse, de publicité ou de pistage, ni de rapports de plantage envoyés à des tiers. Nous ne vendons pas tes données, ne les partageons pas à des fins marketing et ne les utilisons pas pour te profiler.',
          'L’application n’utilise pas de cookies. Elle garde ta session et tes réglages (thème, langue, minuteur de repos, etc.) dans le stockage de ton navigateur ou de ton téléphone, car elle ne peut pas fonctionner sans eux.',
        ],
      },
      {
        id: 'where',
        heading: 'Où sont tes données, et qui les traite',
        blocks: [
          'Tes données sont conservées sur ton appareil et chez ces services, qui les traitent pour notre compte, dans le cadre de contrats de sous-traitance et uniquement pour faire fonctionner g7m :',
          {
            terms: [
              {
                term: 'Supabase',
                detail:
                  'La base de données et la connexion. Serveurs à Francfort, en Allemagne. Supabase envoie aussi les e-mails de confirmation de compte et de réinitialisation du mot de passe.',
              },
              {
                term: 'PowerSync',
                detail:
                  'Synchronise la copie sur ton appareil avec la base de données, ce qui permet d’utiliser l’application hors ligne. Serveurs en Irlande. Il garde une copie de tes données synchronisées pour les livrer à tes appareils.',
              },
              {
                term: 'GitHub Pages',
                detail:
                  'Héberge les fichiers de l’application web. GitHub (États-Unis) reçoit ton adresse IP quand tu charges l’application. Aucune donnée de compte n’y transite.',
              },
              {
                term: 'Google',
                detail:
                  'Seulement si tu choisis « Continuer avec Google » : Google confirme ton identité et nous transmet ton adresse e-mail. Ton compte Google relève de la politique de confidentialité de Google.',
              },
              {
                term: 'Apple',
                detail:
                  'La connexion avec Apple arrive bientôt. Si tu l’utilises, Apple nous transmet ton adresse e-mail (ou une adresse relais privée si tu choisis de masquer la tienne) et, si tu l’autorises, ton nom. Ton compte Apple relève de la politique de confidentialité d’Apple.',
              },
            ],
          },
          'Si tu installes g7m depuis Google Play ou l’App Store, la boutique gère le téléchargement selon sa propre politique ; l’application n’en reçoit rien.',
          'Certaines de ces entreprises sont établies hors de l’Espace économique européen. Lorsque tes données peuvent être accessibles depuis l’extérieur, le transfert est encadré par les clauses contractuelles types de la Commission européenne ou par le cadre de protection des données UE–États-Unis.',
          'Tes amis voient ton nom, ton niveau et tes succès et, tant que le partage de l’entraînement est activé, tes séances, tes meilleures performances et tes routines. Personne d’autre ne voit tes données.',
        ],
      },
      {
        id: 'retention',
        heading: 'Combien de temps nous les gardons',
        blocks: [
          {
            list: [
              'Ton compte et tout son contenu : jusqu’à ce que tu le supprimes. Les comptes ne sont pas supprimés pour inactivité.',
              'Quand tu supprimes ton compte, il est retiré de la base de données immédiatement, en une seule fois, et de PowerSync avec elle. Tes autres appareils effacent leur copie à leur prochaine synchronisation ou à la prochaine connexion de quelqu’un sur eux.',
              `Les sauvegardes de Supabase expirent selon leur propre calendrier, dans un délai de ${BACKUP_RETENTION}.`,
              'Avis : jusqu’à la suppression de ton compte, ou plus tôt une fois traités.',
              'Journaux techniques : conservés peu de temps par chaque service, généralement quelques jours.',
              'Sur ton appareil : jusqu’à ce que tu te déconnectes (s’il ne reste rien à envoyer) ou supprimes le compte. Effacer les données du site ou désinstaller l’application les supprime aussi.',
            ],
          },
        ],
      },
      {
        id: 'rights',
        heading: 'Tes droits',
        blocks: [
          'Le RGPD te donne le droit :',
          {
            list: [
              'd’accéder à tes données et d’en obtenir une copie : Réglages → Tes données télécharge tout dans un fichier ;',
              'de les emporter vers un autre service (portabilité) : ce fichier est au format JSON ;',
              'de les rectifier : tout ce que tu as saisi se modifie dans l’application ;',
              'de les effacer : Réglages → Supprimer ton compte, ou par e-mail (voir la page de suppression du compte) ;',
              'd’en limiter le traitement ou de t’y opposer, et de retirer à tout moment un consentement donné.',
            ],
          },
          `Pour les exercer, utilise l’application ou écris à ${CONTACT_EMAIL} depuis l’adresse e-mail de ton compte. Nous répondons sous un mois.`,
          'Si tu penses que tes données ont été mal traitées, tu peux porter plainte auprès d’une autorité de protection des données. En Croatie, il s’agit de l’Agence de protection des données personnelles (Agencija za zaštitu osobnih podataka, AZOP), Selska cesta 136, 10000 Zagreb, azop.hr. Tu peux aussi t’adresser à l’autorité du pays où tu vis ou travailles (en France, la CNIL).',
        ],
      },
      {
        id: 'security',
        heading: 'Sécurité',
        blocks: [
          'Tout passe par des connexions chiffrées (HTTPS). La base de données ne laisse chaque compte lire et écrire que ses propres lignes, et l’entraînement d’un ami n’est lu qu’après vérification que l’amitié existe et que le partage est activé. Les mots de passe ne sont jamais stockés, seulement leur hachage.',
        ],
      },
      {
        id: 'children',
        heading: 'Enfants',
        blocks: [
          'g7m n’est pas destiné aux enfants de moins de 13 ans, et l’application n’accepte pas de date de naissance qui te rendrait plus jeune. Si tu as moins de 16 ans, utilise-la seulement avec l’accord d’un parent ou tuteur.',
        ],
      },
      {
        id: 'changes',
        heading: 'Modifications de cette politique',
        blocks: [
          'Quand cette politique change, la date en haut change aussi. Si une modification touche ce qui est collecté ou pourquoi, l’application te prévient avant qu’elle s’applique.',
        ],
      },
    ],
  },

  deletion: {
    title: 'Supprimer ton compte g7m',
    intro:
      'Tu peux supprimer ton compte g7m et toutes ses données à tout moment, de l’une de ces deux façons. Pas besoin d’installer l’application pour le demander.',
    inApp: {
      heading: 'Dans l’application : immédiat',
      steps: (labels) => [
        'Connecte-toi à g7m, sur l’application web ou sur ton téléphone.',
        `Ouvre ${labels.settings} et, dans ${labels.account}, touche « ${labels.open} ».`,
        `Tape ${labels.word} et confirme. Il te faut une connexion internet.`,
      ],
      action: 'Ouvrir Réglages → Supprimer le compte',
    },
    byEmail: {
      heading: 'Par e-mail',
      body: `Écris à ${CONTACT_EMAIL} depuis l’adresse e-mail de ton inscription et demande la suppression de ton compte. Si tu écris depuis une autre adresse, nous te demanderons d’abord de confirmer depuis celle du compte, pour que personne d’autre que toi ne puisse le supprimer. Nous le supprimons dans un délai d’un mois au plus, généralement en quelques jours, et te répondons une fois que c’est fait.`,
      action: `Écrire à ${CONTACT_EMAIL}`,
      subject: 'Supprimer mon compte g7m',
    },
    sections: [
      {
        id: 'deleted',
        heading: 'Ce qui est supprimé',
        blocks: [
          'Tout, en une seule fois : soit tout est supprimé, soit, en cas d’échec, rien :',
          {
            list: [
              'ta connexion : ton adresse e-mail, ton mot de passe, le lien avec Google ou Apple et toutes les sessions, tu es donc déconnecté partout ;',
              'ton profil et tes réglages ;',
              'toutes les séances, exercices et séries, tes records personnels, routines, salles, objectifs et ton niveau ;',
              'tes pesées et autres mensurations ;',
              'les avis envoyés depuis l’application ;',
              'ton code ami, tes amitiés, demandes et défis, qui disparaissent aussi des applications de tes amis.',
            ],
          },
          'L’application vide aussi l’appareil depuis lequel tu supprimes. Tes autres appareils sont déconnectés et effacent leur copie à leur prochaine synchronisation ou à la prochaine connexion de quelqu’un sur eux. Pour l’effacer tout de suite, désinstalle l’application ou efface les données du site sur cet appareil.',
        ],
      },
      {
        id: 'kept',
        heading: 'Ce qui est conservé',
        blocks: [
          {
            list: [
              `Rien dans la base de données active. Les sauvegardes de Supabase expirent dans un délai de ${BACKUP_RETENTION}, et aucun compte n’est restauré à partir d’elles.`,
              'Les courts journaux techniques des services (adresses IP et horaires) expirent d’eux-mêmes, généralement en quelques jours.',
              'Si tu as fait la demande par e-mail, nous gardons cet e-mail le temps nécessaire pour prouver que la demande a été traitée.',
              'Les fichiers téléchargés avec « Tes données » restent là où tu les as enregistrés.',
            ],
          },
        ],
      },
      {
        id: 'before',
        heading: 'Avant de supprimer',
        blocks: [
          'La suppression est définitive. Si tu veux une copie de ton entraînement, utilise d’abord Réglages → Tes données → Télécharger.',
        ],
      },
    ],
  },
};
