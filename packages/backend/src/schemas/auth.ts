import { z } from 'zod';
import type { LoginRequest } from '@uit-volunteer-map/shared';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password exceeds 72 UTF-8 bytes'),
}).strict() satisfies z.ZodType<LoginRequest>;

export type LoginInput = z.infer<typeof loginSchema>;
