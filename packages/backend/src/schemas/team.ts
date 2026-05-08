import { z } from "zod";

export const attachmentInputSchema = z.object({
  imageUrl: z.string().url("Invalid image URL"),
  position: z.number().int().min(0).optional().nullable(),
});

export const createTeamSchema = z.object({
  teamName: z
    .string()
    .min(3, "Team name must be at least 3 characters")
    .max(100, "Team name must not exceed 100 characters"),
  leaderId: z.number().int().positive("Leader ID is required"),
  campaignId: z.number().int().positive("Campaign ID is required"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("Invalid image URL").optional().nullable(),
  attachments: z.array(attachmentInputSchema).optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = z.object({
  teamName: z.string().min(1, "Team name cannot be empty").optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("Invalid image URL").optional().nullable(),
});

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

export const addTeamAttachmentsSchema = z.object({
  attachments: z.array(attachmentInputSchema).min(1, "At least one attachment is required"),
});

export type AddTeamAttachmentsInput = z.infer<typeof addTeamAttachmentsSchema>;
export type AttachmentInput = z.infer<typeof attachmentInputSchema>;
