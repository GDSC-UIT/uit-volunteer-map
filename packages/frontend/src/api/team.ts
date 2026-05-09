import { ApiResponse, API_ROUTES } from "@uit-volunteer-map/shared";
import apiClient from "./client";
import { TeamData } from "@/types/team";

export const teamApi = {
  getAll: async (): Promise<TeamData[]> => {
    const { data } = await apiClient.get<ApiResponse<TeamData[]>>(API_ROUTES.TEAM.GET_ALL);
    if (!data.success || !data.data) {
      throw new Error(data.error || "Failed to fetch teams");
    }
    return data.data;
  },

  getById: async (id: number): Promise<TeamData> => {
    const { data } = await apiClient.get<ApiResponse<TeamData>>(API_ROUTES.TEAM.GET_BY_ID(id));
    if (!data.success || !data.data) {
      throw new Error(data.error || "Failed to fetch team details");
    }
    return data.data;
  },

  create: async (payload: { teamName: string; campaignId: number; leaderId: number; description?: string }): Promise<TeamData> => {
    const { data } = await apiClient.post<ApiResponse<TeamData>>(API_ROUTES.TEAM.CREATE, payload);
    if (!data.success || !data.data) {
      throw new Error(data.error || "Failed to create team");
    }
    return data.data;
  },

  update: async (id: number, payload: { teamName?: string; description?: string; imageUrl?: string }): Promise<TeamData> => {
    const { data } = await apiClient.put<ApiResponse<TeamData>>(API_ROUTES.TEAM.UPDATE(id), payload);
    if (!data.success || !data.data) {
      throw new Error(data.error || "Failed to update team");
    }
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(API_ROUTES.TEAM.DELETE(id));
    if (!data.success) {
      throw new Error(data.error || "Failed to delete team");
    }
  },

  // Note: Backend doesn't have an explicit endpoint for getByCampaign yet, 
  // so we filter the getAll result for now, or you can add it to backend later.
  getByCampaign: async (campaignId: number): Promise<TeamData[]> => {
    const teams = await teamApi.getAll();
    // Assuming campaignId might need to be linked if returned. But backend getAll doesn't return campaignId directly right now.
    // If backend doesn't return campaignId, this filter might fail. We will return all for now or filter if campaignId is present.
    // Since backend team getAll doesn't include campaignId in the current payload, 
    // we'd need to either update backend or skip filtering.
    // The previous mock filtered by campaignId. Let's just return all teams for now or filter if it exists.
    return teams.filter((team: any) => team.campaignId ? team.campaignId === campaignId : true);
  }
};
