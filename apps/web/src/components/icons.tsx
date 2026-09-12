import type { ReactNode, SVGProps } from 'react';

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

export function ChevronRightIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m9.5 6 6 6-6 6" />
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

export function AlertIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 4 21 19.5H3L12 4Z" />
      <path d="M12 10v4M12 17h.01" />
    </Glyph>
  );
}
