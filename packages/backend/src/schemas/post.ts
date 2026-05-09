import { z } from "zod";

const photoInputSchema = z.object({
  title: z.string().optional().nullable(),
  imageUrl: z.string().url("Invalid image URL"),
  isFirstImage: z.number().int().min(0).max(1).optional().nullable(),
});

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  teamId: z.number().min(1, 'TeamId is required'),
  authorId: z.number().min(1, 'AuthorId(UserId) is required'),
  photos: z.array(photoInputSchema).optional(),
});

export const createPostSchema = postSchema;
export const updatePostSchema = postSchema.omit({ photos: true }).partial();

export const createPostImageSchema = z.object({
  title: z.string().optional().nullable(),
  imageUrl: z.string().url("Invalid image URL"),
  isFirstImage: z.number().int().optional().nullable(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreatePostImageInput = z.infer<typeof createPostImageSchema>;
