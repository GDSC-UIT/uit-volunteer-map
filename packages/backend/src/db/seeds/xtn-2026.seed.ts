import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { EntityManager } from 'typeorm';
import { z } from 'zod';
import { MEDIA_LIMITS } from '@uit-volunteer-map/shared';
import { Attachment } from '../../entities/Attachment.js';
import { Campaign } from '../../entities/Campaign.js';
import { Photo } from '../../entities/Photo.js';
import { Post } from '../../entities/Post.js';
import { Team } from '../../entities/Team.js';

const text = z.string().trim().min(1);
const date = z.iso.date();
const file = z.string().regex(/^[a-z0-9-]+\.jpg$/);
const uitUrl = z.url({ protocol: /^https$/, hostname: /^(www\.)?uit\.edu\.vn$/ });
const facebookUrl = z.url({ protocol: /^https$/, hostname: /^(www\.)?facebook\.com$/ });
const eventId = z.string().regex(/^XTN26-E\d{2}$/);
const trackerId = z.string().regex(/^PUB-\d{3}$/);
const teamId = z.string().regex(/^XTN26-[TX]\d{2}$/);
const photo = z.strictObject({ file, alt: text });
const postFields = {
  teamId, title: text, summary: text, uitUrl,
  photos: z.array(photo).min(1).max(MEDIA_LIMITS.maxImages).optional(),
};
const manifestSchema = z.strictObject({
  campaign: z.strictObject({
    key: z.literal('xtn-2026'), name: text, startDate: date, endDate: date,
    description: text, cover: file,
  }),
  teams: z.array(z.strictObject({ id: teamId, name: text, description: text, uitUrl })).min(1),
  posts: z.array(z.discriminatedUnion('status', [
    z.strictObject({ ...postFields, status: z.literal('confirmed_activity'), id: eventId,
      eventDate: date.optional(), relatedPostId: trackerId.optional(), facebookUrl: facebookUrl.optional() }),
    z.strictObject({ ...postFields, status: z.literal('verified_post'), id: trackerId, facebookUrl }),
  ])).min(1),
});
type Manifest = z.infer<typeof manifestSchema>;
export const xtnPhotoPath = (file: string) => `/xtn-2026/${file}`;

export function loadXtn2026(frontendRoot: string) {
  const raw = readFileSync(new URL('../../../import/xtn-2026.json', import.meta.url), 'utf8');
  const manifest = manifestSchema.parse(JSON.parse(raw));
  const { campaign, teams, posts } = manifest;
  const allPhotos = posts.flatMap(post => (post.photos ?? []).map(photo => photo.file));
  const teamIds = new Set(teams.map(team => team.id));
  const recordIds = posts.flatMap(post => post.status === 'confirmed_activity' && post.relatedPostId
    ? [post.id, post.relatedPostId]
    : [post.id]);
  if (teamIds.size !== teams.length || new Set(teams.map(team => team.name)).size !== teams.length
      || new Set(recordIds).size !== recordIds.length || new Set(posts.map(post => post.title)).size !== posts.length
      || posts.some(post => !teamIds.has(post.teamId)) || campaign.endDate < campaign.startDate
      || new Set(allPhotos).size !== allPhotos.length || !allPhotos.includes(campaign.cover)) {
    throw new Error('XTN 2026 manifest has duplicate keys, invalid dates or broken references.');
  }
  for (const file of allPhotos) {
    const path = join(frontendRoot, 'xtn-2026', file);
    const size = statSync(path).size;
    if (size < 4 || size > MEDIA_LIMITS.maxImageBytes || readFileSync(path).readUInt16BE() !== 0xffd8) {
      throw new Error(`Invalid XTN 2026 JPEG: ${file}`);
    }
  }
  const digest = createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
  return { manifest, digest, counts: { teams: teams.length, posts: posts.length, photos: allPhotos.length } };
}
type XtnBatch = ReturnType<typeof loadXtn2026>;

function postContent(post: Manifest['posts'][number]) {
  const date = post.status === 'confirmed_activity' ? post.eventDate : undefined;
  const dateText = date ? `Ngày diễn ra ${date.split('-').reverse().join('/')}` : '';
  return [post.summary, dateText, `Nguồn UIT ${post.uitUrl}`,
    post.facebookUrl ? `Bài đăng gốc ${post.facebookUrl}` : ''].filter(Boolean).join('\n\n');
}

/** Call in a transaction. The receipt survives editorial edits and deletions. */
export async function seedXtn2026(manager: EntityManager, batch: XtnBatch) {
  const { campaign, teams, posts } = batch.manifest;
  if (manager.connection.options.type === 'sqlite') {
    await manager.query(`CREATE TABLE IF NOT EXISTS "ContentImport" (
      "BatchKey" TEXT PRIMARY KEY, "ManifestHash" TEXT NOT NULL,
      "CampaignId" INTEGER NOT NULL, "AppliedAt" TEXT NOT NULL
    )`);
  }
  const [existing] = await manager.sql`
    SELECT "ManifestHash" AS digest, "CampaignId" AS "campaignId"
    FROM "ContentImport" WHERE "BatchKey" = ${campaign.key}
  ` as Array<{ digest: string; campaignId: number }>;
  if (existing) {
    if (existing.digest !== batch.digest) throw new Error('XTN 2026 was already imported with a different manifest. Review the differences before updating content.');
    return { created: false, campaignId: existing.campaignId, ...batch.counts };
  }

  const campaigns = manager.getRepository(Campaign);
  const teamRepo = manager.getRepository(Team);
  const normalName = (name: string) => name.trim().normalize().toLocaleLowerCase('vi');
  const names = new Set(teams.map(team => normalName(team.name)));
  if ((await campaigns.find({ select: { campaignName: true } })).some(row => normalName(row.campaignName) === normalName(campaign.name))
      || (await teamRepo.find({ select: { teamName: true } })).some(row => names.has(normalName(row.teamName)))) {
    throw new Error('XTN 2026 campaign or team name conflicts with existing data. No rows were imported.');
  }

  const now = new Date().toISOString();
  const savedCampaign = await campaigns.save(campaigns.create({
    campaignName: campaign.name, description: campaign.description,
    startDate: campaign.startDate, endDate: campaign.endDate,
  }));
  await manager.getRepository(Attachment).insert({
    campaign: savedCampaign, imageUrl: xtnPhotoPath(campaign.cover), position: 0, uploadedAt: now,
  });
  const savedTeams = await teamRepo.save(teams.map(team => teamRepo.create({
    campaign: savedCampaign, teamName: team.name, description: team.description,
  })));
  const teamsByKey = new Map(teams.map((team, index) => [team.id, savedTeams[index]]));
  const postRepo = manager.getRepository(Post);
  const savedPosts = await postRepo.save(posts.map(post => postRepo.create({
    title: post.title, content: postContent(post), team: teamsByKey.get(post.teamId)!,
    createdAt: now, updatedAt: now, latitude: null, longitude: null,
  })));
  await manager.getRepository(Photo).insert(posts.flatMap((post, index) =>
    (post.photos ?? []).map((photo, position) => ({
      post: savedPosts[index], imageUrl: xtnPhotoPath(photo.file), title: photo.alt,
      uploadedAt: now, position, isFirstImage: position === 0 ? 1 : 0,
    })),
  ));
  await manager.sql`
    INSERT INTO "ContentImport" ("BatchKey", "ManifestHash", "CampaignId", "AppliedAt")
    VALUES (${campaign.key}, ${batch.digest}, ${savedCampaign.campaignId}, ${now})
  `;
  return { created: true, campaignId: savedCampaign.campaignId, ...batch.counts };
}
