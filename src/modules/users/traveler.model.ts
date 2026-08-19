import { createModel } from '../../db/model';

export interface ITravelerProfile {
  _id: string;
  user: string;
  isVerified: boolean;
  verificationDetails?: {
    documentType?: string;
    documentNumber?: string;
    verifiedAt?: Date;
  };
  trustScore: number;
  completedDeliveries: number;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<any>;
  toJSON(): any;
}

export const TravelerProfile = createModel<ITravelerProfile>({
  name: 'TravelerProfile',
  table: 'traveler_profiles',
  dates: ['createdAt', 'updatedAt'],
  populate: {
    user: { modelName: 'User', key: 'user' },
  },
});
