import { Schema, model, Document, Types } from 'mongoose';

export interface IMatch extends Document {
  package: Types.ObjectId;
  journey: Types.ObjectId;
  matchScore: number;
  estimatedDetour: number; // Detour distance in km
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    package: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    journey: {
      type: Schema.Types.ObjectId,
      ref: 'Journey',
      required: true,
    },
    matchScore: {
      type: Number,
      required: true,
    },
    estimatedDetour: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

// Compounded index to make sure matches are queried efficiently and uniquely per package/journey
matchSchema.index({ package: 1, journey: 1 }, { unique: true });

export const Match = model<IMatch>('Match', matchSchema);
