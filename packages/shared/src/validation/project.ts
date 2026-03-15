import { z } from 'zod';

export const projectStatusSchema = z.enum(['active', 'completed', 'archived']);

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  client_name: z.string().optional(),
  status: projectStatusSchema.default('active'),
  notes: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
