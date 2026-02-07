import apiClient from "./client";

export interface PostData {
  postId: number;
  title: string;
  content: string;
  photos?: string[];
  teamId: number | null;
  createdAt: string;
  location: string | null;
}

export const postApi = {
  getAll: async (): Promise<PostData[]> => {
    const response = await apiClient.get("/posts");
    return response.data.data;
  },

  getById: async (id: number): Promise<PostData | undefined> => {
    const response = await apiClient.get(`/posts/${id}`);
    return response.data.data;
  },

  getByTeam: async (teamId: number): Promise<PostData[]> => {
    const response = await apiClient.get(`/posts/team/${teamId}`);
    return response.data.data;
  },
};
