import type { UserRole } from './enums.js';

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// Auth Types
// ============================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface AuthUser {
  accId: number;
  username: string;
  role: UserRole;
}

export interface JwtPayload {
  accId: number;
  role: UserRole;
}

// ============================================
// Campaign Types
// ============================================
export interface CreateCampaignInput {
  campaignName: string;
  description?: string | null;
  startDate: string;
  endDate: string;
}

export type UpdateCampaignInput = Partial<CreateCampaignInput>;

// ============================================
// Entity Types (matching backend entities)
// ============================================

export interface User {
  userId: number;
  fullName: string;
  email: string;
  mssv?: string | null;
  class?: string | null;
  phoneNumber?: string | null;
}

export interface Campaign {
  campaignId: number;
  campaignName: string;
  startDate: string;
  endDate: string;
  description?: string | null;
}

export interface Team {
  teamId: number;
  teamName: string;
  description?: string | null;
  imageUrl?: string | null;
  attachments?: Attachment[];
}

export interface Post {
  postId: number;
  title: string;
  content: string;
  isDeleted: number;
  createdAt: string;
  updatedAt: string;
  thumbnail?: Photo | null;
  photos?: Photo[];
}

export interface Photo {
  photoId: number;
  title?: string | null;
  imageUrl: string;
  uploadedAt: string;
  isFirstImage?: number;
}

export interface Attachment {
  attachmentId: number;
  imageUrl: string;
  uploadedAt: string;
  position?: number | null;
}

export interface VolunteerLocation {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}
