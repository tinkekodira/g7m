"""Pass four, painted: replace the generated region map with one painted by hand.

    python packages/anatomy/tools/repaint.py <body.glb> <paint.png> <palette.json> <out.glb>

`split.py` works out where each muscle is from labels and smoothing, and some
borders come out wrong whatever the knobs are set to. This takes a person's
answer instead: a 2048² painting in the model's own UV layout, one flat colour
per muscle, both sides sharing a colour. It turns that into what `split.py`
produces — the region map inside the GLB and one mesh per region — so nothing
in the app has to change (ADR-0134).

The input GLB is the model the painting was made on, normally the installed
one. Its UVs are the layout the painting follows, so they are read from it and
never unwrapped again: Smart UV Project is free to lay a body out differently
on a second run, and a painting on the old layout would land on the wrong
skin. Positions, normals and UVs are carried through untouched; only which
triangle belongs to which part changes.

Plain Python with numpy, scipy and Pillow. No Blender.

## What it decides

- **Black is unpainted.** The canvas outside the islands is black and black is
  not in the palette, so a texel nearest black is one the brush missed. Those
  inside the body take the nearest painted texel's colour, measured in 3D. The
  rest snap to the nearest palette colour, which clears the anti-aliasing.
- **Sides come from the body, not the paint.** One colour covers both sides, so
  each texel's 3D position is worked out from its triangle and the sign of x
  picks the side. Which sign is `_l` is read off the input's own parts.
- **An island is measured on the body.** A patch smaller than `G7M_MIN_ISLAND`
  texels (default 20) goes to the majority of what borders it. Bordering
  includes across UV seams, so a sliver of pec in the corner of a small UV
  island, whose pec carries on in the next island, is part of the pec and
  stays.
- **Edge distance is measured on the body too.** The green channel is the
  distance to the nearest border of the texel's own region, through 3D, and a
  border is wherever two neighbouring texels disagree — side by side in the
  map, or facing each other across a seam. The edge of a UV island is not a
  border unless the region changes across it.
- **Parts are cut from the paint.** Each vertex takes the majority of the map
  around its UV, pooled over every UV it has on a seam, and each triangle the
  majority of its three vertices. A tap lands on the muscle the highlight
  draws to within a triangle — the same agreement `split.py` gives.
"""

import io
import json
import os
import struct
import sys

import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from scipy.spatial import cKDTree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import regions  # noqa: E402

MIN_ISLAND = int(os.environ.get('G7M_MIN_ISLAND') or 20)
# The same gutter `split.py` fills: the shader reads a texel either side.
DILATE = 6
EIGHT = np.ones((3, 3), dtype=bool)


# --- GLB in and out ----------------------------------------------------------


def read_glb(path: str) -> tuple[dict, bytes]:
    data = open(path, 'rb').read()
    magic, version, _ = struct.unpack_from('<III', data, 0)
    assert magic == 0x46546C67 and version == 2, f'{path} is not a GLB'
    json_length, json_type = struct.unpack_from('<II', data, 12)
    assert json_type == 0x4E4F534A
    gltf = json.loads(data[20 : 20 + json_length])
    offset = 20 + json_length
    bin_length, bin_type = struct.unpack_from('<II', data, offset)
    assert bin_type == 0x004E4942
    return gltf, data[offset + 8 : offset + 8 + bin_length]


def accessor(gltf: dict, binary: bytes, index: int) -> np.ndarray:
    acc = gltf['accessors'][index]
    view = gltf['bufferViews'][acc['bufferView']]
    assert 'byteStride' not in view, 'interleaved buffers are not read here'
    width = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[acc['type']]
    dtype = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}[acc['componentType']]
    start = view.get('byteOffset', 0) + acc.get('byteOffset', 0)
    out = np.frombuffer(binary, dtype=dtype, count=acc['count'] * width, offset=start)
    return out.reshape(acc['count'], width) if width > 1 else out


def region_image(gltf: dict, binary: bytes) -> np.ndarray:
    extras = gltf['scenes'][gltf.get('scene', 0)]['extras']['g7mRegions']
    view = gltf['bufferViews'][gltf['images'][extras['image']]['bufferView']]
    start = view.get('byteOffset', 0)
    png = binary[start : start + view['byteLength']]
    return np.asarray(Image.open(io.BytesIO(png)).convert('RGB'))


def write_glb(path: str, node_names: list[str], parts: list[dict]) -> None:
    """A GLB with one node and one mesh per part, in the order given, and no map yet."""
    binary = bytearray()
    views: list[dict] = []
    accessors: list[dict] = []

    def add(array: np.ndarray, kind: str, component: int, target: int, bounds: bool = False) -> int:
        while len(binary) % 4:
            binary.append(0)
        raw = np.ascontiguousarray(array).tobytes()
        views.append({'buffer': 0, 'byteOffset': len(binary), 'byteLength': len(raw), 'target': target})
        binary.extend(raw)
        entry = {'bufferView': len(views) - 1, 'componentType': component, 'count': len(array), 'type': kind}
        if bounds:
            entry['min'] = [float(v) for v in array.min(axis=0)]
            entry['max'] = [float(v) for v in array.max(axis=0)]
        accessors.append(entry)
        return len(accessors) - 1

    meshes = []
    for name, part in zip(node_names, parts):
        wide = len(part['position']) > 65535
        indices = part['indices'].astype(np.uint32 if wide else np.uint16)
        primitive = {
            'attributes': {
                'POSITION': add(part['position'].astype(np.float32), 'VEC3', 5126, 34962, bounds=True),
                'NORMAL': add(part['normal'].astype(np.float32), 'VEC3', 5126, 34962),
                'TEXCOORD_0': add(part['uv'].astype(np.float32), 'VEC2', 5126, 34962),
            },
            'indices': add(indices, 'SCALAR', 5125 if wide else 5123, 34963),
        }
        meshes.append({'name': name, 'primitives': [primitive]})

    while len(binary) % 4:
        binary.append(0)
    gltf = {
        'asset': {'generator': 'g7m repaint.py', 'version': '2.0'},
        'scene': 0,
        'scenes': [{'name': 'Scene', 'nodes': list(range(len(node_names)))}],
        'nodes': [{'mesh': i, 'name': name} for i, name in enumerate(node_names)],
        'meshes': meshes,
        'accessors': accessors,
        'bufferViews': views,
        'buffers': [{'byteLength': len(binary)}],
    }
    text = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    text += b' ' * (-len(text) % 4)
    total = 12 + 8 + len(text) + 8 + len(binary)
    with open(path, 'wb') as fh:
        fh.write(struct.pack('<III', 0x46546C67, 2, total))
        fh.write(struct.pack('<II', len(text), 0x4E4F534A))
        fh.write(text)
        fh.write(struct.pack('<II', len(binary), 0x004E4942))
        fh.write(binary)


# --- The body, as one surface ------------------------------------------------


def load_body(path: str) -> dict:
    """Every vertex record and triangle in the GLB, and which part each came from.

    A record is one glTF vertex: a position with one normal and one UV. The
    same point on the skin is several records where a part border or a UV
    seam runs through it, so the records are also welded by position into the
    body's own vertices — `split.py` copies positions exactly, so equal floats
    are the same vertex.
    """
    gltf, binary = read_glb(path)
    node_names: list[str] = []
    pos, nrm, uv, tris, tri_part = [], [], [], [], []
    base = 0
    for part, node in enumerate(gltf['nodes']):
        primitives = gltf['meshes'][node['mesh']]['primitives']
        assert len(primitives) == 1, f"{node['name']} has {len(primitives)} primitives"
        attributes = primitives[0]['attributes']
        p = accessor(gltf, binary, attributes['POSITION'])
        pos.append(p)
        nrm.append(accessor(gltf, binary, attributes['NORMAL']))
        uv.append(accessor(gltf, binary, attributes['TEXCOORD_0']))
        index = accessor(gltf, binary, primitives[0]['indices']).astype(np.int64).reshape(-1, 3)
        tris.append(index + base)
        tri_part.append(np.full(len(index), part))
        node_names.append(node['name'])
        base += len(p)

    position = np.concatenate(pos).astype(np.float64)
    _, weld = np.unique(position, axis=0, return_inverse=True)
    return {
        'gltf': gltf,
        'binary': binary,
        'node_names': node_names,
        'position': position,
        'normal': np.concatenate(nrm),
        'uv': np.concatenate(uv).astype(np.float64),
        'tris': np.concatenate(tris),
        'tri_part': np.concatenate(tri_part),
        'weld': weld.reshape(-1),
    }


def left_sign(body: dict) -> float:
    """+1 if the `_l` parts sit at positive x, -1 if negative. Read, not assumed."""
    signs = set()
    for part, name in enumerate(body['node_names']):
        if not name.endswith(('_l', '_r')):
            continue
        records = np.unique(body['tris'][body['tri_part'] == part])
        signs.add((name[-1], bool(body['position'][records, 0].mean() > 0)))
    left = {positive for side, positive in signs if side == 'l'}
    right = {positive for side, positive in signs if side == 'r'}
    assert len(left) == 1 and len(right) == 1 and left != right, f'sides do not split by x: {signs}'
    return 1.0 if left.pop() else -1.0


# --- The map's texels, located on the body -----------------------------------


def rasterize(uv: np.ndarray, size: int, batch: int = 8192) -> tuple[np.ndarray, np.ndarray]:
    """Which triangle each texel belongs to, and where in it.

    The coverage `regions.rasterize` gives: every texel whose centre a triangle
    covers, then the texels around each triangle's corners, edge midpoints and
    centre wherever nothing covered them, so a triangle smaller than a texel
    still owns the texels the shader reads on it.

    Returns per texel the triangle (-1 for none) and two barycentric weights,
    clamped into the triangle so a splatted texel sits on its edge rather than
    past it.
    """
    owner = np.full((size, size), -1, dtype=np.int32)
    weights = np.zeros((size, size, 2), dtype=np.float32)
    exact = np.zeros((size, size), dtype=bool)

    def triangles(start: int):
        corners = uv[start : start + batch] * size
        e1 = corners[:, 1] - corners[:, 0]
        e2 = corners[:, 2] - corners[:, 0]
        det = e1[:, 0] * e2[:, 1] - e1[:, 1] * e2[:, 0]
        usable = np.abs(det) > 1e-12
        return corners, np.where(usable, det, 1.0), usable

    def barycentric(t, px, py, corners, det):
        e1 = corners[t, 1] - corners[t, 0]
        e2 = corners[t, 2] - corners[t, 0]
        dx = px + 0.5 - corners[t, 0, 0]
        dy = py + 0.5 - corners[t, 0, 1]
        b1 = (dx * e2[:, 1] - dy * e2[:, 0]) / det[t]
        b2 = (e1[:, 0] * dy - e1[:, 1] * dx) / det[t]
        return b1, b2

    # Pass one: texel centres inside a triangle.
    for start in range(0, len(uv), batch):
        corners, det, usable = triangles(start)
        x0 = np.ceil(corners[:, :, 0].min(axis=1) - 0.5).astype(np.int64)
        x1 = np.floor(corners[:, :, 0].max(axis=1) - 0.5).astype(np.int64)
        y0 = np.ceil(corners[:, :, 1].min(axis=1) - 0.5).astype(np.int64)
        y1 = np.floor(corners[:, :, 1].max(axis=1) - 0.5).astype(np.int64)
        width = np.maximum(x1 - x0 + 1, 0)
        height = np.maximum(y1 - y0 + 1, 0)
        count = np.where(usable, width * height, 0)
        if count.sum() == 0:
            continue
        t = np.repeat(np.arange(len(corners)), count)
        local = np.arange(count.sum()) - np.repeat(np.cumsum(count) - count, count)
        px = x0[t] + local % width[t]
        py = y0[t] + local // width[t]
        b1, b2 = barycentric(t, px, py, corners, det)
        inside = (b1 >= -1e-6) & (b2 >= -1e-6) & (1 - b1 - b2 >= -1e-6)
        inside &= (px >= 0) & (px < size) & (py >= 0) & (py < size)
        t, px, py, b1, b2 = t[inside], px[inside], py[inside], b1[inside], b2[inside]
        owner[py, px] = start + t
        weights[py, px, 0] = np.clip(b1, 0, 1)
        weights[py, px, 1] = np.clip(b2, 0, 1)
        exact[py, px] = True

    # Pass two: the four texels around seven points of every triangle, where
    # pass one left nothing.
    offsets = np.array([[0, 0], [1, 0], [0, 1], [1, 1]])
    for start in range(0, len(uv), batch):
        corners, det, usable = triangles(start)
        points = np.concatenate(
            [corners, (corners + np.roll(corners, -1, axis=1)) / 2, corners.mean(axis=1, keepdims=True)],
            axis=1,
        )
        cells = np.floor(points - 0.5).astype(np.int64)
        t = np.repeat(np.arange(len(corners)), 7 * 4)
        texels = (cells[:, :, None, :] + offsets[None, None]).reshape(-1, 2)
        px, py = texels[:, 0], texels[:, 1]
        keep = (px >= 0) & (px < size) & (py >= 0) & (py < size)
        t, px, py = t[keep], px[keep], py[keep]
        keep = ~exact[py, px]
        t, px, py = t[keep], px[keep], py[keep]
        b1, b2 = barycentric(t, px, py, corners, det)
        b1 = np.clip(np.where(usable[t], b1, 1 / 3), 0, 1)
        b2 = np.clip(np.where(usable[t], b2, 1 / 3), 0, 1)
        over = b1 + b2
        scale = np.where(over > 1, 1 / np.maximum(over, 1e-12), 1.0)
        owner[py, px] = start + t
        weights[py, px, 0] = b1 * scale
        weights[py, px, 1] = b2 * scale

    return owner, weights


def pairs_in_grid(covered: np.ndarray, flat_to_texel: np.ndarray, offsets) -> np.ndarray:
    """Pairs of covered texels that are neighbours in the map, as texel indices."""
    size = covered.shape[0]
    ys, xs = np.nonzero(covered)
    out = []
    for dy, dx in offsets:
        ny, nx = ys + dy, xs + dx
        inside = (ny >= 0) & (ny < size) & (nx >= 0) & (nx < size)
        y, x, ny, nx = ys[inside], xs[inside], ny[inside], nx[inside]
        keep = covered[ny, nx]
        first = flat_to_texel[y[keep] * size + x[keep]]
        second = flat_to_texel[ny[keep] * size + nx[keep]]
        out.append(np.stack([first, second], axis=1))
    return np.concatenate(out)


def main() -> None:
    glb_path, paint_path, palette_path, out_path = sys.argv[1:5]

    palette = json.loads(open(palette_path, encoding='utf-8').read())
    body = load_body(glb_path)
    extras = body['gltf']['scenes'][body['gltf'].get('scene', 0)]['extras']['g7mRegions']
    names: list[str] = palette['names']
    assert names == extras['names'], 'palette.json names are not the GLB region order'
    assert sorted(names) == sorted(body['node_names']), 'regions and nodes name different things'
    size = int(extras['size'])
    count = len(names)

    paint = np.asarray(Image.open(paint_path).convert('RGB'))
    assert paint.shape == (size, size, 3), f'the painting is {paint.shape}, the map is {size}²'

    tris, uv, position = body['tris'], body['uv'], body['position']
    welded = body['weld'][tris]
    sign = left_sign(body)
    print(f'BODY records={len(position)} vertices={body["weld"].max() + 1} triangles={len(tris)}')
    print(f'SIDES _l is at {"positive" if sign > 0 else "negative"} x, read from the parts')

    # --- Which region each colour means, on each side -----------------------
    slugs = list(palette['palette'])
    colours = np.array([[int(h[i : i + 2], 16) for i in (1, 3, 5)] for h in palette['palette'].values()])
    sided = np.full((len(slugs), 2), -1, dtype=np.int64)  # [colour, 0 right / 1 left] -> region
    for s, slug in enumerate(slugs):
        stem = f'skin_{slug[len("skin-"):]}' if slug.startswith('skin-') else f'muscle_{slug}'
        if stem in names:
            sided[s] = names.index(stem)
        else:
            sided[s, 0] = names.index(f'{stem}_r')
            sided[s, 1] = names.index(f'{stem}_l')
    assert sorted(set(sided.ravel().tolist()) - {-1}) == list(range(count)), 'a region has no colour'

    # --- Every covered texel, located on the body ---------------------------
    owner, weights = rasterize(uv[tris], size)
    covered = owner >= 0
    texels = np.flatnonzero(covered)
    flat_to_texel = np.full(size * size, -1, dtype=np.int64)
    flat_to_texel[texels] = np.arange(len(texels))
    tri = owner.reshape(-1)[texels]
    bary = weights.reshape(-1, 2)[texels].astype(np.float64)
    corners = position[tris[tri]]
    point = (
        (1 - bary[:, 0:1] - bary[:, 1:2]) * corners[:, 0]
        + bary[:, 0:1] * corners[:, 1]
        + bary[:, 1:2] * corners[:, 2]
    )

    # How long a texel is on the skin, per triangle: the unwrap is not
    # perfectly even, and a distance in texels has to be one in the map.
    p = position[tris]
    area3 = 0.5 * np.linalg.norm(np.cross(p[:, 1] - p[:, 0], p[:, 2] - p[:, 0]), axis=1)
    q = uv[tris] * size
    area_uv = 0.5 * np.abs(
        (q[:, 1, 0] - q[:, 0, 0]) * (q[:, 2, 1] - q[:, 0, 1])
        - (q[:, 2, 0] - q[:, 0, 0]) * (q[:, 1, 1] - q[:, 0, 1])
    )
    flat_uv = area_uv <= 1e-9
    typical = np.median(np.sqrt(area3[~flat_uv] / area_uv[~flat_uv]))
    texel_len = np.where(flat_uv, typical, np.sqrt(area3 / np.where(flat_uv, 1, area_uv)))
    step = texel_len[tri]
    print(f'MAP {len(texels)} texels on the body; a texel is {np.median(step) * 1000:.2f} mm of skin (median)')

    # --- The painting, as palette colours -----------------------------------
    rgb = paint.reshape(-1, 3)[texels].astype(np.int64)
    with_black = np.vstack([colours, [[0, 0, 0]]])
    nearest = np.empty(len(rgb), dtype=np.int64)
    for start in range(0, len(rgb), 1 << 18):
        chunk = rgb[start : start + (1 << 18)]
        nearest[start : start + len(chunk)] = np.argmin(
            ((chunk[:, None, :] - with_black[None]) ** 2).sum(axis=2), axis=1
        )
    exact = (colours[np.minimum(nearest, len(colours) - 1)] == rgb).all(axis=1) & (nearest < len(colours))
    unpainted = nearest == len(colours)
    colour = nearest.copy()
    if unpainted.any():
        painted = np.flatnonzero(~unpainted)
        _, found = cKDTree(point[painted]).query(point[unpainted])
        colour[unpainted] = colour[painted[found]]
    print(
        f'PAINT exact {int(exact.sum())}, snapped {int((~exact & ~unpainted).sum())}, '
        f'unpainted {int(unpainted.sum())} (filled from the nearest paint on the body)'
    )

    left = (point[:, 0] * sign > 0).astype(np.int64)
    label = sided[colour, left]
    label = np.where(label < 0, sided[colour, 0], label)

    # --- Who borders whom: in the map, and across seams ---------------------
    island, _ = ndimage.label(covered, structure=EIGHT)
    island = island.reshape(-1)[texels]
    grid4 = pairs_in_grid(covered, flat_to_texel, [(0, 1), (1, 0)])
    grid8 = pairs_in_grid(covered, flat_to_texel, [(0, 1), (1, 0), (1, 1), (1, -1)])

    # A texel at the edge of a UV island faces another island across a seam.
    # Its neighbours there are the nearest texels on the skin whose triangles
    # share a vertex with its own — so a hand resting on a thigh is not a seam.
    open_side = np.zeros_like(covered)
    padded = np.pad(covered, 1)
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        open_side |= ~padded[1 + dy : 1 + dy + size, 1 + dx : 1 + dx + size]
    edge = flat_to_texel[np.flatnonzero((open_side & covered).reshape(-1))]
    close = cKDTree(point[edge]).query_pairs(2.0 * float(np.median(step)), output_type='ndarray')
    i, j = edge[close[:, 0]], edge[close[:, 1]]
    keep = island[i] != island[j]
    keep &= np.linalg.norm(point[i] - point[j], axis=1) <= 0.875 * (step[i] + step[j])
    shared = (welded[tri[i]][:, :, None] == welded[tri[j]][:, None, :]).any(axis=(1, 2))
    seam = np.stack([i, j], axis=1)[keep & shared]
    print(f'SEAMS {len(seam)} texel pairs face each other across UV seams')

    # --- Patches smaller than a fingertip, measured on the body -------------
    for round_ in range(10):
        grid_label = np.full(size * size, -1, dtype=np.int64)
        grid_label[texels] = label
        grid_label = grid_label.reshape(size, size)
        component = np.full(len(texels), -1, dtype=np.int64)
        total = 0
        for r in range(count):
            pieces, n = ndimage.label(grid_label == r, structure=EIGHT)
            flat = pieces.reshape(-1)[texels]
            mine = flat > 0
            component[mine] = flat[mine] - 1 + total
            total += n
        joined = seam[label[seam[:, 0]] == label[seam[:, 1]]]
        graph = coo_matrix(
            (np.ones(len(joined)), (component[joined[:, 0]], component[joined[:, 1]])), shape=(total, total)
        )
        _, patch_of = connected_components(graph, directed=False)
        patch = patch_of[component]
        sizes = np.bincount(patch)
        small = sizes[patch] < MIN_ISLAND
        if not small.any():
            print(f'ISLANDS none under {MIN_ISLAND} texels')
            break
        # Only a bigger neighbour gets a vote. Two specks side by side would
        # otherwise swap colours every round for ever; this way each merges
        # upward, and a cluster of specks ends as its largest member.
        votes = np.zeros((len(sizes), count), dtype=np.int64)
        for pairs in (grid8, grid8[:, ::-1], seam, seam[:, ::-1]):
            a, c = pairs[:, 0], pairs[:, 1]
            bigger = (sizes[patch[c]] > sizes[patch[a]]) | (
                (sizes[patch[c]] == sizes[patch[a]]) & (patch[c] > patch[a])
            )
            mask = small[a] & (label[a] != label[c]) & bigger
            np.add.at(votes, (patch[a[mask]], label[c[mask]]), 1)
        # A speck alone on a tiny UV island has no neighbour in the map, and
        # if its seam was missed it has none across one either. It asks the
        # skin around it instead: every texel within three texels, on the body.
        # Its own colour votes too: a speck the skin around it agrees with is
        # a piece of something larger whose seam was missed, and it stays.
        deaf = np.flatnonzero(small & (votes.sum(axis=1) == 0)[patch])
        if len(deaf):
            around = np.zeros_like(votes)
            near_all = cKDTree(point).query_ball_point(point[deaf], 3.0 * step[deaf])
            for texel, near in zip(deaf, near_all):
                near = np.asarray(near, dtype=np.int64)
                near = near[patch[near] != patch[texel]]
                np.add.at(around, (np.full(len(near), patch[texel]), label[near]), 1)
            mine = np.unique(patch[deaf])
            own = np.array([label[deaf][patch[deaf] == m][0] for m in mine])
            outvoted = (around[mine].sum(axis=1) > 0) & (around[mine].argmax(axis=1) != own)
            votes[mine[outvoted]] = around[mine[outvoted]]
        heard = votes.sum(axis=1) > 0
        change = small & heard[patch]
        print(
            f'ISLANDS round {round_ + 1}: {int((sizes < MIN_ISLAND).sum())} patches under '
            f'{MIN_ISLAND} texels, {int(change.sum())} texels given to their neighbours'
        )
        if not change.any():
            kept_small = np.unique(patch[small])
            print(f'ISLANDS {len(kept_small)} small patches agree with the skin around them and keep their paint')
            break
        label[change] = votes.argmax(axis=1)[patch[change]]

    # --- Distance to the edge of each texel's own region, on the body -------
    border = np.concatenate([grid4, seam])
    border = border[label[border[:, 0]] != label[border[:, 1]]]
    middle = (point[border[:, 0]] + point[border[:, 1]]) / 2
    distance = np.full(len(texels), regions.MAX_DISTANCE, dtype=np.float32)
    reach = float(np.percentile(step, 99)) * (regions.MAX_DISTANCE + 1)
    for r in range(count):
        mine = np.flatnonzero(label == r)
        involved = (label[border[:, 0]] == r) | (label[border[:, 1]] == r)
        if len(mine) == 0 or not involved.any():
            continue
        d, _ = cKDTree(middle[involved]).query(point[mine], distance_upper_bound=reach)
        distance[mine] = np.minimum(d / step[mine], regions.MAX_DISTANCE)

    ids = np.full((size, size), regions.EMPTY, dtype=np.int16)
    dist = np.zeros((size, size), dtype=np.float32)
    ids.reshape(-1)[texels] = label
    dist.reshape(-1)[texels] = distance
    regions.dilate(ids, dist, DILATE)
    png = regions.png_bytes(regions.encode(ids, dist))

    # --- Cut the parts from the paint ----------------------------------------
    votes = np.zeros((int(body['weld'].max()) + 1, count), dtype=np.int64)
    cell = np.floor(uv * size).astype(np.int64)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            found = ids[np.clip(cell[:, 1] + dy, 0, size - 1), np.clip(cell[:, 0] + dx, 0, size - 1)]
            hit = found != regions.EMPTY
            np.add.at(votes, (body['weld'][hit], found[hit]), 1)
    corner = votes.argmax(axis=1)[welded]
    a, b, c = corner[:, 0], corner[:, 1], corner[:, 2]
    face = np.where(b == c, b, a)
    three = (a != b) & (b != c) & (a != c)
    # Three different answers: the triangle's own texels decide, or its middle.
    own = np.zeros((len(tris), count), dtype=np.int64)
    np.add.at(own, (tri, label), 1)
    has_own = own.sum(axis=1) > 0
    middle_uv = np.clip(np.floor(uv[tris].mean(axis=1) * size).astype(np.int64), 0, size - 1)
    face = np.where(three, np.where(has_own, own.argmax(axis=1), ids[middle_uv[:, 1], middle_uv[:, 0]]), face)
    agree = (face == own.argmax(axis=1))[has_own].mean()
    print(f'CUT {int(three.sum())} triangles had three answers; {agree * 100:.1f}% of triangles match the map under them')

    parts = []
    for name in body['node_names']:
        mine = tris[face == names.index(name)]
        assert len(mine), f'{name} has no triangles left after the repaint'
        records, local = np.unique(mine.reshape(-1), return_inverse=True)
        parts.append(
            {
                'position': position[records],
                'normal': body['normal'][records],
                'uv': uv[records],
                'indices': local.reshape(-1),
            }
        )

    write_glb(out_path, body['node_names'], parts)
    regions.embed(out_path, png, names, size)
    stem = os.path.splitext(out_path)[0]
    with open(stem + '_regions.png', 'wb') as fh:
        fh.write(png)

    # --- What changed ---------------------------------------------------------
    old = region_image(body['gltf'], body['binary'])[..., 0].astype(np.int64)
    old_grid = np.where(old == 255, -1, np.round(old / extras['idStep'])).astype(np.int64)
    old_label = old_grid.reshape(-1)[texels]
    region_of_part = np.array([names.index(name) for name in body['node_names']])
    old_tris = np.bincount(region_of_part[body['tri_part']], minlength=count)
    new_tris = np.bincount(face, minlength=count)
    report = []
    print(f'\n{"region":34} {"old texels":>10} {"new texels":>10} {"change":>7} {"old tris":>8} {"new tris":>8}')
    for r, name in enumerate(names):
        before, after = int((old_label == r).sum()), int((label == r).sum())
        report.append(
            {
                'name': name,
                'old_texels': before,
                'new_texels': after,
                'old_triangles': int(old_tris[r]),
                'new_triangles': int(new_tris[r]),
            }
        )
        change = f'{(after - before) / before * 100:+.0f}%' if before else 'new'
        print(f'{name:34} {before:>10} {after:>10} {change:>7} {old_tris[r]:>8} {new_tris[r]:>8}')
    kept = float((old_label == label).mean())
    print(f'\n{kept * 100:.1f}% of the texels on the body keep their region')
    with open(stem + '_report.json', 'w', encoding='utf-8') as fh:
        json.dump({'regions': report, 'unchanged_share': kept}, fh, indent=1)

    # Flat-colour pictures of both maps for `render-map.py`: every region in
    # its palette colour, the left side a shade darker so the split shows.
    shade = np.array([0.72 if name.endswith('_l') else 1.0 for name in names])
    by_region = np.zeros((count, 3))
    for s in range(len(slugs)):
        for side in (0, 1):
            if sided[s, side] >= 0:
                by_region[sided[s, side]] = colours[s] * shade[sided[s, side]]
    for tag, grid in (('new', ids.astype(np.int64)), ('old', old_grid)):
        view = np.zeros((size, size, 3), dtype=np.uint8)
        valid = grid >= 0
        view[valid] = by_region[grid[valid]].astype(np.uint8)
        Image.fromarray(view).save(f'{stem}_view_{tag}.png')
    print('WROTE', out_path)


if __name__ == '__main__':
    main()
