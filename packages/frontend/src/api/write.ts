import type { ApiResponse } from '@uit-volunteer-map/shared';
import apiClient from './client';

export async function writeData<T>(method: 'post' | 'put' | 'delete', url: string, data?: unknown): Promise<T> {
  const response = await apiClient.request<ApiResponse<T>>({ method, url, data });
  if (!response.data.success) throw new Error(response.data.error || 'Không thể lưu dữ liệu.');
  return response.data.data as T;
}
