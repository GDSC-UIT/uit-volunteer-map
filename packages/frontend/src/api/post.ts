import { API_ROUTES, type PostSummaryDto, type PostDetailDto, type PostReadFilters, type PostCreateDto, type PostWriteDto, type PostWriteResult } from '@uit-volunteer-map/shared';
import { readData } from './read';
import { writeData } from './write';
export const postApi = {
  create: (data: PostCreateDto) => writeData<PostWriteResult>('post', API_ROUTES.POSTS, data),
  update: (id: number, data: PostWriteDto) => writeData<PostWriteResult>('put', `${API_ROUTES.POSTS}/${id}`, data),
  delete: (id: number) => writeData<void>('delete', `${API_ROUTES.POSTS}/${id}`),
  getAll: (filters: PostReadFilters = {}, signal?: AbortSignal) => readData<PostSummaryDto[]>(API_ROUTES.POSTS, { params: filters, signal }),
  getById: (id: number, signal?: AbortSignal) => readData<PostDetailDto>(`${API_ROUTES.POSTS}/${id}`, { signal }),
  getByTeam: (teamId: number, campaignId?: number, signal?: AbortSignal): Promise<PostSummaryDto[]> => postApi.getAll({ teamId, campaignId }, signal),
};
