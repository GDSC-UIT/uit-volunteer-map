import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCampaignInput, UpdateCampaignInput } from "@uit-volunteer-map/shared";
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

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCampaignInput) => campaignApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateCampaignInput;
    }) => campaignApi.update(id, payload),
    onSuccess: (campaign) => {
      void queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      void queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(campaign.campaignId),
      });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => campaignApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
}
