import { Router } from 'express';
import jwt from 'jsonwebtoken'; 
import { HTTP_STATUS, type ApiResponse } from '@uit-volunteer-map/shared';

const router = Router();

interface VerifyData {
  isExpired: boolean;
}

router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'No token provided'
    };
    return res.status(HTTP_STATUS.OK).json(response);
  }

  try {
    const secret = process.env.JWT_SECRET as string;
    jwt.verify(token, secret);

    const response: ApiResponse<VerifyData> = {
      success: true,
      data: {
        isExpired: false
      }
    };
    return res.status(HTTP_STATUS.OK).json(response);

  } catch (error: any) {
    const response: ApiResponse<VerifyData> = {
      success: true,
      data: {
        isExpired: true
      }
    };
        return res.status(HTTP_STATUS.OK).json(response);
  }
});

export { router as verifyTokenRouter };