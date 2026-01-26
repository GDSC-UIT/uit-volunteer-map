import { Router } from 'express';
import { RoleEnum } from '@uit-volunteer-map/shared';
import { requireRole } from '../middleware/auth.js';
import { authenticateTokenDoc } from '../middleware/profileAuth.js';
import { updateUserProfileSchema } from '../schemas/userProfile.js';
import { UserProfileService } from '../service/userProfileService.js';

const router = Router();
const service = new UserProfileService();

const ALLOWED_KEYS = new Set(['FullName', 'Mssv', 'Class', 'Email', 'PhoneNumber']);
const FIELD_MAP: Record<string, string> = {
  FullName: 'fullName',
  Mssv: 'mssv',
  Class: 'class',
  Email: 'email',
  PhoneNumber: 'phoneNumber',
};

function forbidden(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const keys = Object.keys(body as Record<string, unknown>);
  const lowered = keys.map((k) => k.toLowerCase());
  if (lowered.includes('userid') || lowered.includes('role')) return true;
  return keys.some((k) => !ALLOWED_KEYS.has(k));
}

router.get(
  '/profile',
  authenticateTokenDoc,
  requireRole([RoleEnum.ADMIN, RoleEnum.LEADER]),
  async (req, res) => {
    try {
      const data = await service.getUserProfile(req.user!.accId);
      return res.status(200).json({ code: 200, message: 'User detail', data });
    } catch (err: any) {
      if (err?.statusCode === 404) {
        return res.status(404).json({ code: 404, error: 'Not Found', message: err.message });
      }
      return res.status(500).json({ code: 500, error: 'Internal Server Error' });
    }
  }
);

router.put(
  '/profile',
  authenticateTokenDoc,
  requireRole([RoleEnum.ADMIN, RoleEnum.LEADER]),
  async (req, res) => {
    try {
      if (forbidden(req.body)) {
        return res.status(403).json({
          code: 403,
          error: 'Forbidden',
          message: 'You are not allowed to update this user profile.',
        });
      }

      const parsed = updateUserProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => {
          const raw = String(i.path[0] ?? 'field');
          return { field: FIELD_MAP[raw] ?? raw.toLowerCase(), issue: i.message };
        });

        return res.status(400).json({
          code: 400,
          error: 'Bad Request',
          message: 'Validation failed',
          details,
        });
      }

      const data = await service.updateUserProfile(req.user!.accId, parsed.data);
      return res.status(200).json({ code: 200, message: 'User detail', data });
    } catch (err: any) {
      if (err?.statusCode === 404) {
        return res.status(404).json({ code: 404, error: 'Not Found', message: err.message });
      }
      if (err?.statusCode === 409) {
        return res.status(409).json({ code: 409, error: 'Conflict', message: err.message });
      }
      return res.status(500).json({ code: 500, error: 'Internal Server Error' });
    }
  }
);

export { router as userRouter };
