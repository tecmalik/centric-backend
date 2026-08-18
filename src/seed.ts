import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from './modules/users/user.model';
import { TravelerProfile } from './modules/users/traveler.model';
import { Journey } from './modules/journeys/journey.model';
import { Package } from './modules/packages/package.model';
import { Match } from './modules/matching/match.model';
import { Delivery } from './modules/deliveries/delivery.model';
import { Earning } from './modules/earnings/earning.model';
import { Evidence } from './modules/evidence/evidence.model';
import { Verification } from './modules/verification/verification.model';
import { TrustScoreLog } from './modules/trust/trust.model';

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/centric_mvp';
    console.log(`Connecting to database for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing database collection data...');
    await User.deleteMany({});
    await TravelerProfile.deleteMany({});
    await Journey.deleteMany({});
    await Package.deleteMany({});
    await Match.deleteMany({});
    await Delivery.deleteMany({});
    await Earning.deleteMany({});
    await Evidence.deleteMany({});
    await Verification.deleteMany({});
    await TrustScoreLog.deleteMany({});

    console.log('Seeding initial data...');

    // 1. Create Sender
    const sender = await User.create({
      name: 'Adeola Sender',
      email: 'sender@centric.com',
      password: 'password123',
      role: 'SENDER',
      phone: '+2348011111111',
    });
    console.log(`Sender seeded: ${sender.email}`);

    // 2. Create Traveler
    const traveler = await User.create({
      name: 'Tunde Traveler',
      email: 'traveler@centric.com',
      password: 'password123',
      role: 'TRAVELER',
      phone: '+2348022222222',
    });
    console.log(`Traveler seeded: ${traveler.email}`);

    // 3. Setup Traveler profile and mock verify
    const travelerProfile = await TravelerProfile.create({
      user: traveler._id,
      isVerified: true,
      trustScore: 70, // starts at 50 + 20 for verification
      completedDeliveries: 0,
      verificationDetails: {
        documentType: 'NIN',
        documentNumber: 'NIN-999888777',
        verifiedAt: new Date(),
      },
    });

    await Verification.create({
      user: traveler._id,
      status: 'VERIFIED',
      documentType: 'NIN',
      documentNumber: 'NIN-999888777',
      verifiedAt: new Date(),
    });

    await TrustScoreLog.create({
      traveler: traveler._id,
      score: 70,
      delta: 20,
      reason: 'Traveler identity verified successfully (Seeded)',
    });
    console.log(`Traveler profile verified and Trust Score set to 70.`);

    // 4. Create Yaba -> Ikeja Journey for Traveler
    // Coordinates: Yaba (lng: 3.3792, lat: 6.5095), Ikeja (lng: 3.3505, lat: 6.6018)
    const departure = new Date();
    departure.setDate(departure.getDate() + 2); // 2 days in future
    const journey = await Journey.create({
      user: traveler._id,
      origin: {
        name: 'Yaba, Lagos',
        coordinates: [3.3792, 6.5095],
      },
      destination: {
        name: 'Ikeja, Lagos',
        coordinates: [3.3505, 6.6018],
      },
      departureTime: departure,
      availableCapacity: 20, // 20kg
      status: 'CREATED',
    });
    console.log(`Traveler journey seeded: ${journey.origin.name} -> ${journey.destination.name}`);

    // 5. Create a pre-seeded package (Optional, to show matching on load)
    const testPackage = await Package.create({
      user: sender._id,
      pickupLocation: {
        name: 'Yaba, Lagos',
        coordinates: [3.3792, 6.5095],
      },
      destination: {
        name: 'Ikeja, Lagos',
        coordinates: [3.3505, 6.6018],
      },
      description: 'Medical supplies box',
      category: 'MEDICAL',
      weight: 3.5, // kg
      declaredValue: 15000,
      recipient: {
        name: 'Chioma Recipient',
        phone: '+2348033333333',
      },
      status: 'CREATED',
    });
    console.log(`Sample package seeded: ${testPackage.description}`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
