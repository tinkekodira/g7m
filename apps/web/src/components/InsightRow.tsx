import type { ComponentType } from 'react';
import { cx } from '@g7m/ui';
import type { Insight, InsightSymbol } from '../screens/home-copy.js';
import {
  ArrowUpIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  PlayIcon,
  TargetIcon,
  TrophyIcon,
  type IconProps,
} from './icons.js';

const SYMBOLS: Record<InsightSymbol, ComponentType<IconProps>> = {
  up: ArrowUpIcon,
  trophy: TrophyIcon,
  check: CheckIcon,
  target: TargetIcon,
  play: PlayIcon,
  clock: ClockIcon,
};

/**
 * What the numbers mean, sunk into the card's floor: under each of Home's
 * month cards, and under Progress's Active time chart on a month (ADR-0125).
 *
 * Tone is carried by the mark on the left — the accent when it is going well,
 * plain when it is a nudge or just how things stand. Never red: being behind
 * on the 13th is not an error, and a red line on the first screen would read
 * as one.
 *
 * `chevron` when the row sits inside a link and the whole card goes somewhere;
 * left off where it is only words, so it does not promise a tap.
 */
export function InsightRow({
  insight,
  chevron = false,
  className,
}: {
  readonly insight: Insight;
  readonly chevron?: boolean;
  readonly className?: string;
}) {
  const Symbol = SYMBOLS[insight.symbol];
  return (
    <div className={cx('flex items-center gap-3 rounded-card bg-base/70 px-3 py-2.5', className)}>
      <span
        aria-hidden
        className={cx(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          insight.tone === 'good' ? 'bg-accent/15 text-accent' : 'bg-elevated text-secondary',
        )}
      >
        <Symbol className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-5 font-semibold text-primary">
          {insight.heading}
        </span>
        <span className="block text-xs leading-4 text-secondary">{insight.detail}</span>
      </span>
      {chevron && <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted" />}
    </div>
  );
}
