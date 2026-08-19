import { createModel } from '../../db/model';

export interface IDelivery {
  _id: string;
  package: any;
  journey: any;
  traveler: string;
  sender: string;
  status:
    | 'ASSIGNED'
    | 'PICKED_UP'
    | 'IN_TRANSIT'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED';
  otp: string;
  otpExpiresAt: Date;
  otpFailedAttempts: number;
  pickupEvidence?: {
    photoUrl: string;
    timestamp: Date;
    gps: {
      coordinates: [number, number];
    };
    note?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<any>;
  toJSON(): any;
}

export const Delivery = createModel<IDelivery>({
  name: 'Delivery',
  table: 'deliveries',
  dates: ['createdAt', 'updatedAt', 'otpExpiresAt'],
  populate: {
    package: { modelName: 'Package', key: 'package' },
    journey: { modelName: 'Journey', key: 'journey' },
    traveler: { modelName: 'User', key: 'traveler' },
    sender: { modelName: 'User', key: 'sender' },
  },
});
