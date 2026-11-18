import { Router } from 'express';
import type { ApiResponse, LoginResponse } from '@uit-volunteer-map/shared';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '@uit-volunteer-map/shared';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../schemas/auth.js';
import { AuthService } from '../service/authService.js';
import { asyncRoute } from '../middleware/asyncRoute.js';

const router = Router();
const authService = new AuthService();

router.post('/login', validate(loginSchema), asyncRoute(async (req, res) => {
  const result = await authService.login(req.body);
  const response: ApiResponse<LoginResponse> = {
    success: true,
    data: result,
  };
  res.status(HTTP_STATUS.OK).json(response);
}));

router.post('/logout', (_req, res) => {
  const response: ApiResponse<null> = {
    success: true,
    message: SUCCESS_MESSAGES.LOGGED_OUT,
  };
  res.status(HTTP_STATUS.OK).json(response);
});

export { router as authRouter };
