import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import {
  RoleEnum,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@uit-volunteer-map/shared";

const router = Router();

router.get(
  "/leader-only",
  authenticateToken,
  requireRole([RoleEnum.LEADER, RoleEnum.VICELEADER]),
  async (_req, res) => {
    res
      .status(HTTP_STATUS.OK)
      .json({ success: true, message: SUCCESS_MESSAGES.LEADER_ACCESS_GRANTED });
  },
);

export { router as leaderRouter };
