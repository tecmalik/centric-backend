import { Schema, model, Document, Types } from 'mongoose';

export interface IPackage extends Document {
  user: Types.ObjectId; // Sender
  pickupLocation: {
    name: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  destination: {
    name: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  description: string;
  category: string;
  weight: number; // in kg
  declaredValue: number; // in NGN
  recipient: {
    name: string;
    phone: string;
  };
  status:
    | 'CREATED'
    | 'MATCHED'
    | 'ACCEPTED'
    | 'PICKED_UP'
    | 'IN_TRANSIT'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

const packageSchema = new Schema<IPackage>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pickupLocation: {
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
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
    },
    declaredValue: {
      type: Number,
      required: true,
      min: 0,
    },
    recipient: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    status: {
      type: String,
      enum: [
        'CREATED',
        'MATCHED',
        'ACCEPTED',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'CREATED',
    },
  },
  {
    timestamps: true,
  }
);

packageSchema.index({ 'pickupLocation.coordinates': '2dsphere' });
packageSchema.index({ 'destination.coordinates': '2dsphere' });

export const Package = model<IPackage>('Package', packageSchema);
