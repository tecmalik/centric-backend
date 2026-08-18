import { Schema, model, Document, Types } from 'mongoose';

export interface IVerification extends Document {
  user: Types.ObjectId;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documentType: string;
  documentNumber: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const verificationSchema = new Schema<IVerification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    documentType: {
      type: String,
      required: true,
    },
    documentNumber: {
      type: String,
      required: true,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Verification = model<IVerification>('Verification', verificationSchema);
