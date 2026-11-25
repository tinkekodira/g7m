/**
 * The privacy policy and the account-deletion page, in English — the original
 * the translations are made from.
 *
 * Written from what the code does, not from a template: the tables in
 * `supabase/migrations`, the sync rules in `powersync/sync-rules.yaml`, the
 * sign-in in `apps/web/src/auth`, the export in `lib/data-export.ts` and the
 * deletion in `20260913180000_delete_account.sql`. When one of those changes
 * what is collected or kept, this changes with it. ADR-0189.
 */
import { CONTACT_EMAIL, CONTROLLER_NAME } from './details.js';
import type { LegalText } from './types.js';

export const legal: LegalText = {
  chrome: {
    back: 'Back',
    openApp: 'Open g7m',
    updated: (date) => `Last updated ${date}`,
    contents: 'Contents',
    inShort: 'In short',
    contact: 'Questions about your data',
    translationNote: null,
  },

  privacy: {
    title: 'Privacy policy',
    summary: [
      'g7m keeps what you log so it can show it back to you on every device you sign in on. That is the only thing it is used for.',
      'There are no ads, no analytics and no tracking, and nothing is sold or shared for marketing.',
      'Your data is stored in the EU, with Supabase (Frankfurt) and PowerSync (Ireland).',
      'You can download everything as one file, and delete your account and all of it, from Settings at any time.',
    ],
    sections: [
      {
        id: 'who',
        heading: 'Who is responsible',
        blocks: [
          `g7m is made by ${CONTROLLER_NAME}, in Croatia, who is the controller of your personal data under the EU General Data Protection Regulation (GDPR). Write to ${CONTACT_EMAIL} about anything in this policy.`,
          'This policy covers the g7m web app and the g7m apps for Android and iOS, which are the same app.',
        ],
      },
      {
        id: 'collected',
        heading: 'What we collect',
        blocks: [
          'Only what you enter, plus what is needed to sign you in and keep your devices in step:',
          {
            terms: [
              {
                term: 'Your account',
                detail:
                  'Your email address and, if you use one, your password — stored only as a one-way hash. If you continue with Google, Google tells us your email address and your Google account ID, and may also send your name and profile picture, which the app does not use. We also keep when the account was created and when you last signed in.',
              },
              {
                term: 'Your profile',
                detail:
                  'The display name you choose, and, if you give them, your birth date, sex, country, bodyweight and experience level. Also your app settings: units, language, rest times, week start, favourite exercises, gyms and which achievements you have seen.',
              },
              {
                term: 'Your training',
                detail:
                  'Workouts and their times, notes and gym; the exercises and sets in them (weight, reps, effort, and for cardio time, distance, speed, incline, resistance, power, floors and calories); personal records, routines, training goals and your level.',
              },
              {
                term: 'Body measurements',
                detail:
                  'Weigh-ins, height, body-fat percentage, activity level and notes — only if you enter them.',
              },
              {
                term: 'Friends, if you use them',
                detail:
                  'Your friend code, the friend requests you send and accept, challenges with friends and their results, your two sharing switches, when the app was last open, and whether you are working out right now (as an opaque ID that expires after five minutes, never what you are doing).',
              },
              {
                term: 'Feedback you send',
                detail:
                  'The category and message you write in Settings, with the app version and the kind of device it came from.',
              },
              {
                term: 'Technical logs',
                detail:
                  'Like any website, the services below record the IP address, the browser or device and the time of each request they serve. They keep these logs for a short time, for security and to fix faults, and they are not used to build a profile of you.',
              },
            ],
          },
          'We do not collect your location (your country is something you pick), your contacts, your photos, or anything from other apps.',
        ],
      },
      {
        id: 'why',
        heading: 'Why, and on what legal basis',
        blocks: [
          {
            terms: [
              {
                term: 'To provide the app (GDPR Art. 6(1)(b), contract)',
                detail:
                  'Your account, profile and training are what the app is: they are stored so you can log workouts, see your history and progress, get plans and suggestions, and use the same account on several devices. Friends features run only when you add a friend, and show them only what your sharing switches allow.',
              },
              {
                term: 'Body measurements and other health information (GDPR Art. 9(2)(a), explicit consent)',
                detail:
                  'Weight, height and body fat can be health data. They are optional: you give your consent by entering them, and you can withdraw it at any time by deleting them or your account. Withdrawing does not affect what was done before.',
              },
              {
                term: 'Feedback and security (GDPR Art. 6(1)(f), legitimate interests)',
                detail:
                  'Reading what you choose to send so the app can be fixed and improved, and keeping short technical logs so the service stays secure and working.',
              },
              {
                term: 'Legal obligations (GDPR Art. 6(1)(c))',
                detail: 'Answering requests about your rights, and keeping a record that we did.',
              },
            ],
          },
          'No decision with legal or similarly significant effects is made about you automatically. Training plans and suggestions are only suggestions.',
        ],
      },
      {
        id: 'no-tracking',
        heading: 'No ads, no tracking',
        blocks: [
          'g7m shows no advertising and contains no analytics, advertising or tracking code, and no third-party crash reporting. We do not sell your data, share it for marketing, or use it to profile you.',
          'The app uses no cookies. It keeps your sign-in session and your settings (theme, language, rest timer and the like) in your browser’s or phone’s own storage, because it cannot work without them.',
        ],
      },
      {
        id: 'where',
        heading: 'Where your data is, and who processes it',
        blocks: [
          'Your data is kept on your device and with these services, which process it for us under data processing agreements and only to run g7m:',
          {
            terms: [
              {
                term: 'Supabase',
                detail:
                  'The database and sign-in. Servers in Frankfurt, Germany. Supabase also sends the emails that confirm an account and reset a password.',
              },
              {
                term: 'PowerSync',
                detail:
                  'Keeps the copy on your device and the database in step, which is what lets the app work offline. Servers in Ireland. It holds a copy of your synced data to deliver it to your devices.',
              },
              {
                term: 'GitHub Pages',
                detail:
                  'Hosts the files the web app is made of. GitHub (USA) receives your IP address when you load the app. No account data passes through it.',
              },
              {
                term: 'Google',
                detail:
                  'Only if you choose “Continue with Google”: Google confirms who you are and tells us your email address. Google’s own privacy policy covers your Google account.',
              },
              {
                term: 'Apple',
                detail:
                  'Sign in with Apple is coming. If you use it, Apple tells us your email address — or a private relay address, if you choose to hide yours — and, if you allow it, your name. Apple’s own privacy policy covers your Apple account.',
              },
            ],
          },
          'If you install g7m from Google Play or the App Store, the store handles the download under its own policy; the app receives nothing from it.',
          'Some of these companies are based outside the European Economic Area. Where your data may be reached from outside it, the transfer is protected by the European Commission’s standard contractual clauses or the EU–US Data Privacy Framework.',
          'Your friends see your display name, level and achievements and, while training sharing is on, your workouts, best lifts and routines. Nobody else sees any of your data.',
        ],
      },
      {
        id: 'retention',
        heading: 'How long we keep it',
        blocks: [
          {
            list: [
              'Your account and everything in it: until you delete the account. Accounts are not deleted for being inactive.',
              'When you delete your account, it is removed from the database at once, all of it in one step, and from PowerSync with it. Your other devices remove their copy when they next sync or the next time anyone signs in on them.',
              'The database is not backed up (it runs on Supabase’s free plan, which takes no backups), so a deleted account leaves no copy behind there.',
              'Feedback: until you delete your account, or sooner once it has been dealt with.',
              'Technical logs: kept by each service for a short period, usually days.',
              'On your device: until you sign out (when nothing is still waiting to upload) or delete the account. Clearing the site’s data or uninstalling the app removes it too.',
            ],
          },
        ],
      },
      {
        id: 'rights',
        heading: 'Your rights',
        blocks: [
          'Under the GDPR you have the right to:',
          {
            list: [
              'access your data and get a copy of it — Settings → Your data downloads everything as one file;',
              'take it to another service (portability) — that file is plain JSON;',
              'correct it — everything you entered can be edited in the app;',
              'delete it — Settings → Delete your account, or by email (see the account deletion page);',
              'restrict or object to how it is used, and withdraw any consent you gave, at any time.',
            ],
          },
          `To use any of these, use the app or write to ${CONTACT_EMAIL} from the email address of your account. We answer within one month.`,
          'If you think your data has been handled wrongly, you can complain to a data protection authority. In Croatia that is the Personal Data Protection Agency (Agencija za zaštitu osobnih podataka, AZOP), Selska cesta 136, 10000 Zagreb, azop.hr. You can also complain to the authority where you live or work.',
        ],
      },
      {
        id: 'security',
        heading: 'Security',
        blocks: [
          'Everything travels over encrypted connections (HTTPS). The database lets each account read and write only its own rows, and a friend’s training is read only through checks that the friendship exists and that sharing is on. Passwords are never stored, only their hashes.',
        ],
      },
      {
        id: 'children',
        heading: 'Children',
        blocks: [
          'g7m is not meant for children under 13, and the app does not accept a birth date that makes you younger. If you are under 16, use it only with a parent’s or guardian’s permission.',
        ],
      },
      {
        id: 'changes',
        heading: 'Changes to this policy',
        blocks: [
          'When this policy changes, the date at the top changes with it. If a change affects what is collected or why, the app will tell you before it applies.',
        ],
      },
    ],
  },

  deletion: {
    title: 'Delete your g7m account',
    intro:
      'You can delete your g7m account and all of its data at any time, in either of two ways. You do not need to install the app to ask.',
    inApp: {
      heading: 'In the app — immediate',
      steps: (labels) => [
        'Sign in to g7m, in the web app or on your phone.',
        `Open ${labels.settings}, and under ${labels.account} tap “${labels.open}”.`,
        `Type ${labels.word} and confirm. You need an internet connection.`,
      ],
      action: 'Open Settings → Delete account',
    },
    byEmail: {
      heading: 'By email',
      body: `Write to ${CONTACT_EMAIL} from the email address you signed up with and ask for your account to be deleted. If you write from another address, we will ask you to confirm from the account’s address first, so nobody but you can delete your account. We delete it within one month at the latest — usually within a few days — and reply when it is done.`,
      action: `Email ${CONTACT_EMAIL}`,
      subject: 'Delete my g7m account',
    },
    sections: [
      {
        id: 'deleted',
        heading: 'What is deleted',
        blocks: [
          'Everything, in one step — either all of it is deleted or, if something fails, none of it:',
          {
            list: [
              'your sign-in: your email address, password, the link to Google or Apple, and every session, so you are signed out everywhere;',
              'your profile and settings;',
              'every workout, exercise and set, your personal records, routines, gyms, training goals and level;',
              'your weigh-ins and other body measurements;',
              'feedback you sent from the app;',
              'your friend code, friendships, friend requests and challenges — they disappear from your friends’ apps too.',
            ],
          },
          'The app also clears the device you delete from. Your other devices are signed out, and remove their copy when they next sync or the next time anyone signs in on them. To remove it from one straight away, uninstall the app there or clear the site’s data.',
        ],
      },
      {
        id: 'kept',
        heading: 'What is kept',
        blocks: [
          {
            list: [
              'Nothing in the database, and no backup of it: g7m keeps no database backups, so a deleted account cannot be restored.',
              'The services’ short technical logs (IP addresses and request times) expire on their own, usually within days.',
              'If you asked by email, we keep that email for as long as we need to show the request was handled.',
              'Files you downloaded with “Your data” stay wherever you saved them.',
            ],
          },
        ],
      },
      {
        id: 'before',
        heading: 'Before you delete',
        blocks: [
          'Deleting cannot be undone. If you want a copy of your training, use Settings → Your data → Download first.',
        ],
      },
    ],
  },
};
