import { z } from 'zod';
import { UpdateUserRequestBody } from '../../types/api.types';
import { UserRole } from '../../models/user.model';

export const userIdSchema = z.object({
  id: z.string().uuid(),
}) satisfies z.ZodType<{ id: string }>;

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum([UserRole.ADMIN, UserRole.USER]).optional(),
}) satisfies z.ZodType<UpdateUserRequestBody>;
