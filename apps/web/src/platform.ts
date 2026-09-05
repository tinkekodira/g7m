/**
 * Which shell are we running inside?
 *
 * Detected from globals the shells inject, rather than from a compile-time
 * flag, because one build output is copied into every wrapper. Phase 0 uses
 * this only to prove the same bundle really is running in all five targets;
 * later phases branch on it for haptics, keep-awake and notifications.
 *
 * No `@capacitor/core` or `@tauri-apps/api` import here on purpose: this file
 * has to work in a plain browser tab where neither package exists.
 */

export type Platform = 'web' | 'ios' | 'android' | 'windows' | 'macos';

export type Shell = 'browser' | 'capacitor' | 'tauri';

export interface PlatformInfo {
  readonly shell: Shell;
  readonly platform: Platform;
  /** Coarse pointer means no hover: Brief §6 changes interaction wholesale. */
  readonly hasFinePointer: boolean;
  readonly prefersReducedMotion: boolean;
}

function readCapacitorPlatform(): string | null {
  const capacitor: unknown = (globalThis as Record<string, unknown>)['Capacitor'];
  if (typeof capacitor !== 'object' || capacitor === null) return null;
  const getPlatform: unknown = (capacitor as Record<string, unknown>)['getPlatform'];
  if (typeof getPlatform !== 'function') return null;
  const value: unknown = (getPlatform as () => unknown).call(capacitor);
  return typeof value === 'string' ? value : null;
}

function isTauri(): boolean {
  const g = globalThis as Record<string, unknown>;
  return g['__TAURI_INTERNALS__'] !== undefined || g['__TAURI__'] !== undefined;
}

function desktopPlatformFromUserAgent(): Platform {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  if (/Mac|Darwin/i.test(ua)) return 'macos';
  if (/Win/i.test(ua)) return 'windows';
  return 'web';
}

export function detectPlatform(): PlatformInfo {
  const canMatchMedia = typeof globalThis.matchMedia === 'function';
  const hasFinePointer = canMatchMedia ? globalThis.matchMedia('(pointer: fine)').matches : true;
  const prefersReducedMotion = canMatchMedia
    ? globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const capacitorPlatform = readCapacitorPlatform();
  if (capacitorPlatform === 'ios' || capacitorPlatform === 'android') {
    return {
      shell: 'capacitor',
      platform: capacitorPlatform,
      hasFinePointer,
      prefersReducedMotion,
    };
  }

  if (isTauri()) {
    return {
      shell: 'tauri',
      platform: desktopPlatformFromUserAgent(),
      hasFinePointer,
      prefersReducedMotion,
    };
  }

  return { shell: 'browser', platform: 'web', hasFinePointer, prefersReducedMotion };
}

const PLATFORM_LABELS: Record<Platform, string> = {
  web: 'Web browser',
  ios: 'iOS',
  android: 'Android',
  windows: 'Windows',
  macos: 'macOS',
};

export function platformLabel(platform: Platform): string {
  return PLATFORM_LABELS[platform];
}
