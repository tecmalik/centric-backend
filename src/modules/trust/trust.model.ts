import { Schema, model, Document, Types } from 'mongoose';

export interface ITrustScoreLog extends Document {
  traveler: Types.ObjectId; // References the User (with TRAVELER role)
  score: number; // The new score value
  delta: number; // The change in score (e.g. +10, -15)
  reason: string; // The reason for the change
  createdAt: Date;
  updatedAt: Date;
}

const trustScoreSchema = new Schema<ITrustScoreLog>(
  {
    traveler: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    delta: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TrustScoreLog = model<ITrustScoreLog>('TrustScoreLog', trustScoreSchema);
