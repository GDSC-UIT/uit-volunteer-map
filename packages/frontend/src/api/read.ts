import type { AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@uit-volunteer-map/shared';
import apiClient from './client';
export async function readData<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.get<ApiResponse<T>>(url, config);
  if (!data.success || data.data == null) throw new Error(data.error || 'Invalid API response');
  return data.data;
}
