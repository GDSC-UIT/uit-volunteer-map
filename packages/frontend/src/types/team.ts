export interface TeamLeader {
  userId: number;
  fullName: string;
  role?: string;
  avatarUrl?: string;
}

export interface TeamMember {
  userId: number;
  fullName: string;
  avatarUrl?: string;
}

export interface TeamData {
  teamId: number;
  teamName: string;
  description?: string;
  imageUrl?: string;
  leaders: TeamLeader[];
  members?: TeamMember[];
}
