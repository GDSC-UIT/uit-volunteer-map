import { z } from 'zod';

export const updateImageOrderSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    order: z.number().int().nonnegative() 
  })
);

export type UpdateImageOrderInput = z.infer<typeof updateImageOrderSchema>;