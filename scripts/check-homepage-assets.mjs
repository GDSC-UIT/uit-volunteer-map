import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
const root = resolve(process.argv[2] || 'packages/frontend/public');
const manifest = JSON.parse(readFileSync(resolve(root, 'homepage/index.json'), 'utf8'));
assert.equal(manifest.version, 1);
assert.equal(manifest.files.length, 3);
const expected = new Set(['homepage/slide-01.jpg', 'homepage/slide-02.jpg', 'homepage/slide-03.jpg']);
for (const entry of manifest.files) {
  const path = resolve(root, entry.path), child = relative(root, path);
  assert.ok(expected.delete(entry.path) && !isAbsolute(child) && !child.startsWith('..'));
  assert.ok(entry.source.startsWith('https://res.cloudinary.com/duallvqjh/image/upload/'));
  const bytes = readFileSync(path);
  assert.equal(bytes[0], 0xff); assert.equal(bytes[1], 0xd8);
  assert.equal(bytes.length, entry.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
}
assert.equal(expected.size, 0);
console.log('Homepage artwork: 3 existing image copies, JPEG headers, byte sizes and SHA-256 verified.');
