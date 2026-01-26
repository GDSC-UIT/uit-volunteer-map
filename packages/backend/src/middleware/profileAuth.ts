import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "@uit-volunteer-map/shared";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticateTokenDoc(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({
      code: 401,
      error: "Unauthorized",
      message: "Invalid authentication credentials",
      error_code: "TOKEN_INVALID",
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ code: 500, error: "Internal Server Error" });
  }

  try {
    req.user = jwt.verify(token, secret) as JwtPayload;
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        code: 401,
        error: "Unauthorized",
        message: "Access token has expired",
        error_code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      code: 401,
      error: "Unauthorized",
      message: "Invalid authentication credentials",
      error_code: "TOKEN_INVALID",
    });
  }
}
