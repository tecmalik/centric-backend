import { Schema, model, Document, Types } from 'mongoose';

export interface IEvidence extends Document {
  delivery: Types.ObjectId;
  photoUrl: string;
  timestamp: Date;
  gps: {
    coordinates: [number, number]; // [lng, lat]
  };
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const evidenceSchema = new Schema<IEvidence>(
  {
    delivery: {
      type: Schema.Types.ObjectId,
      ref: 'Delivery',
      required: true,
    },
    photoUrl: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    gps: {
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    note: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Evidence = model<IEvidence>('Evidence', evidenceSchema);
