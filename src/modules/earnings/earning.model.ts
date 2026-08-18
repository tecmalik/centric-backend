import { Schema, model, Document, Types } from 'mongoose';

export interface IEarning extends Document {
  traveler: Types.ObjectId;
  delivery: Types.ObjectId;
  amount: number; // total package value / cost
  platformFee: number; // 20%
  payoutAmount: number; // 80% to traveler
  status: 'PENDING' | 'PAID';
  createdAt: Date;
  updatedAt: Date;
}

const earningSchema = new Schema<IEarning>(
  {
    traveler: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    delivery: {
      type: Schema.Types.ObjectId,
      ref: 'Delivery',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      required: true,
      min: 0,
    },
    payoutAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

export const Earning = model<IEarning>('Earning', earningSchema);
