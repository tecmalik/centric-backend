import { z } from 'zod';

export const createPackageSchema = z.object({
  body: z.object({
    pickupLocation: z.object({
      name: z.string().min(1, 'Pickup location name is required'),
      coordinates: z.tuple([z.number(), z.number()]).describe('Longitude, Latitude coordinates'),
    }),
    destination: z.object({
      name: z.string().min(1, 'Destination name is required'),
      coordinates: z.tuple([z.number(), z.number()]).describe('Longitude, Latitude coordinates'),
    }),
    description: z.string().min(1, 'Description is required'),
    category: z.string().min(1, 'Category is required'),
    weight: z.number().positive('Weight must be greater than zero'),
    declaredValue: z.number().positive('Declared value must be greater than zero'),
    recipient: z.object({
      name: z.string().min(1, 'Recipient name is required'),
      phone: z.string().min(10, 'Recipient phone must be valid'),
    }),
  }),
});
