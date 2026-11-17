import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { RoleEnum, HTTP_STATUS, SUCCESS_MESSAGES } from '@uit-volunteer-map/shared';
import { TeamService } from '../service/teamService.js';
import { optionalReadId } from '../schemas/read.js';
import { HttpError } from '../errors/HttpError.js';

const router = Router();
const teams = new TeamService();

router.use(authenticateToken, requireRole([RoleEnum.ADMIN]));
for (const path of ['/teams', '/team-leaders'] as const) {
  router.get(path, async (req, res) => {
    try {
      const data = path === '/teams' ? await teams.getManagementTeams({campaignId:optionalReadId(req.query.campaignId,'campaign')}) : await teams.getLeaderOptions();
      res.json({success:true,data});
    } catch (error: unknown) {
      res.status(error instanceof HttpError ? error.statusCode : 500).json({success:false,error:error instanceof HttpError ? error.message : 'Internal server error'});
    }
  });
}

router.get(
  '/admin-only',
  async (_req, res) => {
    res.status(HTTP_STATUS.OK).json({ success: true, message: SUCCESS_MESSAGES.ADMIN_ACCESS_GRANTED });
  }
);

export { router as adminRouter };
