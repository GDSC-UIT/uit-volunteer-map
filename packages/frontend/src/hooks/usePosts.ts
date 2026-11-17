import { useQuery } from '@tanstack/react-query';
import { postApi } from '@/api/post';
import { postKeys } from '@/api/queryKeys';
import { readRetry } from './readState';
export function usePosts() { return useQuery({queryKey:postKeys.list(),queryFn:({signal})=>postApi.getAll({},signal),retry:readRetry}); }
export function usePost(id: number) { return useQuery({queryKey:postKeys.detail(id),queryFn:({signal})=>postApi.getById(id,signal),enabled:id>0,retry:readRetry}); }
export function usePostsByCampaign(campaignId:number) { return useQuery({queryKey:postKeys.list({campaignId}),queryFn:({signal})=>postApi.getAll({campaignId},signal),enabled:campaignId>0,retry:readRetry}); }
export function usePostsByTeam(teamId:number,campaignId?:number) { return useQuery({queryKey:postKeys.byTeam(teamId,campaignId),queryFn:({signal})=>postApi.getByTeam(teamId,campaignId,signal),enabled:teamId>0&&(campaignId===undefined||campaignId>0),retry:readRetry}); }
