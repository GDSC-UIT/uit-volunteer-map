import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { HTTP_STATUS } from '@uit-volunteer-map/shared';
const router = Router();
router.get('/verify', authenticateToken, (_req, res) => {
  res.status(HTTP_STATUS.OK).json({ success: true, data: { isExpired: false } });
});
export { router as verifyTokenRouter };
