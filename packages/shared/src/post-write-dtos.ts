import type { PostCoordinates } from './coordinates.js';

export interface PostWriteDto {
  title: string;
  content: string;
  coordinates: PostCoordinates | null;
}
export interface PostCreateDto extends PostWriteDto {
  teamId: number;
  photos: { imageUrl: string; title?: string; isFirstImage?: 0 | 1 }[];
}
/** Writes return an entity; load the canonical public DTO separately. */
export interface PostWriteResult { postId: number; }
