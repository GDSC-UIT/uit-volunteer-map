import { Router } from 'express';
import { CampaignService } from '../service/campaignService.js';
import { validate } from '../middleware/validate.js';
import { createCampaignSchema, updateCampaignSchema } from '../schemas/campaign.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles, ROLE_PERMISSIONS } from '../middleware/authorization.js';
import { HttpError } from '../errors/HttpError.js';
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  CAMPAIGN_ERRORS,
  CAMPAIGN_MESSAGES,
} from '@uit-volunteer-map/shared';

const router = Router();
const campaignService = new CampaignService();

router.get('/', async (_req, res) => {
  try {
    const data = await campaignService.getAll();
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: CAMPAIGN_ERRORS.INVALID_ID,
      });
    }
    const data = await campaignService.getOne(id);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }
});

router.post(
  '/',
  authenticateToken,
  authorizeRoles(ROLE_PERMISSIONS.campaign.create),
  validate(createCampaignSchema),
  async (req, res) => {
    try {
      const data = await campaignService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json({ success: true, data });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ success: false, error: err.message });
      }
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles(ROLE_PERMISSIONS.campaign.update),
  validate(updateCampaignSchema),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: CAMPAIGN_ERRORS.INVALID_ID,
        });
      }
      const data = await campaignService.update(id, req.body);
      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ success: false, error: err.message });
      }
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles(ROLE_PERMISSIONS.campaign.delete),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: CAMPAIGN_ERRORS.INVALID_ID,
        });
      }
      await campaignService.delete(id);
      res.status(HTTP_STATUS.OK).json({ success: true, message: CAMPAIGN_MESSAGES.DELETED });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ success: false, error: err.message });
      }
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

export { router as campaignRouter };
