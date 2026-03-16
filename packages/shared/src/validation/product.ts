import { z } from 'zod';

export const stockStatusSchema = z.enum(['in_stock', 'out_of_stock', 'special_order', 'unknown']);

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  brand: z.string().optional(),
  model_sku: z.string().optional(),
  source_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  wholesale_price: z.coerce.number().min(0, 'Price must be positive').optional(),
  markup_percent: z.coerce.number().min(0).max(999).default(55),
  dimensions_width: z.string().optional(),
  dimensions_depth: z.string().optional(),
  dimensions_height: z.string().optional(),
  dimensions_text: z.string().optional(),
  materials: z.string().optional(),
  color: z.string().optional(),
  stock_status: stockStatusSchema.default('unknown'),
  shipping_cost: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  install_notes: z.string().optional(),
  spec_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const clipProductSchema = productSchema.extend({
  image_urls: z.array(z.string().url()).optional(),
  project_id: z.string().uuid().optional(),
  room_id: z.string().uuid().optional(),
});

export type ClipProductFormValues = z.infer<typeof clipProductSchema>;
