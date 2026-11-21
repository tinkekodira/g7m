/** Signing in, signing up, and resetting a password. */
export const auth = {
  tagline: 'Your training history syncs across every device you sign in on.',
  language: 'Language',
  resetIntro: 'Enter the email you signed up with and we will send a link to set a new password.',
  modes: 'Sign in or create an account',
  signIn: 'Sign in',
  createAccount: 'Create account',
  email: 'Email',
  password: 'Password',
  passwordHint: 'At least 8 characters.',
  createAnAccount: 'Create an account',
  resetMyPassword: 'Reset my password',
  working: 'Working…',
  sendResetLink: 'Send reset link',
  backToSignIn: 'Back to sign in',
  or: 'or',
  google: 'Continue with Google',
  forgot: 'Forgot your password?',
  newPassword: {
    title: 'Choose a new password',
    accountOpen: 'Your account is open.',
    signedInAs: (email: string) => `Signed in as ${email}.`,
    explain:
      'This link opened your account — set a password now and it is the one you will use from here on.',
    label: 'New password',
    minimum: (length: number) => `At least ${String(length)} characters.`,
    again: 'Type it again',
    mismatch: 'These do not match.',
    set: 'Set password',
    keep: 'Skip — keep my current password',
  },
  notices: {
    confirm: 'Account created. Check your email for a confirmation link, then sign in.',
    googleFailed: 'Could not open the sign-in page.',
    unsent: (count: number) =>
      `${String(count)} changes had not reached the server, so nothing on this device was cleared. Sign back in with a connection to save them.`,
    resetSent: 'If that email has an account, a reset link is on its way. It expires in an hour.',
  },
  errors: {
    credentials:
      'That email and password do not match. Check both — or create an account if you have not made one yet.',
    registered: 'That email already has an account. Sign in instead.',
    short: 'Passwords need at least 8 characters.',
    rateLimit: 'Too many attempts. Wait a minute and try again.',
    network: 'Cannot reach the server. Check your connection.',
    samePassword: 'That is the password you already have. Choose a different one.',
    otherBrowser:
      'Open that link in the same browser you asked for the reset from, then try again.',
  },
};
