import { Schema, model, Document, Types } from 'mongoose';

export interface IJourney extends Document {
  user: Types.ObjectId;
  origin: {
    name: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  destination: {
    name: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  departureTime: Date;
  availableCapacity: number; // in kg
  status: 'CREATED' | 'MATCHED' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

const journeySchema = new Schema<IJourney>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    origin: {
      name: { type: String, required: true },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    destination: {
      name: { type: String, required: true },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    departureTime: {
      type: Date,
      required: true,
    },
    availableCapacity: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['CREATED', 'MATCHED', 'COMPLETED', 'CANCELLED'],
      default: 'CREATED',
    },
  },
  {
    timestamps: true,
  }
);

// Geo index for proximity matching
journeySchema.index({ 'origin.coordinates': '2dsphere' });
journeySchema.index({ 'destination.coordinates': '2dsphere' });

export const Journey = model<IJourney>('Journey', journeySchema);
