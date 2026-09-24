/**
 * The sculpted body's muscles as a map in UV space, and the material that
 * draws a highlight from it.
 *
 * ## Why the highlight stopped being the pieces
 *
 * The sculpt is one welded skin, cut into a piece per muscle by labelling its
 * vertices (ADR-0044). A piece is whole triangles, so colouring a piece drew
 * an edge that followed the triangulation — a zig-zag, with every stray finger
 * of the labelling reproduced exactly, which is what a tap on the chest showed.
 *
 * `tools/regions.py` smooths the labels into regions whose borders run through
 * triangles rather than along them, and paints those into a texture that ships
 * inside the GLB. The pieces are still cut and still named by muscle, so a tap
 * resolves exactly as before. Only the colour comes from the map.
 *
 * ## What the texture holds
 *
 * Red is the region, as `index × idStep`; green is the distance from the
 * texel's centre to the edge of its own region, in texels. A distance, not a
 * mask, because interpolating distances between texels puts the edge *between*
 * them — the trick signed-distance text uses — so the border stays a curve
 * when the figure is zoomed until a texel covers several pixels. A mask can
 * only put it on a texel boundary, which is a staircase.
 *
 * The shader reads the four texels around a point itself, with `texelFetch`,
 * rather than letting the GPU filter: filtering would blend region numbers,
 * and the average of the pec and the deltoid is some third muscle.
 */
import {
  Color,
  DataTexture,
  FloatType,
  MeshStandardMaterial,
  NearestFilter,
  NoColorSpace,
  RGBAFormat,
  Texture,
} from 'three';

export interface RegionMap {
  /** The decoded PNG: anything WebGL can upload. */
  readonly image: object;
  readonly size: number;
  /** Red holds `index × idStep`, so a byte nudged by one still rounds home. */
  readonly idStep: number;
  /** Green's 255, in texels. */
  readonly maxDistance: number;
  /** Node name to region index. */
  readonly regions: ReadonlyMap<string, number>;
}

/** Where a body part is in the map. */
export interface PartRegion {
  readonly map: RegionMap;
  readonly index: number;
}

/** Room in the colour table. Red is one byte, so the ids stop well short. */
const TABLE_SIZE = 256;

export interface RegionExtras {
  readonly image: number;
  readonly size: number;
  readonly idStep: number;
  readonly maxDistance: number;
  readonly names: readonly string[];
}

/**
 * What `regions.py` wrote into the scene's extras, or null for a model that
 * has no map — which is every model built before this existed, and must keep
 * working exactly as it did.
 */
export function parseRegionExtras(value: unknown): RegionExtras | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  const { image, size, idStep, maxDistance, names } = record;
  if (
    typeof image !== 'number' ||
    typeof size !== 'number' ||
    typeof idStep !== 'number' ||
    typeof maxDistance !== 'number' ||
    !Array.isArray(names) ||
    !names.every((name) => typeof name === 'string')
  ) {
    return null;
  }
  if (idStep < 1 || names.length * idStep > 255 || size < 1 || maxDistance <= 0) return null;
  return { image, size, idStep, maxDistance, names: names };
}

/**
 * Which image in the GLB is the map, and what its numbers mean.
 *
 * Read by `loadBodyParts`, which owns fetching and decoding; kept here, with
 * the rest of what the map is, so the format is described in one place.
 */
export function regionMapFrom(extras: RegionExtras, image: object): RegionMap {
  return {
    image,
    size: extras.size,
    idStep: extras.idStep,
    maxDistance: extras.maxDistance,
    regions: new Map(extras.names.map((name, index) => [name.toLowerCase(), index])),
  };
}

/** One region's look: its colour, and how much of that colour it glows. */
export interface RegionLook {
  readonly color: string;
  readonly glow: number;
}

export interface RegionMaterial {
  readonly material: MeshStandardMaterial;
  /** Every region's look at once; anything unnamed takes `rest`. */
  readonly paint: (looks: ReadonlyMap<number, RegionLook>, rest: string) => void;
  readonly dispose: () => void;
}

/**
 * The body's material, reading its colour from the map.
 *
 * The same `MeshStandardMaterial` every part used before — same roughness,
 * same metalness, same lights — with two lines of it replaced: where the
 * diffuse colour comes from, and where the emissive does. Everything that
 * makes the skin look like skin is untouched.
 *
 * One instance for the whole body, shared by every part, because the colour
 * no longer belongs to the part: a highlight's edge crosses into its
 * neighbour's triangles, and the neighbour has to draw that sliver in the
 * highlight's colour.
 */
export function createRegionMaterial(map: RegionMap): RegionMaterial {
  const regions = new Texture(map.image);
  // The bytes are data, not colour. Left to its defaults this texture would be
  // flipped, filtered, mipmapped and converted from sRGB — any one of which
  // turns region 12 into region 11.
  regions.flipY = false;
  regions.colorSpace = NoColorSpace;
  regions.magFilter = NearestFilter;
  regions.minFilter = NearestFilter;
  regions.generateMipmaps = false;
  regions.needsUpdate = true;

  // Linear floats, so a colour arrives in the shader exactly as `new Color`
  // makes it for a vertex colour, and the accent is the accent.
  const table = new Float32Array(TABLE_SIZE * 4);
  const colours = new DataTexture(table, TABLE_SIZE, 1, RGBAFormat, FloatType);
  colours.magFilter = NearestFilter;
  colours.minFilter = NearestFilter;
  colours.needsUpdate = true;

  const material = new MeshStandardMaterial({ roughness: 0.52, metalness: 0.02 });
  material.customProgramCacheKey = () => 'g7m-regions';
  material.onBeforeCompile = (shader) => {
    shader.uniforms['g7mRegions'] = { value: regions };
    shader.uniforms['g7mColours'] = { value: colours };
    shader.uniforms['g7mIdScale'] = { value: 255 / map.idStep };
    shader.uniforms['g7mMaxDistance'] = { value: map.maxDistance };

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vG7mUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n\tvG7mUv = uv;');

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${REGION_GLSL}`)
      .replace(
        '#include <color_fragment>',
        [
          '#include <color_fragment>',
          '\tvec4 g7mLook = g7mRegionLook( vG7mUv );',
          '\tdiffuseColor.rgb = g7mLook.rgb;',
          '\ttotalEmissiveRadiance = g7mLook.rgb * g7mLook.a;',
        ].join('\n'),
      );
  };

  const scratch = new Color();
  const paint = (looks: ReadonlyMap<number, RegionLook>, rest: string) => {
    scratch.set(rest);
    for (let i = 0; i < TABLE_SIZE; i += 1) {
      table.set([scratch.r, scratch.g, scratch.b, 0], i * 4);
    }
    for (const [index, look] of looks) {
      if (index < 0 || index >= TABLE_SIZE) continue;
      scratch.set(look.color);
      table.set([scratch.r, scratch.g, scratch.b, look.glow], index * 4);
    }
    colours.needsUpdate = true;
  };

  return {
    material,
    paint,
    dispose: () => {
      material.dispose();
      regions.dispose();
      colours.dispose();
    },
  };
}

/**
 * The colour at a point, antialiased across region edges.
 *
 * For each distinct region among the four texels around the point, the
 * signed distance to that region's edge is interpolated from all four — plus
 * where the texel is inside it, minus where it is not — and turned into how
 * much of this pixel the region covers. The width of that ramp is one screen
 * pixel measured in texels, from `fwidth`, so the edge is equally crisp from
 * across the room and nose to the glass, and is never blurred further in.
 *
 * `fwidth` is taken of the texel coordinate rather than of each distance so it
 * is evaluated once, in uniform control flow, and means the same thing for
 * every region the loop visits.
 */
const REGION_GLSL = /* glsl */ `
uniform sampler2D g7mRegions;
uniform sampler2D g7mColours;
uniform float g7mIdScale;
uniform float g7mMaxDistance;
varying vec2 vG7mUv;

int g7mRegionId( vec4 texel ) {
	return int( floor( texel.r * g7mIdScale + 0.5 ) );
}

vec4 g7mRegionLook( vec2 uv ) {
	ivec2 size = textureSize( g7mRegions, 0 );
	vec2 t = uv * vec2( size ) - 0.5;
	float ramp = max( 0.5 * length( fwidth( t ) ), 1e-3 );

	vec2 cell = floor( t );
	vec2 f = t - cell;
	ivec2 c = ivec2( cell );
	ivec2 top = size - 1;
	vec4 s0 = texelFetch( g7mRegions, clamp( c, ivec2( 0 ), top ), 0 );
	vec4 s1 = texelFetch( g7mRegions, clamp( c + ivec2( 1, 0 ), ivec2( 0 ), top ), 0 );
	vec4 s2 = texelFetch( g7mRegions, clamp( c + ivec2( 0, 1 ), ivec2( 0 ), top ), 0 );
	vec4 s3 = texelFetch( g7mRegions, clamp( c + ivec2( 1, 1 ), ivec2( 0 ), top ), 0 );

	int id[ 4 ] = int[ 4 ]( g7mRegionId( s0 ), g7mRegionId( s1 ), g7mRegionId( s2 ), g7mRegionId( s3 ) );
	float d[ 4 ] = float[ 4 ]( s0.g, s1.g, s2.g, s3.g );
	float w[ 4 ] = float[ 4 ]( ( 1.0 - f.x ) * ( 1.0 - f.y ), f.x * ( 1.0 - f.y ), ( 1.0 - f.x ) * f.y, f.x * f.y );

	vec3 colour = vec3( 0.0 );
	float glow = 0.0;
	float total = 0.0;
	for ( int k = 0; k < 4; k ++ ) {
		bool seen = false;
		for ( int j = 0; j < k; j ++ ) seen = seen || id[ j ] == id[ k ];
		if ( seen ) continue;

		float s = 0.0;
		for ( int j = 0; j < 4; j ++ ) s += w[ j ] * ( id[ j ] == id[ k ] ? d[ j ] : - d[ j ] );
		float cover = smoothstep( - ramp, ramp, s * g7mMaxDistance );

		vec4 look = texelFetch( g7mColours, ivec2( id[ k ], 0 ), 0 );
		colour += cover * look.rgb;
		glow += cover * look.a;
		total += cover;
	}

	if ( total < 1e-4 ) return texelFetch( g7mColours, ivec2( id[ 0 ], 0 ), 0 );
	return vec4( colour / total, glow / total );
}
`;
