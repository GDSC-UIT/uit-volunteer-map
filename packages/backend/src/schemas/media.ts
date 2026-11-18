import { z } from 'zod';
export const imageUrlSchema = z.string().url('Invalid image URL').refine(value => /^https?:\/\//i.test(value), 'Image URL must use HTTP or HTTPS');
