/**
 * The sync rules, read from the file that is pasted into the PowerSync
 * dashboard — not rebuilt from the schema — so the fake sends a device what
 * production sends it, and a column missing from the deployed rules is missing
 * here too.
 *
 * Only the shape this repository's rules have is understood: buckets with
 * `data:` lists of folded (`>-`) SELECTs, and one parameter, the user id.
 * Anything else is a reason to fail loudly rather than to sync something
 * plausible.
 */
import { readFileSync } from 'node:fs';

export interface BucketQuery {
  readonly table: string;
  readonly columns: readonly string[];
  /** Whether the query is filtered by `bucket.user_id`. */
  readonly perUser: boolean;
}

/** How the service writes a `timestamptz`, from the rules' `config` block. */
export interface TimestampFormat {
  /** `2026-09-13T10:00:00.123Z` rather than the legacy `2026-09-13 10:00:00.123Z`. */
  readonly iso8601: boolean;
  /** Fractional digits, when `timestamp_max_precision` sets them; Postgres' six otherwise. */
  readonly subSecondDigits: number;
}

const PRECISION_DIGITS: Readonly<Record<string, number>> = {
  seconds: 0,
  milliseconds: 3,
  microseconds: 6,
  nanoseconds: 9,
};

export interface SyncRules {
  readonly timestamps: TimestampFormat;
  /** Buckets every signed-in user gets, by name. */
  readonly global: ReadonlyMap<string, readonly BucketQuery[]>;
  /** Buckets parameterised by the user id, by name. */
  readonly perUser: ReadonlyMap<string, readonly BucketQuery[]>;
}

const RULES_FILE = new URL('../../powersync/sync-rules.yaml', import.meta.url);

export function readSyncRules(text = readFileSync(RULES_FILE, 'utf8')): SyncRules {
  const buckets = new Map<string, string[]>();
  const config = new Map<string, string>();
  let inConfig = false;
  let bucket: string | null = null;
  let current: string[] | null = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trimEnd();
    if (line.trim() === '') continue;

    // `config:` is a top-level block of `key: value` lines, before the buckets.
    if (/^\S/.test(line)) inConfig = line === 'config:';
    if (inConfig) {
      const option = /^ {2}(\w+): (.+)$/.exec(line);
      if (option !== null) config.set(option[1] ?? '', (option[2] ?? '').trim());
      continue;
    }

    const name = /^ {2}(\w+):$/.exec(line);
    if (name !== null) {
      bucket = name[1] ?? null;
      if (bucket !== null) buckets.set(bucket, []);
      current = null;
      continue;
    }
    if (bucket === null) continue;

    if (/^ {6}- >-$/.test(line)) {
      current = [];
      buckets.get(bucket)?.push('');
      continue;
    }
    if (current !== null && /^ {8}\S/.test(line)) {
      const queries = buckets.get(bucket);
      if (queries === undefined || queries.length === 0) continue;
      queries[queries.length - 1] = `${queries[queries.length - 1] ?? ''} ${line.trim()}`.trim();
      continue;
    }
    current = null;
  }

  const global = new Map<string, BucketQuery[]>();
  const perUser = new Map<string, BucketQuery[]>();
  for (const [name, sqls] of buckets) {
    const queries = sqls.map(parseQuery);
    if (queries.length === 0) continue;
    const userScoped = queries.some((query) => query.perUser);
    if (userScoped && !queries.every((query) => query.perUser)) {
      throw new Error(`Bucket ${name} mixes per-user and global queries; the fake cannot do that.`);
    }
    (userScoped ? perUser : global).set(name, queries);
  }
  return { timestamps: timestampFormat(config), global, perUser };
}

/** The two options this repository's rules set; anything else is not something the fake does. */
function timestampFormat(config: ReadonlyMap<string, string>): TimestampFormat {
  for (const key of config.keys()) {
    if (key !== 'timestamps_iso8601' && key !== 'timestamp_max_precision') {
      throw new Error(`The fake does not implement the sync-rules option ${key}.`);
    }
  }
  const precision = config.get('timestamp_max_precision');
  const digits = precision === undefined ? 6 : PRECISION_DIGITS[precision];
  if (digits === undefined) throw new Error(`Unknown timestamp_max_precision ${String(precision)}`);
  return { iso8601: config.get('timestamps_iso8601') === 'true', subSecondDigits: digits };
}

function parseQuery(sql: string): BucketQuery {
  const match = /^SELECT (.+) FROM (\w+)(?: WHERE user_id = bucket\.user_id)?$/i.exec(sql);
  if (match === null) throw new Error(`The fake cannot read this sync rule: ${sql}`);
  const [, columns = '', table = ''] = match;
  return {
    table,
    columns: columns.split(',').map((column) => column.trim()),
    perUser: /WHERE user_id = bucket\.user_id$/i.test(sql),
  };
}
