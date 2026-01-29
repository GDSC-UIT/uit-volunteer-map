import { z } from 'zod';

const postSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    campaignId: z.number().min(1, 'CampaignId is required'),
    authorId: z.number().min(1, 'AuthorId(UserId) is required'),
    image: z.string().nullable().optional()
});

export const createPostSchema = postSchema;
export const updatePostSchema = postSchema.partial();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;