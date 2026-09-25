"""Pass three and a half: move the borders the transfer put in the wrong place.

    blender --background --factory-startup --python shape.py -- <fit.obj> <labels.json> <out.json>

Pass two names every vertex after the nearest atlas muscle, and the atlas is a
different body from the sculpt. Mostly that is close enough. In a few places
it is centimetres out, and ADR-0091's smooth highlight made that easy to see:
the sternal pec ran down the ribcage below its own crease, the rectus
abdominis flared out to the hips, and vastus medialis owned most of the front
of the thigh.

The sculpt already knows where those borders are. Muscles are sculpted as
bellies with **grooves** between them, so this pass lets named groups of
neighbouring muscles redraw the borders among themselves along the grooves:

1. Each muscle in a group gets a **seed** — the part of it that is certainly
   right. For the chest and abdomen that is the heart of its current label.
   For the thigh the labels themselves are what is wrong, so the seeds are
   placed by position around the thigh instead.
2. The seeds flood outward in order of **concavity**, lowest first, the
   classic watershed. A groove is a ridge in that landscape, so two floods
   meet in the groove between them.
3. The flood is **confined to the group's own territory, one side at a
   time.** That is the whole difference from the global watershed ADR-0091
   tried and rejected, which let groin skin climb the abdomen and left the
   anterior deltoid with nothing. Here a muscle can only trade skin with the
   neighbours named beside it, and anything outside the group keeps exactly
   the label it had.

Numpy and the standard library only, so it runs in Blender's Python like the
other passes.
"""

import heapq
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import regions  # noqa: E402

# The clavicular pec is left out on purpose: nothing is sculpted between the
# two heads of the pec, so a flood there has no groove to stop in and puts the
# border wherever the seeds happen to meet. The transfer's border stands.
CHEST = ('pec-major-sternal', 'serratus-anterior', 'external-obliques', 'rectus-abdominis')
THIGH = ('rectus-femoris', 'vastus-lateralis', 'vastus-medialis', 'hip-adductors')


def vertex_normals(verts: np.ndarray, tris: np.ndarray) -> np.ndarray:
    face = np.cross(verts[tris[:, 1]] - verts[tris[:, 0]], verts[tris[:, 2]] - verts[tris[:, 0]])
    normal = np.zeros_like(verts)
    for corner in range(3):
        np.add.at(normal, tris[:, corner], face)
    return normal / (np.linalg.norm(normal, axis=1)[:, None] + 1e-12)


def concavity(verts: np.ndarray, tris: np.ndarray, rounds: int = 3) -> np.ndarray:
    """How much of a groove each vertex sits in, as a rank from 0 to 1.

    The mean-curvature normal from the cotangent Laplacian, along the vertex
    normal: positive in a groove, negative on a belly. Lightly smoothed so a
    single noisy vertex is not a wall, and ranked so the numbers mean the same
    thing on any body.
    """
    count = len(verts)
    a, b, c = verts[tris[:, 0]], verts[tris[:, 1]], verts[tris[:, 2]]

    def cot(p: np.ndarray, q: np.ndarray, r: np.ndarray) -> np.ndarray:
        u, v = q - p, r - p
        return (u * v).sum(axis=1) / (np.linalg.norm(np.cross(u, v), axis=1) + 1e-12)

    src = np.concatenate([tris[:, 1], tris[:, 2], tris[:, 0]])
    dst = np.concatenate([tris[:, 2], tris[:, 0], tris[:, 1]])
    weight = 0.5 * np.concatenate([cot(a, b, c), cot(b, c, a), cot(c, a, b)])
    src, dst, weight = np.concatenate([src, dst]), np.concatenate([dst, src]), np.concatenate([weight, weight])

    face = np.cross(b - a, c - a)
    area = np.zeros(count)
    for corner in range(3):
        np.add.at(area, tris[:, corner], np.linalg.norm(face, axis=1) / 6)
    normal = vertex_normals(verts, tris)

    laplace = np.zeros_like(verts)
    np.add.at(laplace, src, weight[:, None] * (verts[dst] - verts[src]))
    depth = (laplace / area[:, None] * normal).sum(axis=1)

    positive = np.maximum(weight, 1e-3)
    total = np.bincount(src, weights=positive, minlength=count)
    for _ in range(rounds):
        depth = 0.5 * depth + 0.5 * np.bincount(src, weights=positive * depth[dst], minlength=count) / total
    return np.argsort(np.argsort(depth)) / (count - 1.0)


def neighbours(tris: np.ndarray, count: int) -> list[np.ndarray]:
    edges = np.concatenate([tris[:, [0, 1]], tris[:, [1, 2]], tris[:, [2, 0]]])
    edges = np.concatenate([edges, edges[:, ::-1]])
    edges = edges[np.lexsort((edges[:, 1], edges[:, 0]))]
    starts = np.searchsorted(edges[:, 0], np.arange(count + 1))
    return [np.unique(edges[starts[v] : starts[v + 1], 1]) for v in range(count)]


def flood(labels: np.ndarray, seeds: dict[int, np.ndarray], territory: np.ndarray, height: np.ndarray, near) -> int:
    """Watershed from `seeds` within `territory`, in place. Returns vertices moved.

    Priority flood: a vertex is reached at the highest groove on the lowest
    path to it, and the seed that reaches it first keeps it. Territory no seed
    can reach — cut off by another group, say — keeps its old label.
    """
    claimed = np.full(len(labels), -1)
    heap: list[tuple[float, int, int]] = []
    for label, members in seeds.items():
        claimed[members] = label
    for label, members in seeds.items():
        for v in members:
            for u in near[v]:
                if territory[u] and claimed[u] < 0:
                    heapq.heappush(heap, (height[u], int(u), label))
    while heap:
        level, v, label = heapq.heappop(heap)
        if claimed[v] >= 0:
            continue
        claimed[v] = label
        for u in near[v]:
            if territory[u] and claimed[u] < 0:
                heapq.heappush(heap, (max(level, height[u]), int(u), label))

    inside = territory & (claimed >= 0)
    moved = int((labels[inside] != claimed[inside]).sum())
    labels[inside] = claimed[inside]
    return moved


def thigh_frame(verts: np.ndarray, territory: np.ndarray, lateral: float) -> tuple[np.ndarray, np.ndarray]:
    """Height and angle around the thigh for every vertex.

    The legs stand apart, so the thigh's axis leans; its centre is taken slice
    by slice. Angle 0 faces forward and positive turns towards the outside of
    this leg, so one set of numbers places the seeds on both legs.
    """
    y = verts[:, 1]
    pts = verts[territory]
    bins = np.linspace(pts[:, 1].min(), pts[:, 1].max(), 16)
    slot = np.clip(np.digitize(pts[:, 1], bins) - 1, 0, len(bins) - 2)
    mids = (bins[:-1] + bins[1:]) / 2
    cx = np.array([pts[slot == s, 0].mean() if (slot == s).any() else np.nan for s in range(len(mids))])
    cz = np.array([pts[slot == s, 2].mean() if (slot == s).any() else np.nan for s in range(len(mids))])
    ok = ~np.isnan(cx)
    centre_x = np.interp(y, mids[ok], cx[ok])
    centre_z = np.interp(y, mids[ok], cz[ok])
    angle = np.degrees(np.arctan2((verts[:, 0] - centre_x) * lateral, verts[:, 2] - centre_z))
    return y, angle


def core(fields: np.ndarray, labels: np.ndarray, label: int, share: float) -> np.ndarray:
    """The most interior `share` of a label's vertices.

    A share rather than a threshold: after heavy smoothing a small muscle
    never reaches the level a large one does, and a fixed threshold gave the
    small ones no seed at all — which hands their skin to whoever floods it.
    """
    own = np.where(labels == label)[0]
    level = np.quantile(fields[own, label], 1.0 - share)
    return own[fields[own, label] >= level]


def main() -> None:
    argv = sys.argv[sys.argv.index('--') + 1 :] if '--' in sys.argv else sys.argv[1:]
    obj_path, labels_path, out_path = argv[0], argv[1], argv[2]

    verts, tris = regions.read_obj(obj_path)
    data = json.loads(open(labels_path, encoding='utf-8').read())
    names: list[str] = data['names']
    labels = np.array(data['labels'])
    before = labels.copy()
    index = {name: i for i, name in enumerate(names)}

    height = concavity(verts, tris)
    normal = vertex_normals(verts, tris)
    near = neighbours(tris, len(verts))
    # The heart of each label: what survives heavy smoothing nearly intact.
    fields = regions.smooth_fields(verts, tris, labels, len(names), 80)
    x, y = np.abs(verts[:, 0]), verts[:, 1]

    for side, lateral in (('r', 1.0), ('l', -1.0)):
        # Chest and abdomen, seeded from the labels' own cores, three of them
        # held to where the muscle actually is:
        # - the rectus abdominis to the column either side of the midline; its
        #   flare over the lower belly is the obliques';
        # - the sternal pec to the forward-facing chest above its crease,
        #   which on this body sits at y 1.29 by the nipple line;
        # - the serratus given the side of the ribcage below the pec as well,
        #   where the transfer had put a wing of pec. Its own core is boxed in
        #   by the grooves between its digitations and cannot reach there.
        group = [index[f'muscle_{m}_{side}'] for m in CHEST]
        territory = np.isin(labels, group)
        seeds = {k: core(fields, labels, k, 0.3) for k in group}
        rectus = index[f'muscle_rectus-abdominis_{side}']
        seeds[rectus] = seeds[rectus][x[seeds[rectus]] < 0.05]
        pec = index[f'muscle_pec-major-sternal_{side}']
        seeds[pec] = seeds[pec][(normal[seeds[pec], 2] > 0.6) & (y[seeds[pec]] > 1.29)]
        serratus = index[f'muscle_serratus-anterior_{side}']
        ribs = territory & (x >= 0.13) & (y >= 1.20) & (y <= 1.26) & (np.abs(normal[:, 0]) > 0.5)
        seeds[serratus] = np.union1d(seeds[serratus], np.where(ribs)[0])
        moved = flood(labels, seeds, territory, height, near)
        print(f'CHEST {side}: {moved} vertices moved')

        # The front of the thigh, seeded by position: rectus femoris down the
        # middle, vastus lateralis on the outside, vastus medialis in the
        # teardrop above the inner knee, the adductors high on the inside.
        group = [index[f'muscle_{m}_{side}'] for m in THIGH]
        territory = np.isin(labels, group)
        y, angle = thigh_frame(verts, territory, lateral)
        place = {
            'rectus-femoris': (y > 0.62) & (y < 0.82) & (angle > -10) & (angle < 20),
            'vastus-lateralis': (y > 0.60) & (y < 0.82) & (angle > 70) & (angle < 115),
            'vastus-medialis': (y > 0.53) & (y < 0.60) & (angle > -70) & (angle < -35),
            'hip-adductors': (y > 0.72) & (y < 0.84) & (angle > -135) & (angle < -95),
        }
        seeds = {index[f'muscle_{m}_{side}']: np.where(territory & mask)[0] for m, mask in place.items()}
        empty = [names[k] for k, s in seeds.items() if len(s) == 0]
        assert not empty, f'no seed for {empty}'
        moved = flood(labels, seeds, territory, height, near)
        print(f'THIGH {side}: {moved} vertices moved')

    counts = np.bincount(labels, minlength=len(names))
    for k in np.where(counts != np.bincount(before, minlength=len(names)))[0]:
        print(f'  {names[k]:34s} {int((before == k).sum()):5d} -> {int(counts[k]):5d}')
    assert counts.min() > 0, f'{names[int(counts.argmin())]} lost all its skin'

    with open(out_path, 'w', encoding='utf-8') as fh:
        json.dump({'names': names, 'labels': labels.tolist()}, fh)
    print('WROTE', out_path)


main()
