import { createModel } from '../../db/model';

export interface ITrustScoreLog {
  _id: string;
  traveler: string;
  score: number;
  delta: number;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<any>;
  toJSON(): any;
}

export const TrustScoreLog = createModel<ITrustScoreLog>({
  name: 'TrustScoreLog',
  table: 'trust_score_logs',
  dates: ['createdAt', 'updatedAt'],
  populate: {
    traveler: { modelName: 'User', key: 'traveler' },
  },
});
