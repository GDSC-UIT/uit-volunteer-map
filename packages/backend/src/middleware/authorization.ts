import type { NextFunction, Request, Response } from "express";
import {
  AUTH_ERRORS,
  HTTP_STATUS,
  RoleEnum,
  type JwtPayload,
} from "@uit-volunteer-map/shared";

type RolePermissionMap = Record<string, Record<string, readonly RoleEnum[]>>;

export const ROLE_PERMISSIONS = {
  campaign: {
    create: [RoleEnum.ADMIN],
    update: [RoleEnum.ADMIN],
    delete: [RoleEnum.ADMIN],
  },
  post: {
    create: [RoleEnum.ADMIN, RoleEnum.LEADER],
    update: [RoleEnum.ADMIN, RoleEnum.LEADER],
    delete: [RoleEnum.ADMIN, RoleEnum.LEADER],
    addPhoto: [RoleEnum.ADMIN, RoleEnum.LEADER],
  },
  team: {
    create: [RoleEnum.ADMIN],
    update: [RoleEnum.ADMIN, RoleEnum.LEADER],
    delete: [RoleEnum.ADMIN],
    addAttachments: [RoleEnum.ADMIN, RoleEnum.LEADER],
  },
} as const satisfies RolePermissionMap;

const hasAllowedRole = (
  user: JwtPayload | undefined,
  allowedRoles: readonly RoleEnum[],
) => Boolean(user && allowedRoles.includes(user.role as RoleEnum));

export const authorizeRoles = (allowedRoles: readonly RoleEnum[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, error: AUTH_ERRORS.TOKEN_REQUIRED });
      return;
    }

    if (!hasAllowedRole(req.user, allowedRoles)) {
      res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ success: false, error: AUTH_ERRORS.PERMISSION_DENIED });
      return;
    }

    next();
  };
};

export const requireRole = authorizeRoles;
