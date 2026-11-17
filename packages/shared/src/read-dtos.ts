/** Public transport contracts. These are not TypeORM entities or write payloads. */
export interface AttachmentReadDto {
  attachmentId: number;
  imageUrl: string;
  uploadedAt: string;
  position: number | null;
}
export interface CampaignReadDto {
  campaignId: number;
  campaignName: string;
  startDate: string;
  endDate: string;
  description: string | null;
  attachments: AttachmentReadDto[];
}
export interface UserSummaryDto {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
}
export interface TeamReadDto {
  teamId: number;
  campaignId: number;
  teamName: string;
  description: string | null;
  imageUrl: string | null;
  leaders: (UserSummaryDto & { role: 'leader' })[];
  attachments: AttachmentReadDto[];
}
export interface PhotoReadDto {
  photoId: number;
  title: string | null;
  imageUrl: string;
  uploadedAt: string;
  isFirstImage: boolean;
}
export interface PostSummaryDto {
  postId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  team: { teamId: number; teamName: string; campaignId: number };
  author: UserSummaryDto | null;
  thumbnail: PhotoReadDto | null;
}
export interface PostDetailDto extends PostSummaryDto {
  photos: PhotoReadDto[];
}
export interface TeamReadFilters { campaignId?: number; }
export interface PostReadFilters extends TeamReadFilters { teamId?: number; }
