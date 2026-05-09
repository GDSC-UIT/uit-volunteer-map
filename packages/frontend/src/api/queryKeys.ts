export const campaignKeys = {
  all: ["campaigns"] as const,
  detail: (id: number) => ["campaigns", id] as const,
};

export const teamKeys = {
  all: ["teams"] as const,
  detail: (id: number) => ["teams", id] as const,
  byCampaign: (campaignId: number) => ["teams", "by-campaign", campaignId] as const,
};

export const postKeys = {
  all: ["posts"] as const,
  detail: (id: number) => ["posts", id] as const,
  byTeam: (teamId: number) => ["posts", "by-team", teamId] as const,
};
