import type { ApiResponse, LoginResponse } from "@uit-volunteer-map/shared";
import { API_ROUTES } from "@uit-volunteer-map/shared";
import apiClient from "./client";

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      API_ROUTES.AUTH.LOGIN,
      {
        username,
        password,
      },
    );

    if (!data.success || !data.data) {
      throw new Error(data.error || "Login failed");
    }

    return data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(API_ROUTES.AUTH.LOGOUT);
  },
};
