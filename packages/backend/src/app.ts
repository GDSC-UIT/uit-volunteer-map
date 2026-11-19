import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { adminRouter } from './routes/admin.route.js';
import { leaderRouter } from './routes/leader.route.js';
import { campaignRouter } from './routes/campaign.js';
import { userRouter } from './routes/user.route.js';
import { postRouter } from './routes/post.js';
import { teamRouter } from './routes/team.route.js';
import { accountRouter } from './routes/account.route.js';
import { verifyTokenRouter } from './routes/verify-token.js';
import { httpPolicy } from './config/http.js';
import { HttpError } from './errors/HttpError.js';
import { loginLimit } from './middleware/loginLimit.js';
import { mountFrontend } from './config/frontend.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const app = express();
const policy = httpPolicy();
const servingFrontend = process.env.SERVE_FRONTEND === 'true';
app.set('trust proxy', false);
app.disable('x-powered-by');

// Middleware
app.use(helmet(servingFrontend ? {
  contentSecurityPolicy: {
    directives: {
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'connect-src': ["'self'", 'https://api.cloudinary.com'],
      'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
} : undefined));
app.use((req, _res, next) => {
  const origin = req.headers.origin;
  if (origin && !policy.origins.includes(origin)) { next(new HttpError('Origin is not allowed.', 403)); return; }
  next();
});
app.use(cors({ origin: policy.origins, methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Authorization','Content-Type'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.post('/api/auth/login', loginLimit({ max: policy.loginMax, windowMs: policy.loginWindowMs }));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/leader', leaderRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);
app.use('/api/teams', teamRouter);
app.use('/api/accounts', accountRouter);
app.use('/api', verifyTokenRouter);

if (servingFrontend) mountFrontend(app);

// Error handling
app.use(errorHandler);

export default app;
