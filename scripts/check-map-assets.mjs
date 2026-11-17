import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicRoot = resolve(process.argv[2] ?? fileURLToPath(new URL('../packages/frontend/public/', import.meta.url)));
const manifest = JSON.parse(await readFile(resolve(publicRoot, 'data/index.json'), 'utf8'));
if (manifest.version !== 1 || !manifest.source?.url || !manifest.source?.licenseUrl || manifest.source.license !== 'Public domain') throw Error('Missing map provenance');
if (!Array.isArray(manifest.files) || manifest.files.length !== 3 || manifest.files.filter(file => file.kind === 'boundary').length !== 1) throw Error('Unexpected minimal map manifest');
const required = new Set(['data/vietnam-outline.geojson', 'map-element/map-pin-flower.svg', 'map-element/map-frame-01.svg']);
for (const file of manifest.files) {
  const target = resolve(publicRoot, file.path);
  if (!required.delete(file.path) || relative(publicRoot, target).startsWith('..')) throw Error('Unexpected map path');
  const bytes = await readFile(target);
  if (createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw Error(`Checksum mismatch: ${file.path}`);
  if (file.kind === 'boundary') {
    const data = JSON.parse(bytes);
    if (data.type !== 'FeatureCollection' || data.features.length !== 1) throw Error('Invalid boundary collection');
    const geometry = data.features[0].geometry;
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
    if (!polygons.length) throw Error('Missing polygon geometry');
    for (const polygon of polygons) for (const ring of polygon) {
      if (ring.length < 4 || JSON.stringify(ring[0]) !== JSON.stringify(ring.at(-1))) throw Error('Unclosed boundary ring');
      for (const [lng, lat] of ring) if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) throw Error('Invalid boundary coordinates');
    }
  }
}
if (required.size) throw Error('Missing required map asset');
console.log('Map assets: 3 files, hashes, polygon coordinates and provenance verified.');
