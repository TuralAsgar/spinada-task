import { z } from 'zod';
import { DataQueryParams } from '../../types/api.types';

export const dataSchema = z.object({
  city: z.string().min(2).max(50),
  currency: z.string().min(2).max(50),
  refresh: z.enum(['true', 'false']).optional(),
}) satisfies z.ZodType<DataQueryParams>;
