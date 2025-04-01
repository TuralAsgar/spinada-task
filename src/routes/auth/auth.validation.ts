import { z } from 'zod';
import { RegisterRequestBody, LoginRequestBody } from '../../types/api.types';

export const registerSchema = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(5),
}) satisfies z.ZodType<RegisterRequestBody>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(5),
}) satisfies z.ZodType<LoginRequestBody>;
