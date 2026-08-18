import { Schema, model, Document, Types } from 'mongoose';

export interface IDelivery extends Document {
  package: Types.ObjectId;
  journey: Types.ObjectId;
  traveler: Types.ObjectId;
  sender: Types.ObjectId;
  status:
    | 'ASSIGNED'
    | 'PICKED_UP'
    | 'IN_TRANSIT'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED';
  otp: string;
  otpExpiresAt: Date;
  otpFailedAttempts: number;
  pickupEvidence?: {
    photoUrl: string;
    timestamp: Date;
    gps: {
      coordinates: [number, number]; // [lng, lat]
    };
    note?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const deliverySchema = new Schema<IDelivery>(
  {
    package: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
      unique: true,
    },
    journey: {
      type: Schema.Types.ObjectId,
      ref: 'Journey',
      required: true,
    },
    traveler: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'ASSIGNED',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'ASSIGNED',
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpiresAt: {
      type: Date,
      required: true,
    },
    otpFailedAttempts: {
      type: Number,
      default: 0,
    },
    pickupEvidence: {
      photoUrl: String,
      timestamp: Date,
      gps: {
        coordinates: [Number], // [lng, lat]
      },
      note: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Delivery = model<IDelivery>('Delivery', deliverySchema);
