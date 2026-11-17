import type { PostReadFilters, TeamReadFilters } from '@uit-volunteer-map/shared';
export const campaignKeys = {
  all: ['campaigns'] as const,
  detail: (id: number) => ['campaigns', 'detail', id] as const,
};
export const teamKeys = {
  all: ['teams'] as const,
  list: (filters: TeamReadFilters = {}) => ['teams', 'list', filters] as const,
  detail: (id: number) => ['teams', 'detail', id] as const,
  byCampaign: (campaignId: number) => ['teams', 'list', {campaignId}] as const,
};
export const postKeys = {
  all: ['posts'] as const,
  list: (filters: PostReadFilters = {}) => ['posts', 'list', filters] as const,
  detail: (id: number) => ['posts', 'detail', id] as const,
  byTeam: (teamId: number, campaignId?: number) => ['posts', 'list', {teamId, campaignId}] as const,
};
