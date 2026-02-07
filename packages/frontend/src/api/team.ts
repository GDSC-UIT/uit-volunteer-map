import { ApiResponse } from "@uit-volunteer-map/shared";
import apiClient from "./client";

export interface TeamData {
  teamId: number;
  teamName: string;
  description: string | null;
  leader: {
    name: string;
    avatarUrl: string | null;
  } | null;
  viceLeaders: {
    name: string;
    avatarUrl: string | null;
  }[];
  images: string[];
}

export const teamApi = {
  getAll: async (): Promise<TeamData[]> => {
    const response = await apiClient.get<ApiResponse<TeamData[]>>("/teams");
    return response.data.data || [];
  },

  getById: async (id: number): Promise<TeamData> => {
    const response = await apiClient.get<ApiResponse<TeamData>>(`/teams/${id}`);
    if (!response.data.data) {
      throw new Error("Team not found");
    }
    return response.data.data;
  },

  getByCampaign: async (campaignId: number): Promise<TeamData[]> => {
    const response = await apiClient.get<ApiResponse<TeamData[]>>(
      `/teams/campaign/${campaignId}`,
    );
    return response.data.data || [];
  },
};
