import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../db/data-source.js';
import { Account } from '../entities/Account.js';
import { HttpError } from '../errors/HttpError.js';
import { RoleEnum, AUTH_ERRORS, HTTP_STATUS, type JwtPayload, type AuthUser } from '@uit-volunteer-map/shared';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
    authUser?: AuthUser;
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.match(/^Bearer ([^\s]+)$/i)?.[1];

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: AUTH_ERRORS.TOKEN_REQUIRED });
  }

  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    next(new HttpError(AUTH_ERRORS.JWT_SECRET_MISSING, HTTP_STATUS.INTERNAL_SERVER_ERROR));
    return;
  }

  let accId: number;
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || !Number.isSafeInteger(payload.accId) || payload.accId <= 0 ||
        !Number.isFinite(payload.exp)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: AUTH_ERRORS.TOKEN_INVALID });
    }
    accId = payload.accId;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: AUTH_ERRORS.TOKEN_EXPIRED });
    }
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: AUTH_ERRORS.TOKEN_INVALID });
  }
  try {
    const account = await AppDataSource.getRepository(Account).findOne({
      where: { accId, isDeleted: false }, relations: ['role'],
    });
    const role = account?.role?.roleName;
    if (!account || (role !== RoleEnum.ADMIN && role !== RoleEnum.LEADER)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, error: AUTH_ERRORS.TOKEN_INVALID });
    }
    req.user = { accId: account.accId, role };
    req.authUser = { accId: account.accId, username: account.username, role };
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: RoleEnum[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role as RoleEnum)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, error: AUTH_ERRORS.PERMISSION_DENIED });
    }
    next();
  };
};
