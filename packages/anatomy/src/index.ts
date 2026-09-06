/**
 * @g7m/anatomy — the 3D anatomy viewer (Brief §6), self-contained.
 *
 * One viewer component with a `mode: 'explore' | 'heatmap'` prop (Brief §9) —
 * not two components and not two models.
 *
 * The viewer knows nothing about the database: parts in, a muscle slug out.
 * That is what makes the model swappable. `node-names.ts` is the contract the
 * geometry has to satisfy — the same convention `muscles.mesh_node_names`
 * records in Postgres — and `placeholder-body.ts` is a stand-in that satisfies
 * it, because the licensed asset is fetched and never committed (ADR-0009) and
 * the repository is public.
 *
 * Swapping in a real GLB is a change of geometry source and nothing else.
 */
export { AnatomyViewer, type AnatomyMode, type AnatomyViewerProps } from './AnatomyViewer.js';
export {
  BODY_FILLER,
  placeholderBodyParts,
  placeholderSlugs,
  type BodyPart,
} from './placeholder-body.js';
export {
  NODE_PREFIX,
  checkModelContract,
  meshNodeName,
  meshNodeNames,
  parseMuscleNode,
  type ContractReport,
  type MuscleNode,
  type Side,
  type Taxonomy,
} from './node-names.js';
