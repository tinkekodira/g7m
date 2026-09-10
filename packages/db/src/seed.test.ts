import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from './testing/pglite-harness.js';

/**
 * The seed data, checked for the holes you cannot see by reading it.
 *
 * A muscle nobody can train, an exercise the generator cannot schedule, a
 * movement pattern nobody covered — all of these look fine in a diff and are
 * only visible when you ask the whole data set a question.
 */

let h: Harness;

beforeAll(async () => {
  h = await startHarness();
}, 120_000);

afterAll(async () => {
  await h?.close();
});

async function count(sql: string, params: unknown[] = []): Promise<number> {
  const { rows } = await h.db.query<{ n: number }>(sql, params);
  return Number(rows[0]?.n ?? -1);
}

async function slugs(sql: string, params: unknown[] = []): Promise<string[]> {
  const { rows } = await h.db.query<{ slug: string }>(sql, params);
  return rows.map((r) => r.slug);
}

describe('volumes', () => {
  it('seeds the 14 muscle groups from the brief', async () => {
    expect(await count('select count(*) n from public.muscle_groups')).toBe(14);
  });

  it('seeds all 37 muscles from the brief', async () => {
    expect(await count('select count(*) n from public.muscles')).toBe(37);
  });

  it('seeds the equipment list', async () => {
    // 28 from Brief §5, plus the back extension bench the §5 list omits.
    expect(await count('select count(*) n from public.equipment')).toBe(29);
  });

  it('seeds exactly 50 exercises', async () => {
    expect(await count('select count(*) n from public.exercises')).toBe(50);
  });
});

describe('every exercise is usable', () => {
  it('has exactly one primary equipment station', async () => {
    const broken = await slugs(`
      select e.slug from public.exercises e
        left join public.exercise_equipment ee
          on ee.exercise_id = e.id and ee.is_primary
       group by e.slug
      having count(ee.id) <> 1
    `);
    expect(broken, 'exercises without exactly one primary station').toEqual([]);
  });

  it('has at least one primary mover', async () => {
    const broken = await slugs(`
      select e.slug from public.exercises e
        left join public.exercise_muscles em
          on em.exercise_id = e.id and em.role = 'primary'
       group by e.slug
      having count(em.id) = 0
    `);
    expect(broken, 'exercises with no primary muscle').toEqual([]);
  });

  it('carries at least two coaching cues, the offline fallback', async () => {
    const thin = await slugs(
      `select slug from public.exercises where cardinality(cues) < 2 order by slug`,
    );
    expect(thin).toEqual([]);
  });

  it('carries instructions and at least one common mistake', async () => {
    expect(
      await slugs(`select slug from public.exercises where cardinality(instructions) < 3`),
    ).toEqual([]);
    expect(
      await slugs(`select slug from public.exercises where cardinality(common_mistakes) < 1`),
    ).toEqual([]);
  });

  it('marks only genuine holds as time based', async () => {
    expect(
      await slugs(`select slug from public.exercises where is_time_based order by slug`),
    ).toEqual(['farmer-carry', 'plank']);
  });
});

describe('every muscle is trainable', () => {
  /**
   * The §6 Compound toggle shows exercises where the muscle is primary OR
   * secondary. A selectable muscle matching neither opens an empty panel, which
   * is a dead end the user cannot tell from a bug.
   */
  it('leaves no selectable muscle without an exercise', async () => {
    const orphans = await slugs(`
      select m.slug from public.muscles m
        left join public.exercise_muscles em
          on em.muscle_id = m.id and em.role in ('primary', 'secondary')
       where m.is_selectable
       group by m.slug
      having count(em.id) = 0
       order by m.slug
    `);
    expect(orphans, 'selectable muscles with an empty exercise panel').toEqual([]);
  });

  /**
   * Two different reasons a muscle is carried and not offered.
   *
   * Nothing in the 50 trains the neck, so sternocleidomastoid is seeded for the
   * model but deliberately not selectable — which is exactly what the flag is
   * for (Brief §5).
   *
   * The other five are the muscles a closed sculpted skin has no room for
   * (ADR-0045). They are trained — the semimembranosus is a prime mover for
   * three exercises — and they are still counted, still listed on the
   * exercises that work them. There is simply no geometry on the body to tap,
   * and the app no longer carries a second layer to reach them on (ADR-0049).
   *
   * Listed rather than counted, so adding a sixth is a decision somebody makes
   * on purpose. The atlas end of the same wire is pinned in
   * `placeholder-body.test.ts`.
   */
  it('offers only the muscles a tap can reach', async () => {
    expect(
      await slugs(`select slug from public.muscles where not is_selectable order by slug`),
    ).toEqual([
      'brachialis',
      'rhomboids',
      'semimembranosus',
      'sternocleidomastoid',
      'teres-major',
      'triceps-medial-head',
    ]);
  });

  it('gives every selectable muscle a left and right mesh node', async () => {
    const bad = await slugs(`
      select slug from public.muscles
       where is_selectable
         and (cardinality(mesh_node_names) <> 2
              or mesh_node_names[1] <> 'muscle_' || slug || '_l'
              or mesh_node_names[2] <> 'muscle_' || slug || '_r')
       order by slug
    `);
    expect(bad, 'muscles whose mesh names break the §6 convention').toEqual([]);
  });

  it('assigns every muscle to a group that exists', async () => {
    expect(
      await count(`
        select count(*) n from public.muscles m
          left join public.muscle_groups g on g.id = m.muscle_group_id
         where g.id is null
      `),
    ).toBe(0);
  });
});

describe('the §6 exercise panel', () => {
  /** Compound: mechanic = compound AND role is primary or secondary. */
  async function compoundFor(muscleSlug: string): Promise<string[]> {
    return slugs(
      `select e.slug from public.exercises e
         join public.exercise_muscles em on em.exercise_id = e.id
         join public.muscles m on m.id = em.muscle_id
        where m.slug = $1 and e.mechanic = 'compound'
          and em.role in ('primary','secondary')
        order by em.recruitment_weight desc, e.popularity_rank`,
      [muscleSlug],
    );
  }

  /** Isolation: mechanic = isolation AND role is primary, strictly. */
  async function isolationFor(muscleSlug: string): Promise<string[]> {
    return slugs(
      `select e.slug from public.exercises e
         join public.exercise_muscles em on em.exercise_id = e.id
         join public.muscles m on m.id = em.muscle_id
        where m.slug = $1 and e.mechanic = 'isolation' and em.role = 'primary'
        order by em.recruitment_weight desc, e.popularity_rank`,
      [muscleSlug],
    );
  }

  it('puts the barbell row under biceps compounds, per the brief', async () => {
    // "A barbell row absolutely trains your biceps, and a beginner exploring
    // biceps should find it there." — Brief §6.
    expect(await compoundFor('biceps-brachii')).toContain('barbell-row');
  });

  it('keeps the barbell row out of biceps isolation', async () => {
    expect(await isolationFor('biceps-brachii')).not.toContain('barbell-row');
  });

  it('ranks the strongest recruiter first', async () => {
    const chest = await compoundFor('pec-major-sternal');
    expect(chest[0]).toBe('barbell-bench-press');
  });

  it('gives every selectable muscle a non-empty compound panel', async () => {
    const all = await slugs(`select slug from public.muscles where is_selectable order by slug`);
    const empty: string[] = [];
    for (const slug of all) {
      if ((await compoundFor(slug)).length === 0) empty.push(slug);
    }
    // Isolation-only muscles are acceptable; a muscle with neither is not, and
    // the orphan test above already covers that case.
    expect(empty.length, `no compound exercise: ${empty.join(', ')}`).toBeLessThanOrEqual(4);
  });
});

describe('movement pattern coverage', () => {
  const patterns: [string, string[]][] = [
    ['horizontal push', ['barbell-bench-press', 'push-up', 'machine-chest-press']],
    ['vertical push', ['overhead-press', 'dumbbell-shoulder-press']],
    ['vertical pull', ['pull-up', 'lat-pulldown']],
    ['horizontal pull', ['barbell-row', 'seated-cable-row']],
    ['squat', ['barbell-back-squat', 'leg-press', 'goblet-squat']],
    ['hinge', ['conventional-deadlift', 'romanian-deadlift']],
    ['lunge', ['walking-lunge', 'bulgarian-split-squat']],
    ['carry', ['farmer-carry']],
    ['rotation', ['cable-woodchop']],
  ];

  it.each(patterns)('covers %s', async (_pattern, expected) => {
    const found = await slugs(`select slug from public.exercises where slug = any($1)`, [expected]);
    expect(found.sort()).toEqual([...expected].sort());
  });
});

describe('equipment filtering, which the generator depends on', () => {
  it('offers a full workout to someone with nothing but their bodyweight', async () => {
    const available = await slugs(`
      select distinct e.slug from public.exercises e
       where not exists (
         select 1 from public.exercise_equipment ee
           join public.equipment q on q.id = ee.equipment_id
          where ee.exercise_id = e.id and q.category <> 'bodyweight'
       )
    `);
    expect(available.length, 'bodyweight-only exercises').toBeGreaterThanOrEqual(3);
  });

  it('never links an exercise to equipment that does not exist', async () => {
    expect(
      await count(`
        select count(*) n from public.exercise_equipment ee
          left join public.equipment q on q.id = ee.equipment_id
         where q.id is null
      `),
    ).toBe(0);
  });

  it('leaves no seeded equipment completely unused except by design', async () => {
    const unused = await slugs(`
      select q.slug from public.equipment q
        left join public.exercise_equipment ee on ee.equipment_id = q.id
       group by q.slug having count(ee.id) = 0
       order by q.slug
    `);
    // Equipment from the §5 list that no seed exercise needs yet. Kept because
    // the list is the user's "my gym has this" vocabulary, which is broader
    // than 50 exercises. Pinned so the set cannot grow unnoticed.
    expect(unused).toEqual([
      'decline-bench',
      'hip-thrust-machine',
      'kettlebell',
      'power-rack',
      'resistance-bands',
      'smith-machine',
    ]);
  });
});

describe('search over the real catalogue', () => {
  /**
   * The ranking contract for Phase 3's search.
   *
   * Ordering by trigram similarity alone is wrong, and the "squat" case shows
   * why: similarity is length-sensitive, so "Front Squat" scores higher than
   * "Barbell Back Squat" simply for being shorter, and a beginner typing
   * "squat" gets the harder, rarer lift. Exact and substring matches are ranked
   * as tiers first, and popularity breaks ties within a tier. Fuzzy similarity
   * is the last resort, for genuine typos.
   */
  async function search(term: string): Promise<string | undefined> {
    const { rows } = await h.db.query<{ slug: string }>(
      `select slug from public.exercises
        where search_text like '%' || lower($1) || '%' or search_text % lower($1)
        order by (search_text = lower($1)) desc,
                 (search_text like lower($1) || '%') desc,
                 (search_text like '%' || lower($1) || '%') desc,
                 popularity_rank,
                 similarity(search_text, lower($1)) desc
        limit 1`,
      [term],
    );
    return rows[0]?.slug;
  }

  it.each([
    ['bp', 'barbell-bench-press'],
    ['incline db', 'incline-dumbbell-press'],
    ['rdl', 'romanian-deadlift'],
    ['ohp', 'overhead-press'],
    ['squat', 'barbell-back-squat'],
    ['pullup', 'pull-up'],
  ])('finds %s', async (term, expected) => {
    expect(await search(term)).toBe(expected);
  });
});
