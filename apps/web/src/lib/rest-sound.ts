/**
 * A sound when rest is over.
 *
 * The buzz (`haptics.ts`) reaches a phone in a pocket. A phone on the bench
 * beside somebody wearing a hoodie, or one in a gym bag, needs to be heard.
 * Settings can turn it off, unlike the buzz, because a sound is something the
 * rest of the gym hears too.
 *
 * ## Made, not loaded
 *
 * Three short notes from an oscillator through Web Audio, so there is no
 * audio file to download, cache or keep in step with anything. It sounds the
 * same offline as on.
 *
 * ## Unlocked by a tap
 *
 * Browsers, iOS above all, let a page make sound only after a touch has asked
 * for it, and the moment rest ends nobody is touching anything. So the tap
 * that starts the rest, ticking a set, also unlocks the audio
 * (`primeRestSound`), and the sound at the end plays through the context that
 * tap opened.
 *
 * ## While the screen is on
 *
 * The workout keeps the screen awake (`use-wake-lock.ts`), and that is when
 * this plays. A locked phone suspends the page and its timers with it; a sound
 * through a locked screen would need a native notification scheduled ahead,
 * which this is not.
 */

/** One note: when it starts after the first, its pitch and how long it rings. */
export interface ChimeNote {
  readonly at: number;
  readonly frequency: number;
  readonly duration: number;
}

/**
 * Two short notes and a longer, higher one. Bright enough to cut through gym
 * music, short enough not to be mistaken for a phone call.
 */
export const REST_CHIME: readonly ChimeNote[] = [
  { at: 0, frequency: 880, duration: 0.14 },
  { at: 0.22, frequency: 880, duration: 0.14 },
  { at: 0.44, frequency: 1318.5, duration: 0.32 },
];

/** How loud the notes peak, out of 1. Clear without being a shock. */
const PEAK_GAIN = 0.5;

/** The parts of an `AudioContext` this uses, so the test can hand it a fake. */
export interface ChimeContext {
  readonly currentTime: number;
  readonly state: string;
  readonly destination: AudioNode;
  resume(): Promise<void>;
  createOscillator(): OscillatorNode;
  createGain(): GainNode;
}

type ContextClass = new () => ChimeContext;

let shared: ChimeContext | null = null;

function contextClass(): ContextClass | undefined {
  // Older Safari only has the prefixed one.
  const scope = globalThis as { AudioContext?: ContextClass; webkitAudioContext?: ContextClass };
  return scope.AudioContext ?? scope.webkitAudioContext;
}

/** The one context, made on first use. Null where there is no Web Audio. */
function context(): ChimeContext | null {
  if (shared !== null) return shared;
  const Context = contextClass();
  if (Context === undefined) return null;
  shared = new Context();
  return shared;
}

/**
 * Ask iOS for a short sound that ducks music rather than stopping it.
 *
 * Left alone, Safari treats Web Audio as "ambient": the silent switch mutes
 * it, so the one phone most likely to be on silent in a gym would never hear
 * rest end. "transient" is the session for exactly this, a short sound over
 * whatever is playing. Only Safari 16.4+ has `audioSession`; elsewhere this
 * does nothing.
 */
function askForTransientSound(): void {
  const session = (navigator as { audioSession?: { type: string } }).audioSession;
  if (session === undefined) return;
  try {
    session.type = 'transient';
  } catch {
    // An unknown type throws in some builds. The sound plays anyway, if quieter.
  }
}

/**
 * Unlock the audio from inside a tap. Safe to call on every tap: after the
 * first it only wakes a context the system has put to sleep.
 */
export function primeRestSound(): void {
  try {
    const audio = context();
    if (audio !== null && audio.state !== 'running') void audio.resume().catch(() => undefined);
  } catch {
    // No sound is a fine answer. A failed unlock must not cost a logged set.
  }
}

/** The chime, on the context given. Returns whether anything was scheduled. */
export function playChime(audio: ChimeContext): boolean {
  if (audio.state !== 'running') void audio.resume().catch(() => undefined);
  const start = audio.currentTime + 0.02;
  for (const note of REST_CHIME) {
    const begin = start + note.at;
    const end = begin + note.duration;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(note.frequency, begin);
    // A quick rise and an exponential fall, so each note rings like a bell
    // rather than clicking on and off.
    gain.gain.setValueAtTime(0.0001, begin);
    gain.gain.exponentialRampToValueAtTime(PEAK_GAIN, begin + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(begin);
    oscillator.stop(end + 0.02);
  }
  return true;
}

/** Rest is over, out loud, if this device can. Safe to call anywhere. */
export function playRestSound(): boolean {
  try {
    const audio = context();
    if (audio === null) return false;
    askForTransientSound();
    return playChime(audio);
  } catch {
    return false;
  }
}
