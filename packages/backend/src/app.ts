import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { adminRouter } from './routes/admin.route.js';
import { leaderRouter } from './routes/leader.route.js';
import { campaignRouter } from './routes/campaign.js';
import { userRouter } from './routes/user.route.js';
import { postRouter } from './routes/post.js';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/leader', leaderRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);

// Error handling
app.use(errorHandler);

export default app;
