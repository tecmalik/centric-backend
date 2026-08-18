import { Schema, model, Document, Types } from 'mongoose';

export interface ITravelerProfile extends Document {
  user: Types.ObjectId;
  isVerified: boolean;
  verificationDetails?: {
    documentType?: string;
    documentNumber?: string;
    verifiedAt?: Date;
  };
  trustScore: number; // 0 to 100
  completedDeliveries: number;
  createdAt: Date;
  updatedAt: Date;
}

const travelerProfileSchema = new Schema<ITravelerProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDetails: {
      documentType: String,
      documentNumber: String,
      verifiedAt: Date,
    },
    trustScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    completedDeliveries: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const TravelerProfile = model<ITravelerProfile>('TravelerProfile', travelerProfileSchema);
