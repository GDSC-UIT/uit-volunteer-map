import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createHash, webcrypto } from 'node:crypto';
import type { PostSummaryDto } from '@uit-volunteer-map/shared';
import { getMapPosts, loadMapBoundary } from './mapData';

const polygon = {type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[106,10],[107,10],[107,11],[106,10]]]}}]};
let body: unknown, manifest: {version:number;source:{licenseUrl:string};files:{kind:string;path:string;sha256:string}[]};
const fetchMock = vi.fn();
beforeEach(() => {
  body = polygon;
  manifest = {version:1,source:{licenseUrl:'https://www.naturalearthdata.com/about/terms-of-use/'},files:[{kind:'boundary',path:'data/vietnam-outline.geojson',sha256:''}]};
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset().mockImplementation(async (url: string) => new Response(JSON.stringify(url === '/data/index.json' ? manifest : body)));
});
afterEach(() => vi.unstubAllGlobals());
function setHash() {manifest.files[0].sha256 = createHash('sha256').update(JSON.stringify(body)).digest('hex');}
const signal = () => new AbortController().signal;
const post = (postId: number, campaignId: number, coordinates: unknown) => ({postId,team:{campaignId},coordinates}) as PostSummaryDto;

it('selects only located posts in the selected campaign and preserves post identity and zero coordinates', () => {
  const posts = [post(1,1,null),post(2,1,{latitude:10,longitude:106}),post(3,2,{latitude:11,longitude:107}),post(4,1,{latitude:0,longitude:0})];
  expect(getMapPosts(posts,1).map(item=>item.postId)).toEqual([2,4]);
  expect(getMapPosts(posts,2).map(item=>item.postId)).toEqual([3]);
  expect(getMapPosts(posts,3)).toEqual([]);
});
it.each([undefined,{}, {latitude:10}, {latitude:'10',longitude:106}, {latitude:91,longitude:106}, {latitude:10,longitude:181}, {latitude:NaN,longitude:106}, {latitude:10,longitude:Infinity}])('omits invalid coordinates safely: %j', coordinates => {
  expect(getMapPosts([post(2,1,coordinates)],1)).toEqual([]);
});
it('loads only the packaged manifest boundary, verifies its hash and passes the abort signal', async () => {
  setHash();const abort = signal();
  expect(await loadMapBoundary(abort)).toEqual(polygon);
  expect(fetchMock.mock.calls.map(call=>call[0])).toEqual(['/data/index.json','/data/vietnam-outline.geojson']);
  expect(fetchMock.mock.calls.every(call=>call[1].signal === abort)).toBe(true);
});
it.each(['/data/index.json','/data/vietnam-outline.geojson'])('rejects an unavailable asset: %s', async failed => {
  setHash();fetchMock.mockImplementation(async url => new Response(JSON.stringify(url === '/data/index.json' ? manifest : body),{status:url===failed?404:200}));
  await expect(loadMapBoundary(signal())).rejects.toThrow('unavailable');
});
it('rejects HTML fallback instead of rendering fabricated geometry', async () => {
  fetchMock.mockResolvedValue(new Response('<!DOCTYPE html><title>Vite fallback</title>'));
  await expect(loadMapBoundary(signal())).rejects.toThrow();
});
it('rejects a manifest path outside the supported boundary asset', async () => {
  setHash();manifest.files[0].path='../unexpected.geojson';
  await expect(loadMapBoundary(signal())).rejects.toThrow('Invalid map manifest');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it('rejects content changed after packaging', async () => {
  setHash();body={...polygon,features:[]};
  await expect(loadMapBoundary(signal())).rejects.toThrow('checksum mismatch');
});
it.each([
  {type:'FeatureCollection',features:[]},
  {type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[106,10]}}]},
  {type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Polygon',coordinates:[[[106,10],[107,10],[107,11],[106,12]]]}}]},
])('rejects malformed geometry even when the file matches its manifest checksum', async invalid => {
  body=invalid;setHash();await expect(loadMapBoundary(signal())).rejects.toThrow('Invalid map polygon');
});
