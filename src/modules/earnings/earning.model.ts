import { createModel } from '../../db/model';

export interface IEarning {
  _id: string;
  traveler: string;
  delivery: string;
  amount: number;
  platformFee: number;
  payoutAmount: number;
  status: 'PENDING' | 'PAID';
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<any>;
  toJSON(): any;
}

export const Earning = createModel<IEarning>({
  name: 'Earning',
  table: 'earnings',
  dates: ['createdAt', 'updatedAt'],
  populate: {
    traveler: { modelName: 'User', key: 'traveler' },
    delivery: { modelName: 'Delivery', key: 'delivery' },
  },
});
