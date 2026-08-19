import { createModel } from '../../db/model';

export interface IMatch {
  _id: string;
  package: any;
  journey: any;
  matchScore: number;
  estimatedDetour: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<any>;
  toJSON(): any;
}

export const Match = createModel<IMatch>({
  name: 'Match',
  table: 'matches',
  dates: ['createdAt', 'updatedAt'],
  populate: {
    package: { modelName: 'Package', key: 'package' },
    journey: { modelName: 'Journey', key: 'journey' },
  },
});
