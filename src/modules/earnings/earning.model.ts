import { createModel } from '../../db/model';

export interface IEarning {
  traveler: string;
  delivery: string;
  amount: number; // total package value / cost
  platformFee: number; // 20%
  payoutAmount: number; // 80% to traveler
  status: 'PENDING' | 'PAID';
  createdAt: Date;
  updatedAt: Date;
}

export const Earning = createModel({
  table: 'earnings',
  dates: ['createdAt', 'updatedAt'],
});