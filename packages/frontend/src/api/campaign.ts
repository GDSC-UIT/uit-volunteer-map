import { API_ROUTES, type CampaignReadDto } from '@uit-volunteer-map/shared';
import { readData } from './read';
export const campaignApi = {
  getAll: (signal?: AbortSignal) => readData<CampaignReadDto[]>(API_ROUTES.CAMPAIGNS, { signal }),
  getById: (id: number, signal?: AbortSignal) => readData<CampaignReadDto>(`${API_ROUTES.CAMPAIGNS}/${id}`, { signal }),
};
