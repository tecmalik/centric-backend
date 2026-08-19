import { createModel } from '../../db/model';

export interface IPackage {
  user: string; // Sender
  pickupLocation: {
    name: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  destination: {
    name: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  description: string;
  category: string;
  weight: number; // in kg
  declaredValue: number; // in NGN
  recipient: {
    name: string;
    phone: string;
  };
  status:
    | 'CREATED'
    | 'MATCHED'
    | 'ACCEPTED'
    | 'PICKED_UP'
    | 'IN_TRANSIT'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

export const Package = createModel({
  table: 'packages',
  dates: ['createdAt', 'updatedAt'],
});