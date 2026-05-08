// import { API_ROUTES, ApiResponse } from "@uit-volunteer-map/shared";
// import apiClient from "./client";
import { CampaignData, mockCampaigns } from "@/mocks/campaign.mock";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const campaignApi = {
  getAll: async (): Promise<CampaignData[]> => {
    await delay(2000);
    return mockCampaigns;
  },

  getById: async (id: number): Promise<CampaignData> => {
    await delay(1000);
    return (mockCampaigns.find((campaign) => campaign.campaignId === id) as CampaignData);
  },
};
