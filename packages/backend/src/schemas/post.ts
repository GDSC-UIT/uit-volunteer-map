import { z } from "zod";

const photoInputSchema = z.object({
  title: z.string().optional().nullable(),
  imageUrl: z.string().url("Invalid image URL"),
  isFirstImage: z.number().int().min(0).max(1).optional().nullable(),
}).strict();

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  teamId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  photos: z.array(photoInputSchema).optional(),
}).strict();

// Author is derived from the actor; post ownership cannot be transferred by an edit.
export const updatePostSchema = createPostSchema.pick({ title: true, content: true }).partial().strict();
export const createPostImageSchema = photoInputSchema;

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreatePostImageInput = z.infer<typeof createPostImageSchema>;
