import { useQuery } from '@tanstack/react-query';
import { teamApi } from '@/api/team';
import { readRetry } from './readState';

export const ownTeamKey = ['leader', 'team'] as const;
export function useOwnTeam() {
  return useQuery({ queryKey: ownTeamKey, queryFn: ({ signal }) => teamApi.getOwn(signal), retry: readRetry });
}
