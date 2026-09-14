import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import type { Achievement } from '@g7m/core';
import { cx } from '@g7m/ui';
import { useAchievements } from '../lib/db/use-achievements.js';
import { useWrite } from '../lib/db/use-catalogue.js';
import { buzz } from '../lib/haptics.js';
import { celebrationsFor, quietSummary } from '../screens/achievements-view.js';
import { AchievementMedal } from './AchievementMedal.js';

/** A banner for one badge, or one quiet line for several from the past. */
type Celebration = { readonly id: number } & (
  | { readonly kind: 'loud'; readonly achievement: Achievement }
  | { readonly kind: 'quiet'; readonly achievements: readonly Achievement[] }
);

/** How long a banner stays before lifting away, not counting its entrance. */
const LOUD_MS = 4200;
const QUIET_MS = 5500;

/**
 * Watches for newly earned achievements and announces them. ADR-0072.
 *
 * Mounted once, beside the routes, so it is there on every screen — the
 * workout included, where most badges are earned. Each achievement is marked
 * as celebrated on the profile the moment it is queued, before it is shown:
 * a banner lost to the app closing is a smaller mistake than one that plays
 * again on every launch, or once on every device.
 */
export function AchievementCelebrations() {
  const state = useAchievements();
  const { write } = useWrite();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<readonly Celebration[]>([]);

  /** What was already earned the first time the app looked. */
  const earnedWhenOpened = useRef<ReadonlySet<string> | null>(null);
  /** Queued this session, so a re-read before the write lands cannot queue it twice. */
  const handled = useRef(new Set<string>());
  const nextId = useRef(0);

  const data = state.data;
  useEffect(() => {
    if (!data?.ready) return;
    const { loud, quiet } = celebrationsFor({
      list: data.list,
      seen: new Set([...data.seen, ...handled.current]),
      earnedWhenOpened: earnedWhenOpened.current,
      now: new Date(),
    });
    earnedWhenOpened.current ??= new Set(
      data.list.filter((each) => each.earnedAt !== null).map((each) => each.key),
    );

    const keys = [...loud, ...quiet].map((each) => each.key);
    if (keys.length === 0) return;
    for (const key of keys) handled.current.add(key);
    void write((r) => r.profile.markAchievementsSeen(keys));
    const id = () => (nextId.current += 1);
    setQueue((current) => [
      ...current,
      ...loud.map((achievement): Celebration => ({ id: id(), kind: 'loud', achievement })),
      ...(quiet.length === 0
        ? []
        : [{ id: id(), kind: 'quiet', achievements: quiet } satisfies Celebration]),
    ]);
  }, [data, write]);

  const [current] = queue;
  const done = useCallback(() => {
    setQueue((rest) => rest.slice(1));
  }, []);

  if (current === undefined) return null;
  return (
    <AchievementBanner
      // A new key per banner, so each one plays its own entrance.
      key={current.id}
      celebration={current}
      onOpen={(badge) => {
        void navigate(badge === null ? '/achievements' : `/achievements?badge=${badge}`);
      }}
      onDone={done}
    />
  );
}

/**
 * The banner itself: in from the top, a wiggle and a burst of confetti for a
 * badge just earned, then up and away. A tap opens the badge; a flick upwards
 * sends it away early.
 *
 * `role="status"`, so a screen reader announces it without taking focus from
 * the set being logged.
 */
function AchievementBanner({
  celebration,
  onOpen,
  onDone,
}: {
  readonly celebration: Celebration;
  readonly onOpen: (badge: string | null) => void;
  readonly onDone: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const startY = useRef<number | null>(null);
  // A flick ends in a click too; this stops it opening the badge on the way out.
  const flicked = useRef(false);
  const loud = celebration.kind === 'loud';

  useEffect(() => {
    if (loud) buzz('success');
    const timer = setTimeout(
      () => {
        setLeaving(true);
      },
      loud ? LOUD_MS : QUIET_MS,
    );
    return () => {
      clearTimeout(timer);
    };
  }, [loud]);

  const summary = loud ? null : quietSummary(celebration.achievements, new Date());
  const shown = loud ? [celebration.achievement] : celebration.achievements.slice(0, 3);
  const secret = loud && celebration.achievement.secret;
  const title = loud ? celebration.achievement.name : (summary?.title ?? '');
  const detail = loud ? celebration.achievement.description : (summary?.detail ?? '');
  const eyebrow = secret
    ? 'Secret achievement unlocked'
    : loud
      ? 'Achievement unlocked'
      : 'From your past training';

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)]"
    >
      <div
        className={cx('pointer-events-auto w-full max-w-md', leaving ? 'banner-out' : 'banner-in')}
        onAnimationEnd={(event) => {
          if (leaving && event.target === event.currentTarget) onDone();
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (flicked.current) {
              flicked.current = false;
              return;
            }
            onOpen(loud ? celebration.achievement.key : null);
            setLeaving(true);
          }}
          onPointerDown={(event) => {
            startY.current = event.clientY;
          }}
          onPointerUp={(event) => {
            if (startY.current !== null && event.clientY - startY.current < -24) {
              flicked.current = true;
              setLeaving(true);
            }
            startY.current = null;
          }}
          className={cx(
            'relative flex w-full items-center gap-3 rounded-card border bg-elevated px-3.5 py-3 text-left shadow-floating',
            loud ? 'wiggle border-accent/60' : 'border-subtle',
          )}
        >
          <span className="relative shrink-0">
            {loud && <Confetti />}
            {shown.length === 1 && shown[0] !== undefined ? (
              <AchievementMedal
                achievement={shown[0]}
                size="lg"
                className={cx('relative', loud && 'medal-pop')}
              />
            ) : (
              <span className="flex -space-x-3">
                {shown.map((each) => (
                  <AchievementMedal
                    key={each.key}
                    achievement={each}
                    size="md"
                    className="ring-2 ring-elevated"
                  />
                ))}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={cx(
                'block text-[11px] font-semibold tracking-wider uppercase',
                secret ? 'text-badge-secret' : loud ? 'text-accent' : 'text-muted',
              )}
            >
              {eyebrow}
            </span>
            <span className="block truncate text-lg leading-tight font-extrabold text-primary">
              {title}
            </span>
            <span className="block text-xs text-secondary">{detail}</span>
          </span>
        </button>
      </div>
    </div>
  );
}

/** Confetti colours: the palette's own, so it looks like the app in either theme. */
const CONFETTI_COLOURS = [
  'var(--accent)',
  'var(--warning)',
  'var(--success)',
  'var(--badge-cardio)',
  'var(--badge-secret)',
  'var(--muscle-selected)',
];

const PIECES = 22;

/**
 * A burst from behind the medal. Positions come from the piece's index rather
 * than `Math.random`, so the burst is the same every time and a re-render
 * cannot scatter it mid-flight.
 */
function Confetti() {
  return (
    <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 z-0">
      {Array.from({ length: PIECES }, (_, index) => {
        const angle = (index / PIECES) * Math.PI * 2 + (index % 3) * 0.35;
        const distance = 46 + ((index * 37) % 5) * 12;
        const style = {
          '--dx': `${String(Math.round(Math.cos(angle) * distance))}px`,
          '--dy': `${String(Math.round(Math.sin(angle) * distance * 0.8))}px`,
          '--turn': `${String((index * 97) % 360)}deg`,
          background: CONFETTI_COLOURS[index % CONFETTI_COLOURS.length],
          width: index % 2 === 0 ? '6px' : '8px',
          height: index % 2 === 0 ? '6px' : '4px',
          animationDelay: `${String(380 + (index % 4) * 30)}ms`,
        } as CSSProperties;
        return (
          <span
            key={index}
            className={cx('confetti absolute top-0 left-0', index % 3 === 0 && 'rounded-full')}
            style={style}
          />
        );
      })}
    </span>
  );
}
