import { z } from "zod";
import { MEDIA_LIMITS } from '@uit-volunteer-map/shared';
import { imageUrlSchema } from './media.js';

export const attachmentInputSchema = z.object({
  imageUrl: imageUrlSchema,
  position: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional().nullable(),
}).strict();

export const createTeamSchema = z.object({
  teamName: z
    .string()
    .trim()
    .min(3, "Team name must be at least 3 characters")
    .max(100, "Team name must not exceed 100 characters"),
  leaderId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable().optional(),
  campaignId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("Invalid image URL").optional().nullable(),
  attachments: z.array(attachmentInputSchema).max(MEDIA_LIMITS.maxImages).optional(),
}).strict();

export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = z.object({
  teamName: z.string().trim().min(3).max(100).optional(),
  leaderId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable().optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("Invalid image URL").optional().nullable(),
}).strict();

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

export const addTeamAttachmentsSchema = z.object({
  attachments: z.array(attachmentInputSchema).min(1, "At least one attachment is required").max(MEDIA_LIMITS.maxImages),
});

export type AddTeamAttachmentsInput = z.infer<typeof addTeamAttachmentsSchema>;
export type AttachmentInput = z.infer<typeof attachmentInputSchema>;
