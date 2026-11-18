import { z } from "zod";
import { MEDIA_LIMITS } from '@uit-volunteer-map/shared';
import { imageUrlSchema } from './media.js';

const photoInputSchema = z.object({
  title: z.string().optional().nullable(),
  imageUrl: imageUrlSchema,
  isFirstImage: z.number().int().min(0).max(1).optional().nullable(),
}).strict();

const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
}).strict().nullable().optional();

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  teamId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  photos: z.array(photoInputSchema).max(MEDIA_LIMITS.maxImages).optional(),
  coordinates: coordinatesSchema,
}).strict();

// Author is derived from the actor; post ownership cannot be transferred by an edit.
export const updatePostSchema = createPostSchema.pick({ title: true, content: true, coordinates: true }).partial().strict();
export const createPostImageSchema = photoInputSchema;

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreatePostImageInput = z.infer<typeof createPostImageSchema>;
