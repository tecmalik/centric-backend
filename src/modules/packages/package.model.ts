import { createModel } from '../../db/model';

export interface IPackage {
  _id: string;
  user: string;
  pickupLocation: {
    name: string;
    coordinates: [number, number];
  };
  destination: {
    name: string;
    coordinates: [number, number];
  };
  description: string;
  category: string;
  weight: number;
  declaredValue: number;
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
  save(): Promise<any>;
  toJSON(): any;
}

export const Package = createModel<IPackage>({
  name: 'Package',
  table: 'packages',
  dates: ['createdAt', 'updatedAt'],
  populate: {
    user: { modelName: 'User', key: 'user' },
  },
});
