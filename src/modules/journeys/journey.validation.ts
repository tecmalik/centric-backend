import { z } from 'zod';

export const createJourneySchema = z.object({
  body: z.object({
    origin: z.object({
      name: z.string().min(1, 'Origin name is required'),
      coordinates: z.tuple([z.number(), z.number()]).describe('Longitude, Latitude coordinates'),
    }),
    destination: z.object({
      name: z.string().min(1, 'Destination name is required'),
      coordinates: z.tuple([z.number(), z.number()]).describe('Longitude, Latitude coordinates'),
    }),
    departureTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid departure time format',
    }),
    availableCapacity: z.number().positive('Available capacity must be greater than zero'),
  }),
});
