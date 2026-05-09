import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import type { ApiResponse } from '@uit-volunteer-map/shared';
import { HTTP_STATUS, ERROR_MESSAGES } from '@uit-volunteer-map/shared';

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues
        .map((e) => `${e.path.join('.') || 'field'}: ${e.message}`)
        .join(', ');

      const response: ApiResponse<null> = {
        success: false,
        error: ERROR_MESSAGES.VALIDATION_FAILED,
        message: errors,
      };
      res.status(HTTP_STATUS.BAD_REQUEST).json(response);
      return;
    }

    req.body = result.data;
    next();
  };
}
