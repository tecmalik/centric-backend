import { createModel } from '../../db/model';

export interface IMatch {
  package: string;
  journey: string;
  matchScore: number;
  estimatedDetour: number; // Detour distance in km
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
}

export const Match = createModel({
  table: 'matches',
  dates: ['createdAt', 'updatedAt'],
});