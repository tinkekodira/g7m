"""The muscle regions as a map in UV space: smooth borders, drawn by the GPU.

Imported by `split.py`. numpy only, so it runs in Blender's own Python.

## Why a map, and not the pieces

The pieces `split.py` cuts are whole triangles, so a highlight drawn by
colouring a piece has an edge that follows the triangulation: a zig-zag along a
decimated mesh, and every finger of the nearest-muscle labelling reproduced
exactly. No amount of vertex smoothing makes a triangle edge a curve.

So the border is moved off the mesh. Each label is spread into a smooth field
over the surface, a point belongs to whichever field is strongest there, and
the border — where the two strongest are equal — is found inside each triangle
rather than along its edges. That border is written into a texture as a
**signed distance**, which is the one encoding that survives magnification: a
GPU interpolating distances between texels puts the edge between them, where a
GPU interpolating region numbers can only put it on a texel boundary.

## The encoding

One RGB PNG, square, no alpha and no colour chunks, so what the browser decodes
is exactly what was written:

- **Red** is the region, as `index * ID_STEP`. Spaced out so a platform that
  nudges a decoded byte by one still rounds to the right muscle.
- **Green** is the distance from the texel's centre to the edge of its own
  region, in texels, scaled so 255 means `MAX_DISTANCE` or further.
- Texels outside every UV island are filled from their neighbours, so the
  four texels the shader reads around a point near an island's edge are never
  empty.
"""

import json
import struct
import zlib

import numpy as np

ID_STEP = 3
MAX_DISTANCE = 8.0
EMPTY = -1


def read_obj(path: str) -> tuple[np.ndarray, np.ndarray]:
    positions: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    with open(path, encoding='utf-8') as fh:
        for line in fh:
            if line.startswith('v '):
                _, x, y, z = line.split()
                positions.append((float(x), float(y), float(z)))
            elif line.startswith('f '):
                faces.append(tuple(int(p.split('/')[0]) - 1 for p in line.split()[1:]))
    return np.array(positions, dtype=np.float64), np.array(faces, dtype=np.int64)


def smooth_fields(
    verts: np.ndarray, tris: np.ndarray, labels: np.ndarray, count: int, rounds: int
) -> np.ndarray:
    """One field per label, spread over the surface by repeated averaging.

    Starts as one-hot — 1 on the label's own vertices, 0 elsewhere — and each
    round moves every vertex halfway towards the weighted mean of its
    neighbours. Taking the strongest field at each point then gives regions
    whose borders have been smoothed the way a soap film smooths a wire:
    spikes and single-vertex fingers lose to the region around them, and a
    ragged edge becomes a curve.

    Along the surface, not through space, so an inner thigh cannot borrow from
    the other one and a hand cannot borrow from the hip it hangs beside.

    **Cotangent weights, not equal ones.** The mesh is decimated, so its
    triangles are every shape and size. Averaging neighbours equally smooths
    the fields as a graph, not as a surface: a field that is smooth on the
    body is not left alone by it, and the borders came out zig-zagging from
    one triangle to the next however many rounds were run. Cotangent weights
    leave a linear field exactly where it is, which is the property that
    matters — measured on the fitted body, it halved how sharply the borders
    turn at each triangle, and more rounds of equal weights did not move it.
    Negative weights (obtuse corners) are clamped to a sliver of positive,
    which keeps every round an average and so keeps it stable.
    """
    fields = np.zeros((len(labels), count), dtype=np.float32)
    fields[np.arange(len(labels)), labels] = 1.0
    return diffuse(verts, tris, fields, rounds)


def diffuse(verts: np.ndarray, tris: np.ndarray, fields: np.ndarray, rounds: int) -> np.ndarray:
    """`rounds` of cotangent-weighted averaging, a few labels at a time.

    A few at a time because each round gathers every field along every edge,
    which for the subdivided body is gigabytes if done in one go.
    """
    vertices = len(fields)
    a, b, c = verts[tris[:, 0]], verts[tris[:, 1]], verts[tris[:, 2]]

    def cot(p: np.ndarray, q: np.ndarray, r: np.ndarray) -> np.ndarray:
        u, v = q - p, r - p
        return (u * v).sum(axis=1) / (np.linalg.norm(np.cross(u, v), axis=1) + 1e-12)

    # Each edge is weighted by the cotangents of the corners facing it.
    src = np.concatenate([tris[:, 1], tris[:, 2], tris[:, 0]])
    dst = np.concatenate([tris[:, 2], tris[:, 0], tris[:, 1]])
    weight = 0.5 * np.concatenate([cot(a, b, c), cot(b, c, a), cot(c, a, b)])
    src, dst = np.concatenate([src, dst]), np.concatenate([dst, src])
    weight = np.concatenate([weight, weight])
    weight = np.maximum(weight, 1e-3).astype(np.float32)

    order = np.argsort(src, kind='stable')
    src, dst, weight = src[order], dst[order], weight[order]
    degree = np.bincount(src, minlength=vertices)
    assert (degree > 0).all(), 'a vertex with no neighbours cannot be smoothed'
    starts = np.concatenate([[0], np.cumsum(degree)[:-1]])
    inverse = (1.0 / np.add.reduceat(weight, starts))[:, None]

    out = fields.astype(np.float32, copy=True)
    for first in range(0, out.shape[1], 8):
        chunk = out[:, first : first + 8]
        for _ in range(rounds):
            mean = np.add.reduceat(chunk[dst] * weight[:, None], starts, axis=0) * inverse
            chunk = 0.5 * chunk + 0.5 * mean
        out[:, first : first + 8] = chunk
    return out


def refine(
    verts: np.ndarray, tris: np.ndarray, uv: np.ndarray, fields: np.ndarray, rounds: int
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """The same body split once more, for drawing the map and nothing else.

    Inside a triangle the border is straight, so on the fitted body it is a
    chain of 7 mm segments, and zoomed in on a phone the corners between them
    show. Every triangle is cut into four, the fields carried onto the new
    corners, and a few more rounds of smoothing run at that scale — which
    rounds the corners off without moving the border anywhere else. The
    geometry that ships is not touched; only the map gains the detail.

    Returns the finer triangles, their per-corner UVs, and the fields on
    their vertices.
    """
    edges = np.sort(np.concatenate([tris[:, [0, 1]], tris[:, [1, 2]], tris[:, [2, 0]]]), axis=1)
    unique, inverse = np.unique(edges, axis=0, return_inverse=True)
    inverse = inverse.reshape(-1)
    mid = len(verts) + inverse.reshape(3, -1).T  # (triangles, 3): ab, bc, ca

    fine_verts = np.concatenate([verts, (verts[unique[:, 0]] + verts[unique[:, 1]]) / 2])
    fine_fields = np.concatenate([fields, (fields[unique[:, 0]] + fields[unique[:, 1]]) / 2])

    a, b, c = tris[:, 0], tris[:, 1], tris[:, 2]
    ab, bc, ca = mid[:, 0], mid[:, 1], mid[:, 2]
    fine_tris = np.concatenate(
        [
            np.stack([a, ab, ca], axis=1),
            np.stack([ab, b, bc], axis=1),
            np.stack([ca, bc, c], axis=1),
            np.stack([ab, bc, ca], axis=1),
        ]
    )

    # Per corner, not per vertex: a UV seam gives one vertex two UVs, so the
    # midpoints are taken within each triangle.
    ua, ub, uc = uv[:, 0], uv[:, 1], uv[:, 2]
    uab, ubc, uca = (ua + ub) / 2, (ub + uc) / 2, (uc + ua) / 2
    fine_uv = np.concatenate(
        [
            np.stack([ua, uab, uca], axis=1),
            np.stack([uab, ub, ubc], axis=1),
            np.stack([uca, ubc, uc], axis=1),
            np.stack([uab, ubc, uca], axis=1),
        ]
    )

    return fine_tris, fine_uv, diffuse(fine_verts, fine_tris, fine_fields, rounds)


def face_regions(fields: np.ndarray, tris: np.ndarray) -> np.ndarray:
    """Each triangle goes to the region strongest at its centre.

    This is what a tap lands on — the pieces are still cut from whole
    triangles — so it agrees with the map everywhere except within one
    triangle of a border, which is smaller than a fingertip.
    """
    centre = fields[tris[:, 0]] + fields[tris[:, 1]] + fields[tris[:, 2]]
    return np.argmax(centre, axis=1)


def rasterize(
    uv: np.ndarray,
    tris: np.ndarray,
    fields: np.ndarray,
    size: int,
    candidates: int = 6,
    batch: int = 4096,
) -> tuple[np.ndarray, np.ndarray]:
    """The region and the distance to its edge, for every texel.

    `uv` is per corner, `(triangles, 3, 2)`, in glTF's convention — v runs
    down the image — so row 0 of the result is the top row of the PNG and the
    shader can fetch texels without flipping anything.

    Inside a triangle every field is linear, so the margin between the owning
    region and any other is linear too, and its zero line is the border. The
    distance to it is the margin divided by the margin's gradient, in texels.
    That is exact inside the triangle and a close estimate a few texels beyond,
    which is as far as the shader ever looks.

    Two passes over each triangle. The first writes every texel whose centre
    it covers. The second **splats**: the texels around its corners, edge
    midpoints and centre, wherever the first pass left them empty. Without it
    a triangle smaller than a texel — and Smart UV Project leaves hundreds of
    islands that small — covers no centre at all, the shader reads four empty
    texels there, and a highlighted muscle shows a pinprick of bare skin.
    """
    ids = np.full((size, size), EMPTY, dtype=np.int16)
    dist = np.zeros((size, size), dtype=np.float32)
    exact = np.zeros((size, size), dtype=bool)

    for start in range(0, len(tris), batch):
        tri = tris[start : start + batch]
        values = fields[tri]  # (n, 3, labels)
        # The few labels present at any corner: the rest are zero everywhere
        # on this triangle and can neither own it nor border it.
        cand = np.argsort(-values.max(axis=1), axis=1)[:, :candidates]
        cv = np.take_along_axis(values, np.repeat(cand[:, None, :], 3, axis=1), axis=2)

        corners = uv[start : start + batch].astype(np.float64) * size
        e1 = corners[:, 1] - corners[:, 0]
        e2 = corners[:, 2] - corners[:, 0]
        det = e1[:, 0] * e2[:, 1] - e1[:, 1] * e2[:, 0]
        usable = np.abs(det) > 1e-12
        det = np.where(usable, det, 1.0)

        # Each candidate's gradient in texel space: constant over the triangle.
        # A triangle with no area in UV space has none, and stands for its
        # own average instead.
        da1 = cv[:, 1] - cv[:, 0]
        da2 = cv[:, 2] - cv[:, 0]
        gx = np.where(usable[:, None], (e2[:, 1, None] * da1 - e1[:, 1, None] * da2) / det[:, None], 0)
        gy = np.where(usable[:, None], (e1[:, 0, None] * da2 - e2[:, 0, None] * da1) / det[:, None], 0)
        base = np.where(usable[:, None], cv[:, 0], cv.mean(axis=1))
        peak = cv.max(axis=1)

        def evaluate(owner: np.ndarray, px: np.ndarray, py: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
            """The owning label and the distance to its edge at these texel centres."""
            dx = px + 0.5 - corners[owner, 0, 0]
            dy = py + 0.5 - corners[owner, 0, 1]
            value = base[owner] + gx[owner] * dx[:, None] + gy[owner] * dy[:, None]
            own = np.argmax(value, axis=1)
            rows = np.arange(len(owner))
            margin = value[rows, own][:, None] - value
            mx = gx[owner][rows, own][:, None] - gx[owner]
            my = gy[owner][rows, own][:, None] - gy[owner]
            slope = np.sqrt(mx * mx + my * my)
            with np.errstate(divide='ignore', invalid='ignore'):
                distance = np.where(slope > 1e-12, margin / slope, np.inf)
            distance[rows, own] = np.inf
            # A padding candidate — zero at every corner — borders nothing.
            distance[peak[owner] <= 0] = np.inf
            return cand[owner, own], np.minimum(distance.min(axis=1), MAX_DISTANCE)

        # Texel centres sit at i + 0.5.
        x0 = np.ceil(corners[:, :, 0].min(axis=1) - 0.5).astype(np.int64)
        x1 = np.floor(corners[:, :, 0].max(axis=1) - 0.5).astype(np.int64)
        y0 = np.ceil(corners[:, :, 1].min(axis=1) - 0.5).astype(np.int64)
        y1 = np.floor(corners[:, :, 1].max(axis=1) - 0.5).astype(np.int64)
        width = np.maximum(x1 - x0 + 1, 0)
        height = np.maximum(y1 - y0 + 1, 0)
        count = np.where(usable, width * height, 0)

        # Pass one: the texels whose centres the triangle covers.
        if count.sum() > 0:
            owner = np.repeat(np.arange(len(tri)), count)
            local = np.arange(count.sum()) - np.repeat(np.cumsum(count) - count, count)
            px = x0[owner] + local % width[owner]
            py = y0[owner] + local // width[owner]
            dx = px + 0.5 - corners[owner, 0, 0]
            dy = py + 0.5 - corners[owner, 0, 1]
            b1 = (dx * e2[owner, 1] - dy * e2[owner, 0]) / det[owner]
            b2 = (e1[owner, 0] * dy - e1[owner, 1] * dx) / det[owner]
            eps = -1e-6
            inside = (b1 >= eps) & (b2 >= eps) & (1 - b1 - b2 >= eps)
            inside &= (px >= 0) & (px < size) & (py >= 0) & (py < size)
            owner, px, py = owner[inside], px[inside], py[inside]
            ids[py, px], dist[py, px] = evaluate(owner, px, py)
            exact[py, px] = True

        # Pass two: the four texels around each of seven points on the
        # triangle, where nothing exact has been written. Those are the texels
        # the shader reads anywhere on it.
        points = np.concatenate(
            [
                corners,
                (corners + np.roll(corners, -1, axis=1)) / 2,
                corners.mean(axis=1, keepdims=True),
            ],
            axis=1,
        )  # (n, 7, 2)
        cells = np.floor(points - 0.5).astype(np.int64)
        owner = np.repeat(np.arange(len(tri)), 7 * 4)
        offsets = np.array([[0, 0], [1, 0], [0, 1], [1, 1]])
        texels = (cells[:, :, None, :] + offsets[None, None]).reshape(-1, 2)
        px, py = texels[:, 0], texels[:, 1]
        keep = (px >= 0) & (px < size) & (py >= 0) & (py < size)
        owner, px, py = owner[keep], px[keep], py[keep]
        keep = ~exact[py, px]
        owner, px, py = owner[keep], px[keep], py[keep]
        if len(owner):
            ids[py, px], dist[py, px] = evaluate(owner, px, py)

    return ids, dist


def dilate(ids: np.ndarray, dist: np.ndarray, passes: int) -> None:
    """Fill the gutters between islands from their edges, in place."""
    for _ in range(passes):
        empty = ids == EMPTY
        if not empty.any():
            return
        for axis, step in ((0, 1), (0, -1), (1, 1), (1, -1)):
            near_ids = np.roll(ids, step, axis=axis)
            near_dist = np.roll(dist, step, axis=axis)
            take = empty & (ids == EMPTY) & (near_ids != EMPTY)
            ids[take] = near_ids[take]
            dist[take] = near_dist[take]


def encode(ids: np.ndarray, dist: np.ndarray) -> np.ndarray:
    assert ids.max() * ID_STEP < 255, 'too many regions for the red channel'
    rgb = np.zeros(ids.shape + (3,), dtype=np.uint8)
    rgb[..., 0] = np.where(ids == EMPTY, 255, ids * ID_STEP)
    rgb[..., 1] = np.round(np.clip(dist / MAX_DISTANCE, 0, 1) * 255)
    return rgb


def png_bytes(rgb: np.ndarray) -> bytes:
    """An RGB PNG with nothing in it but pixels.

    Written by hand rather than through Blender's image API, which would put
    the values through colour management on the way out. No gAMA, sRGB or iCCP
    chunk either, so no browser has a colour space to convert from.
    """
    height, width, _ = rgb.shape
    # Filter type 1 (Sub) per row: long runs of one region become runs of
    # zeros, which is what zlib is good at.
    diff = rgb.astype(np.int16)
    diff[:, 1:] -= rgb[:, :-1]
    filtered = (diff % 256).astype(np.uint8).reshape(height, width * 3)
    raw = np.hstack([np.ones((height, 1), dtype=np.uint8), filtered]).tobytes()

    def chunk(kind: bytes, body: bytes) -> bytes:
        return struct.pack('>I', len(body)) + kind + body + struct.pack('>I', zlib.crc32(kind + body))

    header = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    return (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', header)
        + chunk(b'IDAT', zlib.compress(raw, 9))
        + chunk(b'IEND', b'')
    )


def embed(glb_path: str, png: bytes, names: list[str], size: int) -> None:
    """Put the map inside the GLB, and say what its numbers mean.

    Inside rather than beside it, because the two are one object: a map is
    only meaningful against the UVs it was drawn on. One file means one
    content hash, one download and one cache entry, and a rebuilt model can
    never arrive with the previous model's map.

    The image is referenced by no material — the viewer draws the highlight
    itself — so it is found through the scene's extras, which three.js hands
    over as `scene.userData`.
    """
    data = open(glb_path, 'rb').read()
    magic, version, _ = struct.unpack_from('<III', data, 0)
    assert magic == 0x46546C67 and version == 2, 'not a GLB'
    json_length, json_type = struct.unpack_from('<II', data, 12)
    assert json_type == 0x4E4F534A
    gltf = json.loads(data[20 : 20 + json_length])
    offset = 20 + json_length
    bin_length, bin_type = struct.unpack_from('<II', data, offset)
    assert bin_type == 0x004E4942
    binary = bytearray(data[offset + 8 : offset + 8 + bin_length])

    while len(binary) % 4:
        binary.append(0)
    views = gltf.setdefault('bufferViews', [])
    views.append({'buffer': 0, 'byteOffset': len(binary), 'byteLength': len(png)})
    binary += png
    while len(binary) % 4:
        binary.append(0)
    gltf['buffers'][0]['byteLength'] = len(binary)

    images = gltf.setdefault('images', [])
    images.append({'bufferView': len(views) - 1, 'mimeType': 'image/png', 'name': 'g7m-regions'})
    scene = gltf['scenes'][gltf.get('scene', 0)]
    scene.setdefault('extras', {})['g7mRegions'] = {
        'image': len(images) - 1,
        'size': size,
        'idStep': ID_STEP,
        'maxDistance': MAX_DISTANCE,
        'names': names,
    }

    text = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    text += b' ' * (-len(text) % 4)
    total = 12 + 8 + len(text) + 8 + len(binary)
    with open(glb_path, 'wb') as fh:
        fh.write(struct.pack('<III', 0x46546C67, 2, total))
        fh.write(struct.pack('<II', len(text), 0x4E4F534A))
        fh.write(text)
        fh.write(struct.pack('<II', len(binary), 0x004E4942))
        fh.write(binary)
