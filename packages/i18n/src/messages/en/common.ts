/** Words used all over the app. */
export const common = {
  tryAgain: 'Try again',
  signOut: 'Sign out',
  reload: 'Reload',
  loading: 'Loading…',
  save: 'Save',
  saving: 'Saving…',
  cancel: 'Cancel',
  close: 'Close',
  back: 'Back',
  continue: 'Continue',
  done: 'Done',
  delete: 'Delete',
  remove: 'Remove',
  edit: 'Edit',
  undo: 'Undo',
  skip: 'Skip',
  next: 'Next',
  goHome: 'Go home',
  home: 'Home',
  /**
   * Day and month names, indexed the way `Date` counts: Sunday is 0, January
   * is 0. Listed rather than asked of `Intl`, which writes "Sept" in British
   * English and would put the phone's language, not the app's, mid-sentence.
   */
  dates: {
    weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    monthsShort: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    /** "3 Mar": a day of the month and a short month name. */
    dayMonth: (day: number, month: string) => `${String(day)} ${month}`,
  },
};
