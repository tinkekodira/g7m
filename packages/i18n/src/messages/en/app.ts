/** The shell: the gate, the tab bar, loading states, crashes, updates and server errors. */
export const app = {
  accountReady: {
    title: 'Getting your account ready',
    notArrived:
      'Your profile has not arrived on this device yet. Check your connection and try again.',
  },
  update: {
    ready: 'A new version of g7m is ready.',
  },
  tabs: {
    main: 'Main',
    learn: 'Learn',
    friends: 'Friends',
    home: 'Home',
    profile: 'Profile',
    settings: 'Settings',
    needsAttention: '(needs attention)',
  },
  loadingStates: {
    account: 'Loading your account…',
    train: 'Train',
    workout: 'Loading workout…',
    yourProfile: 'Your profile',
    exercises: 'Exercises',
    profile: 'Loading your profile…',
    exerciseList: 'Loading exercises…',
    bodyView: 'Loading body view…',
    leaderboard: 'Loading leaderboard…',
    requests: 'Loading requests…',
    friends: 'Loading friends…',
    numbers: 'Loading your numbers…',
    thisMonth: 'Loading this month…',
  },
  crash: {
    updatedTitle: 'g7m has been updated',
    updatedDetail:
      'A new version arrived while this screen was open, and part of it is no longer where ' +
      'the old one expects. Reload to finish updating. Nothing you logged is lost.',
    bugTitle: 'Something went wrong on this screen',
    bugDetailInWorkout:
      'Your workout is safe. Every set is saved on this device the moment you tick it, so ' +
      'you can reopen the workout from Home and carry on where you were.',
    bugDetail:
      'Everything you have logged is saved on this device, so nothing is lost. Try again, or ' +
      'go back to Home.',
    goToHome: 'Go to Home',
    reloadApp: 'Reload the app',
    reportDetails: 'Details for a bug report',
    reportSafe: 'Nothing here identifies you, so it is safe to paste into a message.',
    copied: 'Copied',
    copyDetails: 'Copy details',
    copyFailed:
      'This browser would not copy it. Press and hold the text above to select it instead.',
  },
  serverErrors: {
    clockSkew:
      'This device’s clock is ahead of the server, so the sign-in token looks ' +
      'like it came from the future. Turn on Settings → General → Date & Time ' +
      '→ Set Automatically, then reopen the app.',
    sessionExpired: 'Your session expired. Sign out and back in.',
    offline:
      'Cannot reach the server. Your workouts are saved on this device and will sync when you are back online.',
    noAccess: 'You do not have access to that. If you just signed in, try reopening the app.',
    gone: 'That record no longer exists.',
  },
};
