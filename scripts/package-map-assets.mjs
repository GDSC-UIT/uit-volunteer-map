import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const publicRoot = new URL('packages/frontend/public/', root);
const sourceUrl = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson';
const sourceHash = '6866c877d39cba9c357620878839b336d569f8c662d3cfab4cb1dbe2d39c977f';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceArg = process.argv.indexOf('--source');
let bytes;
if (sourceArg >= 0) {
  if (!process.argv[sourceArg + 1]) throw Error('--source requires a file path');
  bytes = await readFile(process.argv[sourceArg + 1]);
} else {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw Error(`Source download failed: ${response.status}`);
  bytes = Buffer.from(await response.arrayBuffer());
}
if (hash(bytes) !== sourceHash) throw Error('Natural Earth source checksum mismatch');
const selected = JSON.parse(bytes).features.filter(feature => feature.properties.ADM0_A3 === 'VNM');
if (selected.length !== 1) throw Error('Expected exactly one VNM feature');
const outline = { type: 'FeatureCollection', features: selected.map(feature => ({
  type: 'Feature', properties: { name: 'Việt Nam', source: 'Natural Earth 5.1.2 / 1:110m' }, geometry: feature.geometry,
})) };
await writeFile(new URL('data/vietnam-outline.geojson', publicRoot), JSON.stringify(outline) + '\n');
const files = [];
for (const [path, kind] of [['data/vietnam-outline.geojson', 'boundary'], ['map-element/map-pin-flower.svg', 'image'], ['map-element/map-frame-01.svg', 'image']]) {
  files.push({ path, kind, sha256: hash(await readFile(new URL(path, publicRoot))) });
}
await writeFile(new URL('data/index.json', publicRoot), JSON.stringify({
  version: 1,
  source: { name: 'Natural Earth', version: '5.1.2', scale: '1:110m', url: sourceUrl, sha256: sourceHash,
    license: 'Public domain', licenseUrl: 'https://www.naturalearthdata.com/about/terms-of-use/' },
  scope: 'Single generalized Vietnam outline; no provincial/commune boundaries or static activity annotations.',
  files,
}, null, 2) + '\n');
console.log(`Packaged minimal map assets in ${fileURLToPath(publicRoot)}`);
