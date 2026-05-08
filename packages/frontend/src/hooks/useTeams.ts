import { useQuery } from "@tanstack/react-query";
import { teamApi } from "@/api/team";
import { teamKeys } from "@/api/queryKeys";

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



