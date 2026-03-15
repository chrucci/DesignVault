import { z } from 'zod';

export const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type RoomFormValues = z.infer<typeof roomSchema>;

export const roomProductSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').default(1),
  notes: z.string().optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type RoomProductFormValues = z.infer<typeof roomProductSchema>;
