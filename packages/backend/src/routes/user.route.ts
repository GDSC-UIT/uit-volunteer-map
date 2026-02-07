import { Router } from "express";
import {
  RoleEnum,
  HTTP_STATUS,
  ERROR_MESSAGES,
  USER_PROFILE_FIELDS,
} from "@uit-volunteer-map/shared";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { updateUserProfileSchema } from "../schemas/userProfile.js";
import { UserProfileService } from "../service/userProfileService.js";
import { HttpError } from "../errors/HttpError.js";

const router = Router();
const service = new UserProfileService();

const ALLOWED_KEYS = new Set<string>(USER_PROFILE_FIELDS);

function forbidden(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const keys = Object.keys(body as Record<string, unknown>);
  const lowered = keys.map((k) => k.toLowerCase());
  if (lowered.includes("userid") || lowered.includes("role")) return true;
  return keys.some((k) => !ALLOWED_KEYS.has(k));
}

router.get(
  "/profile",
  authenticateToken,
  requireRole([RoleEnum.ADMIN, RoleEnum.LEADER, RoleEnum.VICELEADER]),
  async (req, res) => {
    try {
      const data = await service.getUserProfile(req.user!.accId);
      return res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        return res
          .status(err.statusCode)
          .json({ success: false, error: err.message });
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

router.put(
  "/profile",
  authenticateToken,
  requireRole([RoleEnum.ADMIN, RoleEnum.LEADER, RoleEnum.VICELEADER]),
  async (req, res) => {
    try {
      if (forbidden(req.body)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.FORBIDDEN_FIELD,
        });
      }

      const parsed = updateUserProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.issues
          .map((i) => `${i.path.join(".") || "field"}: ${i.message}`)
          .join(", ");

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: ERROR_MESSAGES.VALIDATION_FAILED,
          message: errors,
        });
      }

      const data = await service.updateUserProfile(
        req.user!.accId,
        parsed.data,
      );
      return res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        return res
          .status(err.statusCode)
          .json({ success: false, error: err.message });
      }
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

export { router as userRouter };
