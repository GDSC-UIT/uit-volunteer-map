import type { TeamReadDto } from './read-dtos.js';
export interface CampaignWriteDto {
  campaignName: string;
  description: string | null;
  startDate: string;
  endDate: string;
}
export interface TeamWriteDto {
  teamName: string;
  description: string | null;
  imageUrl?: string | null;
  leaderId: number | null;
}
export interface TeamCreateDto extends TeamWriteDto { campaignId: number; }
export interface AdminTeamReadDto extends TeamReadDto { leaderId: number | null; }
export interface TeamLeaderOptionDto {
  userId: number;
  fullName: string;
  assignedTeamId: number | null;
  commandedTeamIds: number[];
}
