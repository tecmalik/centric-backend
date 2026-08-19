import { createModel } from '../../db/model';

export interface IJourney {
  user: string;
  origin: {
    name: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  destination: {
    name: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  departureTime: Date;
  availableCapacity: number; // in kg
  status: 'CREATED' | 'MATCHED' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

export const Journey = createModel({
  table: 'journeys',
  dates: ['departureTime', 'createdAt', 'updatedAt'],
});