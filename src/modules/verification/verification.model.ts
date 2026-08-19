import { createModel } from '../../db/model';

export interface IVerification {
  user: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documentType: string;
  documentNumber: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const Verification = createModel({
  table: 'verifications',
  dates: ['verifiedAt', 'createdAt', 'updatedAt'],
});