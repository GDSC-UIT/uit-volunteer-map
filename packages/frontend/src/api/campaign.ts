import type {
  ApiResponse,
  Campaign,
  CreateCampaignInput,
  UpdateCampaignInput,
} from "@uit-volunteer-map/shared";
import { API_ROUTES } from "@uit-volunteer-map/shared";
import apiClient from "./client";

export type CampaignData = Campaign;

function unwrapResponse<T>(response: ApiResponse<T>, fallbackError: string): T {
  if (!response.success || response.data === undefined) {
    throw new Error(response.error || fallbackError);
  }

  return response.data;
}

export const campaignApi = {
  getAll: async (): Promise<CampaignData[]> => {
    const { data } = await apiClient.get<ApiResponse<CampaignData[]>>(
      API_ROUTES.CAMPAIGNS,
    );

    return unwrapResponse(data, "Failed to fetch campaigns");
  },

  getById: async (id: number): Promise<CampaignData> => {
    const { data } = await apiClient.get<ApiResponse<CampaignData>>(
      `${API_ROUTES.CAMPAIGNS}/${id}`,
    );

    return unwrapResponse(data, "Failed to fetch campaign");
  },

  create: async (payload: CreateCampaignInput): Promise<CampaignData> => {
    const { data } = await apiClient.post<ApiResponse<CampaignData>>(
      API_ROUTES.CAMPAIGNS,
      payload,
    );

    return unwrapResponse(data, "Failed to create campaign");
  },

  update: async (
    id: number,
    payload: UpdateCampaignInput,
  ): Promise<CampaignData> => {
    const { data } = await apiClient.put<ApiResponse<CampaignData>>(
      `${API_ROUTES.CAMPAIGNS}/${id}`,
      payload,
    );

    return unwrapResponse(data, "Failed to update campaign");
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${API_ROUTES.CAMPAIGNS}/${id}`);
  },
};
