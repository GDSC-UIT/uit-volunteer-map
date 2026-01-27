import { z } from 'zod';

export const createCampaignSchema = z.object({
  campaignName: z.string().min(1, "Tên chiến dịch bắt buộc"),
  description: z.string().optional().nullable(),
  startDate: z.string().min(1, "Ngày bắt đầu bắt buộc"), 
  endDate: z.string().min(1, "Ngày kết thúc bắt buộc"),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;