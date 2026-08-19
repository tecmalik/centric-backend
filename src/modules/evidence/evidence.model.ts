import { createModel } from '../../db/model';

export interface IEvidence {
  delivery: string;
  photoUrl: string;
  timestamp: Date;
  gps: {
    coordinates: [number, number]; // [lng, lat]
  };
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const Evidence = createModel({
  table: 'evidence',
  dates: ['timestamp', 'createdAt', 'updatedAt'],
});