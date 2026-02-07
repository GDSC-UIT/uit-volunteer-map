import { Campaign, ApiResponse } from "@uit-volunteer-map/shared";
import apiClient from "./client";

export const campaignApi = {
  getAll: async (): Promise<Campaign[]> => {
    const response = await apiClient.get<ApiResponse<Campaign[]>>("/campaigns");
    return response.data.data || [];
  },

  getById: async (id: number): Promise<Campaign> => {
    const response = await apiClient.get<ApiResponse<Campaign>>(
      `/campaigns/${id}`,
    );
    if (!response.data.data) {
      throw new Error("Campaign not found");
    }
    return response.data.data;
  },
};
