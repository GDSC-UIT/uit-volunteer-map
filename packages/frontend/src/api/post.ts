import { Post, Photo, ApiResponse } from '@uit-volunteer-map/shared';

const BASE_URL = 'http://localhost:5000/api/posts';

export const postApi = {
  // ── Queries ───────────────────────────────────────────────────────────────

  getAll: async (): Promise<Post[]> => {
    const res = await fetch(BASE_URL);
    const json: ApiResponse<Post[]> = await res.json();
    if (json.success && json.data) return json.data;
    return [];
  },

  getById: async (id: number): Promise<Post | undefined> => {
    const res = await fetch(`${BASE_URL}/${id}`);
    const json: ApiResponse<Post> = await res.json();
    return json.data;
  },

  getByTeam: async (teamId: number): Promise<Post[]> => {
    const res = await fetch(`${BASE_URL}?teamId=${teamId}`);
    const json: ApiResponse<Post[]> = await res.json();
    return json.data || [];
  },

  // ── Mutations ─────────────────────────────────────────────────────────────

  create: async (data: Partial<Post>, token: string): Promise<ApiResponse<Post>> => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: number, data: Partial<Post>, token: string): Promise<ApiResponse<Post>> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: number, token: string): Promise<ApiResponse<Post>> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return res.json();
  },

  addPhoto: async (id: number, photoData: Partial<Photo>, token: string): Promise<ApiResponse<Photo>> => {
    const res = await fetch(`${BASE_URL}/${id}/photos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(photoData),
    });
    return res.json();
  },
};