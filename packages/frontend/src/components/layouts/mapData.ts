import { isPostCoordinates, type PostSummaryDto } from '@uit-volunteer-map/shared';

export function getMapPosts(posts: PostSummaryDto[], campaignId: number) {
  return posts.filter(post => post.team.campaignId === campaignId && isPostCoordinates(post.coordinates));
}

function isRing(value: unknown): boolean {
  if (!Array.isArray(value) || value.length < 4) return false;
  const valid = value.every(point => Array.isArray(point) && point.length >= 2
    && isPostCoordinates({ latitude: point[1], longitude: point[0] }));
  return valid && JSON.stringify(value[0]) === JSON.stringify(value.at(-1));
}

function isBoundary(value: unknown): value is GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<GeoJSON.FeatureCollection>;
  return data.type === 'FeatureCollection' && Array.isArray(data.features) && data.features.length > 0
    && data.features.every(feature => {
      if (feature.type !== 'Feature' || !feature.geometry) return false;
      const geometry = feature.geometry;
      const polygons = geometry.type === 'Polygon' ? [geometry.coordinates]
        : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
      return polygons.length > 0 && polygons.every(polygon => Array.isArray(polygon) && polygon.length > 0 && polygon.every(isRing));
    });
}

export async function loadMapBoundary(signal: AbortSignal) {
  const response = await fetch('/data/index.json', { signal });
  if (!response.ok) throw Error('Map manifest unavailable');
  const manifest = await response.json();
  const file = Array.isArray(manifest.files) ? manifest.files.find((item: { kind?: string }) => item.kind === 'boundary') : undefined;
  if (manifest.version !== 1 || !manifest.source?.licenseUrl || file?.path !== 'data/vietnam-outline.geojson'
    || !/^[a-f0-9]{64}$/.test(file.sha256)) throw Error('Invalid map manifest');
  const boundary = await fetch(`/${file.path}`, { signal });
  if (!boundary.ok) throw Error('Map boundary unavailable');
  const bytes = await boundary.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  if (hash !== file.sha256) throw Error('Map boundary checksum mismatch');
  const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!isBoundary(data)) throw Error('Invalid map polygon');
  return data;
}
