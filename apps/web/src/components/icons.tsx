import { useId, type ReactNode, type SVGProps } from 'react';

/**
 * The app's icons, drawn here rather than imported.
 *
 * There are about twenty of them, each a few path commands, and an icon
 * library for twenty glyphs is a dependency to keep current and a licence to
 * carry for something this file does in two hundred lines. The same reasoning
 * as the hand-drawn charts (Charts.tsx).
 *
 * All of them share one grid — 24 units, a 1.8 stroke, round ends — so they
 * sit together as a set, and all of them are decorative: every one appears
 * beside a word that says the same thing, so they are hidden from screen
 * readers rather than announced twice.
 */

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

function Glyph({ children, ...rest }: IconProps & { readonly children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/**
 * A cog, generated rather than traced.
 *
 * Eight trapezoid teeth on a 9.5-unit rim, which at 24px reads as a gear and
 * at 16px still does. Computed once, when the module loads.
 */
const GEAR = (() => {
  const teeth = 8;
  const outer = 9.6;
  const inner = 7.1;
  const step = (Math.PI * 2) / teeth;
  const at = (angle: number, radius: number): string =>
    `${(12 + radius * Math.cos(angle)).toFixed(2)} ${(12 + radius * Math.sin(angle)).toFixed(2)}`;

  const points: string[] = [];
  for (let tooth = 0; tooth < teeth; tooth++) {
    const middle = tooth * step - Math.PI / 2;
    points.push(
      at(middle - step * 0.3, inner),
      at(middle - step * 0.15, outer),
      at(middle + step * 0.15, outer),
      at(middle + step * 0.3, inner),
    );
  }
  return `M${points.join('L')}Z`;
})();

export function HomeIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9v10.5a1 1 0 0 0 1 1H10V15h4v5.5h3.5a1 1 0 0 0 1-1V9" />
    </Glyph>
  );
}

export function ProgressIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3.5 20.5h17" />
      <rect x="5" y="11" width="3.2" height="6.5" rx="1" />
      <rect x="10.4" y="5.5" width="3.2" height="12" rx="1" />
      <rect x="15.8" y="13.5" width="3.2" height="4" rx="1" />
    </Glyph>
  );
}

/** A line climbing to a point: a running total, as on Home's month card. */
export function TrendIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3.5 18.5 9 13l3.5 3L20 8" />
      <path d="M15 8h5v5" />
    </Glyph>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c0-4.1 3.4-6.5 7.5-6.5s7.5 2.4 7.5 6.5" />
    </Glyph>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d={GEAR} />
      <circle cx="12" cy="12" r="3" />
    </Glyph>
  );
}

export function LearnIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 6.5C10.3 5.2 7.8 4.5 4 4.5v14c3.8 0 6.3.7 8 2 1.7-1.3 4.2-2 8-2v-14c-3.8 0-6.3.7-8 2Z" />
      <path d="M12 6.5v14" />
    </Glyph>
  );
}

export function DumbbellIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M7 12h10" />
      <rect x="4" y="7" width="3" height="10" rx="1" />
      <rect x="17" y="7" width="3" height="10" rx="1" />
      <path d="M2.5 10v4M21.5 10v4" />
    </Glyph>
  );
}

export function ScaleIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M8 10a5 5 0 0 1 8 0" />
      <path d="m12 12.5 1.6-3" />
    </Glyph>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </Glyph>
  );
}

/** A standing figure, arms out — the anatomy model, distinct from the profile bust. */
export function BodyIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M5 9c2.3.6 4.6.9 7 .9s4.7-.3 7-.9" />
      <path d="M12 9.9v4.6" />
      <path d="m12 14.5-2.8 6.5M12 14.5l2.8 6.5" />
    </Glyph>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M8 4h8v5.5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5.5a3 3 0 0 0 3 4.2M16 6h2.5a3 3 0 0 1-3 4.2" />
      <path d="M12 13.5v3.5M9 20.5h6M10 17h4" />
    </Glyph>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 21c-3.8 0-6.5-2.7-6.5-6.3 0-3.1 2-5.2 3.6-6.8.4 1.5 1.3 2.6 2.4 3.1C11.3 7.8 12.7 5 15 3c.3 3 3.5 5.7 3.5 10.6 0 4.2-2.7 7.4-6.5 7.4Z" />
    </Glyph>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Glyph>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14l1.5-2Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </Glyph>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m9.5 6 6 6-6 6" />
    </Glyph>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m14.5 6-6 6 6 6" />
    </Glyph>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" />
    </Glyph>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.5 19.5h4l10-10-4-4-10 10v4Z" />
      <path d="m13 7 4 4" />
    </Glyph>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z" />
    </Glyph>
  );
}

export function KettlebellIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M9 8.5a3 3 0 1 1 6 0" />
      <path d="M7.6 9h8.8l1.6 11.5H6L7.6 9Z" />
    </Glyph>
  );
}

export function SyncIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M19.5 11A7.5 7.5 0 0 0 6 6.8M4.5 13A7.5 7.5 0 0 0 18 17.2" />
      <path d="M5.5 3.5v3.8h3.8M18.5 20.5v-3.8h-3.8" />
    </Glyph>
  );
}

export function StorageIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="2.5" />
      <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
      <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
    </Glyph>
  );
}

export function DeviceIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </Glyph>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Glyph>
  );
}

/** A clipboard with a list on it — a plan to follow. */
export function ClipboardIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="5" y="4.5" width="14" height="16.5" rx="2.5" />
      <path d="M9 4.5V4a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4v.5" />
      <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4" />
    </Glyph>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 4 21 19.5H3L12 4Z" />
      <path d="M12 10v4M12 17h.01" />
    </Glyph>
  );
}

/** An arrow into a tray — something coming to this device. */
export function DownloadIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5" />
      <path d="M4.5 15.5v2.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.5" />
    </Glyph>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4 6.5h16M9.5 6.5V4.5h5v2" />
      <path d="M6 6.5 7 20h10l1-13.5" />
      <path d="M10 10.5v6M14 10.5v6" />
    </Glyph>
  );
}

/** Rings and a centre: something aimed at. */
export function TargetIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </Glyph>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6 9.5 12 15.5 18 9.5" />
    </Glyph>
  );
}

/** Up and to the point: "more weight next time". */
export function ArrowUpIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </Glyph>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5 12.5 10 17.5 19 7" />
    </Glyph>
  );
}

/** A heart with a pulse through it: cardio. */
export function HeartIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z" />
      <path d="M7.5 12.5h2.5l1.2-2.2 1.8 4.2 1.2-2h2.3" />
    </Glyph>
  );
}

/** A speech bubble: a message to someone. */
export function MessageIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4 5.5h16v10.5H9l-4 4v-4H4V5.5Z" strokeLinejoin="round" />
      <path d="M8 9.5h8M8 12.5h5" />
    </Glyph>
  );
}

/** Two people, one a step behind the other: friends. */
export function FriendsIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-5.8 6.5-5.8s6.5 2.2 6.5 5.8" />
      <path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6" />
      <path d="M17.5 14.6c2.4.6 4 2.5 4 5.4" />
    </Glyph>
  );
}

/** A person with a plus beside them: add a friend. */
export function AddFriendIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="10" cy="8.5" r="3.5" />
      <path d="M3.5 20c0-3.6 2.9-5.8 6.5-5.8s6.5 2.2 6.5 5.8" />
      <path d="M19 8v6M16 11h6" />
    </Glyph>
  );
}

/**
 * You against them, with a slashed VS between: the challenge button's badge.
 * Not one of the set above. It is Milan's own artwork, traced from his
 * 1254px drawing in that drawing's units, tile and all, so it looks the same
 * as the drawing at any size and in either theme: you in orange, them in
 * green, white italic letters, red slashes, on a near-black rounded square.
 */
export function VersusIcon(props: IconProps) {
  // Gradients are found by id, and two badges on one page must not share one.
  const id = useId().replace(/[^\w-]/g, '');
  return (
    <svg viewBox="75 72 1105 1095" aria-hidden focusable="false" {...props}>
      <defs>
        <linearGradient id={`${id}-you`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff7d42" />
          <stop offset="1" stopColor="#ff4a2f" />
        </linearGradient>
        <linearGradient id={`${id}-them`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fd383" />
          <stop offset="1" stopColor="#3c9d58" />
        </linearGradient>
      </defs>
      <rect x="75" y="72" width="1105" height="1095" rx="250" fill="#111" />
      <g fill={`url(#${id}-you)`}>
        <circle cx="343" cy="507" r="88" />
        <path d="M178 745C178 665 250 606 339 606S500 665 500 745Q500 770 476 770H202Q178 770 178 745Z" />
      </g>
      <g fill={`url(#${id}-them)`}>
        <circle cx="913" cy="507" r="88" />
        <path d="M752 748C752 668 824 606 913 606S1074 668 1074 748Q1074 773 1050 773H776Q752 773 752 748Z" />
      </g>
      <g fill="#ff4a2f" stroke="#ff4a2f" strokeWidth={6} strokeLinejoin="round">
        <path d="M709 312H741L673 495H641Z" />
        <path d="M595 737H626L550 939H518Z" />
      </g>
      <path fill="#fff" d="M521 532H567L570 640L613 532H660L583 700H535Z" />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth={44}
        transform="translate(0 615) skewX(-12) translate(0 -615)"
        d="M738 574C724 557 707 553 691 553C664 553 650 568 652 587C655 608 679 613 699 621C721 629 736 639 734 657C732 673 715 679 695 679C676 679 659 672 646 659"
      />
    </svg>
  );
}

/**
 * One branch of the laurel: where each leaf sits on the stem's arc and which
 * way it points, along the stem and leaning out. Worked out once here rather
 * than traced, so the leaves are evenly spaced.
 */
const LAUREL_LEAVES = [128, 153, 178, 203, 228].map((degrees) => {
  const theta = (degrees * Math.PI) / 180;
  const x = 12 + 8 * Math.cos(theta);
  const y = 12.5 + 8 * Math.sin(theta);
  // Up the stem (increasing angle), plus some of the way outward.
  const dx = -Math.sin(theta) + 0.75 * Math.cos(theta);
  const dy = Math.cos(theta) + 0.75 * Math.sin(theta);
  const turn = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${turn.toFixed(1)})`;
});

/**
 * A laurel wreath, open at the top, with room in the middle for a place: the
 * three best lifts on Profile. Drawn, not filled, like every other glyph.
 */
export function LaurelIcon(props: IconProps) {
  const branch = (
    <>
      <path d="M10.4 20.4A8 8 0 0 1 6.2 6.9" />
      {LAUREL_LEAVES.map((transform) => (
        <path
          key={transform}
          transform={transform}
          d="M0 0C1.3-1 1.3-2.8 0-3.9-1.3-2.8-1.3-1 0 0Z"
        />
      ))}
    </>
  );
  return (
    <Glyph strokeWidth={1.1} {...props}>
      {branch}
      <g transform="matrix(-1 0 0 1 24 0)">{branch}</g>
    </Glyph>
  );
}

/** A crown with three points: last period's winner on the leaderboard. */
export function CrownIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4 18 3 7.5l5 4.5 4-6.5 4 6.5 5-4.5L20 18Z" />
      <path d="M4.5 21h15" />
    </Glyph>
  );
}

/** Two sheets, one over the other: copy. */
export function CopyIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
    </Glyph>
  );
}

/** A box with an arrow leaving it: the share sheet. */
export function ShareIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 15V3.5" />
      <path d="m7.5 8 4.5-4.5L16.5 8" />
      <path d="M8 11H6.5a1 1 0 0 0-1 1v7.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V12a1 1 0 0 0-1-1H16" />
    </Glyph>
  );
}

/** Three dots in a row: more options. */
export function MoreIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="5.5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1" fill="currentColor" />
    </Glyph>
  );
}

/**
 * A five-pointed star: a favourite exercise. Outlined by default; pass
 * `fill="currentColor"` for a starred one.
 */
export function StarIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z" />
    </Glyph>
  );
}
