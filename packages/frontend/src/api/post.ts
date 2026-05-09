import { PostData, mockPosts } from "@/mocks/post.mock";

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const postApi = {
  getAll: async (): Promise<PostData[]> => {
    await delay(5000);
    return mockPosts;
  },

  getById: async (id: number): Promise<PostData | undefined> => {
    await delay(1000);
    return mockPosts.find((post) => post.postId === id);
  },

  getByTeam: async (teamId: number): Promise<PostData[]> => {
    await delay(3000);
    return mockPosts.filter((post) => post.teamId === teamId);
  },
};
