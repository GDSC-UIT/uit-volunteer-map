import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { managementApi } from '@/api/management';
import { campaignKeys, teamKeys, postKeys } from '@/api/queryKeys';
import { readRetry } from './readState';

export const adminTeamKeys={all:['admin-teams'] as const,list:(id:number)=>['admin-teams',{campaignId:id}] as const};
export const leaderOptionKeys={all:['team-leader-options'] as const};
export const leaderAccountKeys={all:['leader-accounts'] as const};
export function useLeaderAccounts() { return useQuery({queryKey:leaderAccountKeys.all,queryFn:({signal})=>managementApi.accounts(signal),retry:readRetry}); }
export function useManagementTeams(id:number) { return useQuery({queryKey:adminTeamKeys.list(id),queryFn:({signal})=>managementApi.teams(id,signal),enabled:id>0,retry:readRetry}); }
export function useLeaderOptions() { return useQuery({queryKey:leaderOptionKeys.all,queryFn:({signal})=>managementApi.leaders(signal),retry:readRetry}); }
export function useManagementMutation<T,R>(mutationFn:(input:T)=>Promise<R>) {
  const client=useQueryClient();
  return useMutation({mutationFn,
    onSuccess:async()=>{await Promise.all([campaignKeys.all,teamKeys.all,postKeys.all,adminTeamKeys.all,leaderOptionKeys.all,leaderAccountKeys.all].map(queryKey=>client.invalidateQueries({queryKey})));},
    onError:async error=>{if(isAxiosError(error)&&error.response?.status===409)await Promise.all([adminTeamKeys.all,leaderOptionKeys.all,leaderAccountKeys.all].map(queryKey=>client.invalidateQueries({queryKey})));},
  });
}
