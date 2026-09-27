/**
 * Which sculpted body this lifter is drawn on, once the profile has said.
 *
 * Null until the profile has been read the first time, so a screen waits
 * rather than drawing the male and swapping him out (ADR-0096).
 */
import { useState } from 'react';
import { bodyFor, type BodyKind } from '../anatomy-model.js';
import { useCatalogue } from './use-catalogue.js';

export function useProfileBody(): BodyKind | null {
  const profile = useCatalogue('profile-body', (r) => r.profile.current());

  /**
   * Latched, because `loading` does not only mean "first read".
   *
   * `useCatalogue` reports loading again on every re-read that has no data to
   * show, and a device with no profile row yet has none. Without the latch
   * each sync would hand the viewer a null body, and it would unmount, show
   * the placeholder and remount with the figure turned back to the front.
   */
  const [read, setRead] = useState(false);
  if (!profile.loading && !read) setRead(true);

  return read ? bodyFor(profile.data?.sex ?? null) : null;
}
