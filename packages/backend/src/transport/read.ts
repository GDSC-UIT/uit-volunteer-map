import type { AttachmentReadDto, CampaignReadDto, TeamReadDto, PhotoReadDto, PostSummaryDto, PostDetailDto, UserSummaryDto } from '@uit-volunteer-map/shared';
import { RoleEnum } from '@uit-volunteer-map/shared';
import type { Attachment } from '../entities/Attachment.js';
import type { Campaign } from '../entities/Campaign.js';
import type { Team } from '../entities/Team.js';
import type { User } from '../entities/User.js';
import type { Post } from '../entities/Post.js';
import type { Photo } from '../entities/Photo.js';

export function attachmentsDto(items: Attachment[] = []): AttachmentReadDto[] {
  return [...items].sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity) || a.attachmentId - b.attachmentId)
    .map(item => ({ attachmentId: item.attachmentId, imageUrl: item.imageUrl, uploadedAt: item.uploadedAt, position: item.position ?? null }));
}
export function campaignDto(campaign: Campaign): CampaignReadDto {
  return { campaignId: campaign.campaignId, campaignName: campaign.campaignName, startDate: campaign.startDate, endDate: campaign.endDate,
    description: campaign.description ?? null, attachments: attachmentsDto(campaign.attachments) };
}
function userDto(user: User): UserSummaryDto {
  return { userId: user.userId, fullName: user.fullName, avatarUrl: user.avatarUrl ?? null };
}
export function teamDto(team: Team): TeamReadDto {
  return { teamId: team.teamId, campaignId: team.campaign.campaignId, teamName: team.teamName,
    description: team.description ?? null, imageUrl: team.imageUrl ?? null,
    leaders: (team.users ?? []).filter(user => user.isDeleted === 0 && user.account && !user.account.isDeleted && user.account.role?.roleName === RoleEnum.LEADER)
      .sort((a,b) => a.userId - b.userId).map(user => ({ ...userDto(user), role: 'leader' })),
    attachments: attachmentsDto(team.attachments) };
}
export function photosDto(items: Photo[] = []): PhotoReadDto[] {
  return items.filter(photo => photo.isDeleted === 0)
    .sort((a,b) => Number(b.isFirstImage === 1) - Number(a.isFirstImage === 1) || a.photoId - b.photoId)
    .map(photo => ({ photoId: photo.photoId, title: photo.title ?? null, imageUrl: photo.imageUrl, uploadedAt: photo.uploadedAt, isFirstImage: photo.isFirstImage === 1 }));
}
export function postSummaryDto(post: Post): PostSummaryDto {
  return { postId: post.postId, title: post.title, content: post.content, createdAt: post.createdAt, updatedAt: post.updatedAt,
    team: { teamId: post.team.teamId, teamName: post.team.teamName, campaignId: post.team.campaign.campaignId },
    author: post.author && post.author.isDeleted === 0 ? userDto(post.author) : null,
    thumbnail: photosDto(post.photos)[0] ?? null };
}
export function postDetailDto(post: Post): PostDetailDto {
  return { ...postSummaryDto(post), photos: photosDto(post.photos) };
}
