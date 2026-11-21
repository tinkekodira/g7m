import { t } from '@g7m/i18n';
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
      title={t().history.achievements.friendTitle(name)}
      subtitle={t().history.achievements.friendSubtitle(name)}
      back={{ to: `/friends/${friendId}`, label: name }}
      list={list}
      loading={online && profile.loading}
      error={profile.error}
      unitSystem={unitSystem}
      spotlight={null}
      notice={
        !online
          ? t().history.achievements.friendOffline
          : profile.data === null
            ? t().history.achievements.friendNotSharing
            : t().history.achievements.friendLater(name)
      }
      footer={t().history.achievements.friendFooter(name)}
    />
  );
}
