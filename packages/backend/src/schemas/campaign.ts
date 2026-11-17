import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Ngày không hợp lệ');
const fields = z.object({
  campaignName: z.string().trim().min(1, "Tên chiến dịch bắt buộc").max(200),
  description: z.string().optional().nullable(),
  startDate: date,
  endDate: date,
}).strict();
export const createCampaignSchema = fields.refine(data => data.endDate >= data.startDate, 'Ngày kết thúc phải từ ngày bắt đầu trở đi');

export const updateCampaignSchema = fields.partial();

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
