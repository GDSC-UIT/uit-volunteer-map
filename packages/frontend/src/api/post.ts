import { API_ROUTES, type PostSummaryDto, type PostDetailDto, type PostReadFilters } from '@uit-volunteer-map/shared';
import { readData } from './read';
export const postApi = {
  getAll: (filters: PostReadFilters = {}, signal?: AbortSignal) => readData<PostSummaryDto[]>(API_ROUTES.POSTS, { params: filters, signal }),
  getById: (id: number, signal?: AbortSignal) => readData<PostDetailDto>(`${API_ROUTES.POSTS}/${id}`, { signal }),
  getByTeam: (teamId: number, campaignId?: number, signal?: AbortSignal): Promise<PostSummaryDto[]> => postApi.getAll({ teamId, campaignId }, signal),
};
