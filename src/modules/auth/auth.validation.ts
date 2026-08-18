import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['SENDER', 'TRAVELER'], {
      required_error: 'Role must be SENDER or TRAVELER',
    }),
    phone: z.string().min(10, 'Phone number must be valid'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});
