import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { TeamService } from '../service/teamService.js';
import { HttpError } from '../errors/HttpError.js';
import { RoleEnum, HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@uit-volunteer-map/shared';

const router = Router();
const teamService = new TeamService();

router.get(
  '/leader-only',
  authenticateToken,
  requireRole([RoleEnum.LEADER]),
  async (_req, res) => {
    res.status(HTTP_STATUS.OK).json({ success: true, message: SUCCESS_MESSAGES.LEADER_ACCESS_GRANTED });
  }
);

router.get('/team', authenticateToken, requireRole([RoleEnum.LEADER]), async (req, res) => {
  try {
    const data = await teamService.getOwnTeam(req.user!);
    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (error) {
    if (error instanceof HttpError) return res.status(error.statusCode).json({ success: false, error: error.message });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

export { router as leaderRouter };
