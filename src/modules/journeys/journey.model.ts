import { createModel } from '../../db/model';

export interface IJourney {
  _id: string;
  user: string;
  origin: {
    name: string;
    coordinates: [number, number];
  };
  destination: {
    name: string;
    coordinates: [number, number];
  };
  departureTime: Date;
  availableCapacity: number;
  status: 'CREATED' | 'MATCHED' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<any>;
  toJSON(): any;
}

export const Journey = createModel<IJourney>({
  name: 'Journey',
  table: 'journeys',
  dates: ['createdAt', 'updatedAt', 'departureTime'],
  populate: {
    user: { modelName: 'User', key: 'user' },
  },
});
