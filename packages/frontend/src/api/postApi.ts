import { Post, Photo, ApiResponse } from '@uit-volunteer-map/shared';

const BASE_URL = '/api/posts';

export const postApi = {
  getAll: async (): Promise<ApiResponse<Post[]>> => {
    const res = await fetch(BASE_URL);
    return res.json();
  },

  getById: async (id: number): Promise<ApiResponse<Post>> => {
    const res = await fetch(`${BASE_URL}/${id}`);
    return res.json();
  },

  create: async (data: Partial<Post>, token: string): Promise<ApiResponse<Post>> => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  addPhoto: async (id: number, photoData: Partial<Photo>, token: string): Promise<ApiResponse<Photo>> => {
    const res = await fetch(`${BASE_URL}/${id}/photos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(photoData)
    });
    return res.json();
  },

  update: async (id: number, data: Partial<Post>, token: string): Promise<ApiResponse<Post>> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  delete: async (id: number, token: string): Promise<ApiResponse<Post>> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return res.json();
  }
};