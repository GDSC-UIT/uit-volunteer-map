import { TeamData, mockTeams } from "@/mocks/team.mock";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const teamApi = {
  getAll: async (): Promise<TeamData[]> => {
    await delay(2000);
    return mockTeams;
  },

  getById: async (id: number): Promise<TeamData | undefined> => {
    await delay(1000);
    return mockTeams.find((team) => team.teamId === id);
  },

  getByCampaign: async (campaignId: number): Promise<TeamData[]> => {
    await delay(1500);
    return mockTeams.filter((team) => team.campaignId === campaignId);
  }
};
