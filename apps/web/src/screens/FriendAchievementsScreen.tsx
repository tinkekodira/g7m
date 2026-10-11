import { useMemo } from 'react';
import { useParams } from 'react-router';
import { publishedAchievements } from '@g7m/core';
import { heatSince } from '../lib/db/use-trained-body.js';
import { fetchFriendProfile } from '../lib/friends/api.js';
import { useMySide, useRemote } from '../lib/friends/use-friends-data.js';
import { useOnline } from '../lib/use-online.js';
import { AchievementsPage } from './AchievementsScreen.js';
import { friendName } from './friends-view.js';

/**
 * A friend's achievements, the whole collection, opened from their page.
 * ADR-0117.
 *
 * What their own phone published: the badges earned and when. The rest show
 * locked, with no bar under them — how close a friend is to a badge would
 * take their training log, which stays on their phone.
 */
export function FriendAchievementsScreen() {
  const { friendId = '' } = useParams();
  const online = useOnline();
  const mine = useMySide();
  const profile = useRemote(`friend-profile:${friendId}`, online, () =>
    fetchFriendProfile(friendId, heatSince(new Date())),
  );
  const name = friendName(profile.data?.name ?? null);
  const unitSystem = mine.data?.unitSystem ?? 'metric';
  const published = profile.data?.achievements ?? null;
  const list = useMemo(
    () => (published === null ? null : publishedAchievements(published, unitSystem)),
    [published, unitSystem],
  );

  return (
    <AchievementsPage
      title={`${name}’s achievements`}
      subtitle={`Milestones from ${name}’s training.`}
      back={{ to: `/friends/${friendId}`, label: name }}
      list={list}
      loading={online && profile.loading}
      error={profile.error}
      unitSystem={unitSystem}
      spotlight={null}
      notice={
        !online
          ? 'Friends need a connection. This will fill in when you’re back online.'
          : profile.data === null
            ? 'Not sharing their training right now, or no longer on your friends list.'
            : `${name}’s achievements show up here once they next open the app.`
      }
      footer={`As ${name}’s phone worked them out, the last time they opened the app.`}
    />
  );
}
