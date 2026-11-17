# Packaged map data

The v1 map intentionally uses a minimal background: one generalized Vietnam
outline from Natural Earth **5.1.2, 1:110m**, with the existing flower marker and
decorative frame. It does not claim provincial/commune coverage, current
administrative accuracy, offshore detail or navigation precision. Activity pins
come exclusively from persisted Post coordinates, not a static annotation file.

Natural Earth data is public domain. Source and terms:
- https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson
- https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/LICENSE.md
- https://www.naturalearthdata.com/about/terms-of-use/

From the repository root run `node scripts/package-map-assets.mjs` to download
the pinned source, verify its SHA-256, select `ADM0_A3 === 'VNM'`, keep its
geometry without simplification, and replace properties with name/source only.
Alternatively pass `--source <downloaded-file>` for offline reproduction. The
result and asset hashes are recorded in `index.json`. No network is needed to
build or display the checked-in map.

Run `node scripts/check-map-assets.mjs` to verify source metadata, all three
required files, checksums and polygon validity. Run the same command with
`packages/frontend/dist` after building to verify deployable output. A changed
upstream file fails checksum validation; updating the pinned dataset requires a
deliberate source/license review. Existing SVGs retain their repository origin;
the Natural Earth license applies to the boundary, not to campaign artwork.

`index2.json` is an unused legacy list, preserved for compatibility. MapView does
not request it or the absent historical province/annotation files.
