import { useQuery } from '@tanstack/react-query';
import { teamApi } from '@/api/team';
import { teamKeys } from '@/api/queryKeys';
import { readRetry } from './readState';
export function useTeams() { return useQuery({queryKey:teamKeys.list(),queryFn:({signal})=>teamApi.getAll({},signal),retry:readRetry}); }
export function useTeam(id: number) { return useQuery({queryKey:teamKeys.detail(id),queryFn:({signal})=>teamApi.getById(id,signal),enabled:id>0,retry:readRetry}); }
export function useTeamsByCampaign(campaignId: number) { return useQuery({queryKey:teamKeys.byCampaign(campaignId),queryFn:({signal})=>teamApi.getByCampaign(campaignId,signal),enabled:campaignId>0,retry:readRetry}); }
