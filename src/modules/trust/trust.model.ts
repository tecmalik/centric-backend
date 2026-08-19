import { createModel } from '../../db/model';

export interface ITrustScoreLog {
  traveler: string; // References the User (with TRAVELER role)
  score: number; // The new score value
  delta: number; // The change in score (e.g. +10, -15)
  reason: string; // The reason for the change
  createdAt: Date;
  updatedAt: Date;
}

export const TrustScoreLog = createModel({
  table: 'trust_score_logs',
  dates: ['createdAt', 'updatedAt'],
});