import type { RoleEnum } from './enums.js';

export interface CreateLeaderAccountDto {
  username: string;
  password: string;
  /** Existing provisioning API spelling; reads use profile.fullName. */
  fullname: string;
  mssv: string;
  class: string;
  email: string;
  phoneNumber: string;
}
export interface UpdateLeaderAccountDto {
  password?: string;
  fullname?: string;
  mssv?: string | null;
  class?: string | null;
  email?: string;
  phoneNumber?: string | null;
}
export interface LeaderAccountReadDto {
  accId: number;
  username: string;
  role: RoleEnum.LEADER;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  profile: {
    userId: number;
    fullName: string;
    mssv: string | null;
    class: string | null;
    email: string;
    phoneNumber: string | null;
    active: boolean;
  } | null;
  team: {
    teamId: number;
    teamName: string;
    campaignId: number | null;
    campaignName: string | null;
    active: boolean;
  } | null;
  commandedTeamIds: number[];
}
