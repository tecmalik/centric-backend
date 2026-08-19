import { z } from 'zod';

export const pickupEvidenceSchema = z.object({
  body: z.object({
    photoUrl: z.string().url('Please enter a valid photo URL'),
    coordinates: z.tuple([z.number(), z.number()]).describe('Longitude, Latitude coordinates'),
    note: z.string().optional(),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    otp: z.string().min(4, 'OTP must be valid').max(8, 'OTP must be valid'),
  }),
});
