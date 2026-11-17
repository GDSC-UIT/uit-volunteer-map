import { useQuery } from '@tanstack/react-query';
import { campaignApi } from '@/api/campaign';
import { campaignKeys } from '@/api/queryKeys';
import { readRetry } from './readState';
export function useCampaigns() { return useQuery({queryKey:campaignKeys.all, queryFn:({signal})=>campaignApi.getAll(signal), retry:readRetry}); }
export function useCampaign(id: number) { return useQuery({queryKey:campaignKeys.detail(id), queryFn:({signal})=>campaignApi.getById(id,signal), enabled:id>0, retry:readRetry}); }
