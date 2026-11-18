import { API_ROUTES, type TeamReadDto, type TeamReadFilters } from '@uit-volunteer-map/shared';
import { readData } from './read';
import { writeData } from './write';
export const teamApi = {
  getOwn: (signal?: AbortSignal) => readData<TeamReadDto>('/leader/team', { signal }),
  updateOwn: (id: number, data: { teamName: string; description: string | null }) => writeData<TeamReadDto>('put', `${API_ROUTES.TEAMS}/${id}`, data),
  getAll: (filters: TeamReadFilters = {}, signal?: AbortSignal) => readData<TeamReadDto[]>(API_ROUTES.TEAMS, { params: filters, signal }),
  getById: (id: number, signal?: AbortSignal) => readData<TeamReadDto>(`${API_ROUTES.TEAMS}/${id}`, { signal }),
  getByCampaign: (campaignId: number, signal?: AbortSignal): Promise<TeamReadDto[]> => teamApi.getAll({ campaignId }, signal),
};
