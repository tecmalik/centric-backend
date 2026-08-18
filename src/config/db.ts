import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/centric_mvp';
    console.log(`Connecting to MongoDB at: ${connUri}`);
    await mongoose.connect(connUri);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
