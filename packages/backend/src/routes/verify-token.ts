import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { HTTP_STATUS } from '@uit-volunteer-map/shared';
const router = Router();
router.get('/verify', authenticateToken, (req, res) => {
  res.status(HTTP_STATUS.OK).json({ success: true, data: { isExpired: false, user: req.authUser } });
});
export { router as verifyTokenRouter };
