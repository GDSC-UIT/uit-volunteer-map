import { Router } from 'express';
import { HTTP_STATUS, HEALTH_MESSAGES } from '@uit-volunteer-map/shared';
import type { ApiResponse } from '@uit-volunteer-map/shared';
import { databaseReady } from '../config/readiness.js';
import { AppDataSource } from '../db/data-source.js';
import { asyncRoute } from '../middleware/asyncRoute.js';

const router = Router();

// Render probes liveness frequently. Keep those requests from waking Neon.
router.get('/live', (_req, res) => { res.sendStatus(200); });

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
}

router.get('/', asyncRoute(async (_req, res) => {
  const ready = await databaseReady(AppDataSource);
  const response: ApiResponse<HealthData> = {
    success: ready,
    data: {
      status: ready ? HEALTH_MESSAGES.STATUS_HEALTHY : 'not-ready',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    message: ready ? HEALTH_MESSAGES.SERVER_RUNNING : 'Database is not ready.',
  };

  res.status(ready ? HTTP_STATUS.OK : 503).json(response);
}));

export { router as healthRouter };
