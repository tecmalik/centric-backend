import { createModel } from '../../db/model';

export interface ITravelerProfile {
  user: string;
  isVerified: boolean;
  verificationDetails?: {
    documentType?: string;
    documentNumber?: string;
    verifiedAt?: Date;
  };
  trustScore: number; // 0 to 100
  completedDeliveries: number;
  createdAt: Date;
  updatedAt: Date;
}

export const TravelerProfile = createModel({
  table: 'traveler_profiles',
  dates: ['createdAt', 'updatedAt'],
});