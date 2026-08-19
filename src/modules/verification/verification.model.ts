import { createModel } from '../../db/model';

export interface IVerification {
  _id: string;
  user: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documentType: string;
  documentNumber: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<any>;
  toJSON(): any;
}

export const Verification = createModel<IVerification>({
  name: 'Verification',
  table: 'verifications',
  dates: ['createdAt', 'updatedAt', 'verifiedAt'],
  populate: {
    user: { modelName: 'User', key: 'user' },
  },
});
