import { useQuery } from "@tanstack/react-query";
import { campaignApi } from "@/api";
import { campaignKeys } from "@/api/queryKeys";

/**
 * Hook to fetch all campaigns
 */
export function useCampaigns() {
  return useQuery({
    queryKey: campaignKeys.all,
    queryFn: campaignApi.getAll,
  });
}

/**
 * Hook to fetch a single campaign by ID
 */
export function useCampaign(id: number) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignApi.getById(id),
    enabled: !!id,
  });
}
