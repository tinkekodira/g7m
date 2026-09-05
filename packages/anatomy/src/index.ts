/**
 * @g7m/anatomy — the 3D anatomy viewer (Brief §6), self-contained.
 *
 * Built in Phase 5. One viewer component with a `mode: 'explore' | 'heatmap'`
 * prop (Brief §9) — not two components and not two models.
 *
 * The GLB is loaded through a swappable `AnatomyModelSource` adapter so the
 * asset can be replaced without touching viewer code, and so the licensed
 * asset never has to be committed (see DECISIONS.md ADR-0009).
 */
export {};
