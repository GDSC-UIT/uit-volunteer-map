/**
 * Role enum - source of truth for user roles
 * Used by both frontend and backend
 */
export enum RoleEnum {
  ADMIN = "admin",
  LEADER = "leader",
  VICELEADER = "viceleader",
}

export type UserRole = `${RoleEnum}`;
