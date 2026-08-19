import { z } from 'zod';

export const verifySchema = z.object({
  body: z.object({
    documentType: z.string().min(2, 'Document type is required'),
    documentNumber: z.string().min(4, 'Document number must be valid'),
  }),
});
