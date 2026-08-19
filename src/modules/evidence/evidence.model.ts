import { createModel } from '../../db/model';

export interface IEvidence {
  _id: string;
  delivery: string;
  photoUrl: string;
  timestamp: Date;
  gps: {
    coordinates: [number, number];
  };
  note?: string;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<any>;
  toJSON(): any;
}

export const Evidence = createModel<IEvidence>({
  name: 'Evidence',
  table: 'evidence',
  dates: ['createdAt', 'updatedAt', 'timestamp'],
  populate: {
    delivery: { modelName: 'Delivery', key: 'delivery' },
  },
});
