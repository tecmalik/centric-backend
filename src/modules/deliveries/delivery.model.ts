import { createModel } from '../../db/model';

export interface IDelivery {
  package: string;
  journey: string;
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
      coordinates: [number, number]; // [lng, lat]
    };
    note?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const Delivery = createModel({
  table: 'deliveries',
  dates: ['otpExpiresAt', 'createdAt', 'updatedAt'],
});