import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamApi } from "@/api/team";
import { teamKeys } from "@/api/queryKeys";
import { TeamData } from "@/types/team";

/**
 * Hook to fetch all teams
 */
export function useTeams() {
  return useQuery({
    queryKey: teamKeys.all,
    queryFn: teamApi.getAll,
  });
}

/**
 * Hook to fetch a detail team by id
 */
export function useTeam(id: number) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => teamApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch teams by campaign id
 */
export function useTeamsByCampaign(campaignId: number) {
  return useQuery({
    queryKey: teamKeys.byCampaign(campaignId),
    queryFn: () => teamApi.getByCampaign(campaignId),
    enabled: !!campaignId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teamApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TeamData> }) => teamApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teamApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      queryClient.removeQueries({ queryKey: teamKeys.detail(id) });
    },
  });
}
