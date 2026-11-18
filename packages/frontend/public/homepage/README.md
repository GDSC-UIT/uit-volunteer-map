# Existing homepage artwork

These are byte-for-byte local copies of the three Cloudinary JPEG URLs previously
embedded in `src/pages/HomePage.tsx`. Sources, byte sizes and SHA-256 values are in
`index.json`; no image editing, recompression or new artwork was performed.
Together they total 2,332,763 bytes. They are packaged so Guest viewing and the
functional browser gate need no external image service.

They retain their original repository/team artwork terms. This manifest is
provenance, not a new license grant. Confirm redistribution rights with the
maintainers; the map boundary's public-domain terms do not apply to these photos.

Run `node scripts/check-homepage-assets.mjs` for source files and
`node scripts/check-homepage-assets.mjs packages/frontend/dist` after building.
The checks verify the three expected paths, JPEG headers, byte sizes and hashes.
No download happens during build or acceptance. To refresh an image deliberately,
review its source/rights and record the new bytes/hash in the manifest.
