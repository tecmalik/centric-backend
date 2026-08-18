import mongoose from 'mongoose';
import { User } from '../modules/users/user.model';
import { TravelerProfile } from '../modules/users/traveler.model';
import { Journey } from '../modules/journeys/journey.model';
import { Package } from '../modules/packages/package.model';
import { Match } from '../modules/matching/match.model';
import { Delivery } from '../modules/deliveries/delivery.model';
import { Earning } from '../modules/earnings/earning.model';
import { Verification } from '../modules/verification/verification.model';
import { TrustScoreLog } from '../modules/trust/trust.model';
import { Evidence } from '../modules/evidence/evidence.model';
import { findMatchesForPackage, calculateDistance } from '../modules/matching/matching.service';

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/centric_test';

describe('Centric Backend MVP Integration Tests', () => {
  let senderId: mongoose.Types.ObjectId;
  let travelerId: mongoose.Types.ObjectId;
  let verifiedTravelerId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(TEST_MONGO_URI);
  });

  afterAll(async () => {
    // Clear all test data and close connection
    await User.deleteMany({});
    await TravelerProfile.deleteMany({});
    await Journey.deleteMany({});
    await Package.deleteMany({});
    await Match.deleteMany({});
    await Delivery.deleteMany({});
    await Earning.deleteMany({});
    await Verification.deleteMany({});
    await TrustScoreLog.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear databases before each test to keep them isolated
    await User.deleteMany({});
    await TravelerProfile.deleteMany({});
    await Journey.deleteMany({});
    await Package.deleteMany({});
    await Match.deleteMany({});
    await Delivery.deleteMany({});
    await Earning.deleteMany({});
    await Verification.deleteMany({});
    await TrustScoreLog.deleteMany({});

    // Seed test users
    const sender = await User.create({
      name: 'Test Sender',
      email: 'test_sender@centric.com',
      password: 'password123',
      role: 'SENDER',
      phone: '+2348011111111',
    });
    senderId = sender._id as mongoose.Types.ObjectId;

    const traveler = await User.create({
      name: 'Test Traveler',
      email: 'test_traveler@centric.com',
      password: 'password123',
      role: 'TRAVELER',
      phone: '+2348022222222',
    });
    travelerId = traveler._id as mongoose.Types.ObjectId;

    await TravelerProfile.create({
      user: travelerId,
      isVerified: false,
      trustScore: 50,
      completedDeliveries: 0,
    });

    const verifiedTraveler = await User.create({
      name: 'Verified Traveler',
      email: 'verified_traveler@centric.com',
      password: 'password123',
      role: 'TRAVELER',
      phone: '+2348033333333',
    });
    verifiedTravelerId = verifiedTraveler._id as mongoose.Types.ObjectId;

    await TravelerProfile.create({
      user: verifiedTravelerId,
      isVerified: true,
      trustScore: 70, // 50 base + 20 verification
      completedDeliveries: 0,
      verificationDetails: {
        documentType: 'NIN',
        documentNumber: 'NIN-123456789',
        verifiedAt: new Date(),
      },
    });

    await Verification.create({
      user: verifiedTravelerId,
      status: 'VERIFIED',
      documentType: 'NIN',
      documentNumber: 'NIN-123456789',
      verifiedAt: new Date(),
    });

    await TrustScoreLog.create({
      traveler: verifiedTravelerId,
      score: 70,
      delta: 20,
      reason: 'Traveler identity verified successfully (Seeded)',
    });
  });

  describe('1. Traveler Verification & Trust Score Updates', () => {
    it('should verify traveler profile and increase trust score by +20', async () => {
      const profile = await TravelerProfile.findOne({ user: travelerId });
      expect(profile).toBeDefined();
      expect(profile!.isVerified).toBe(false);
      expect(profile!.trustScore).toBe(50);

      // Verify the traveler
      profile!.isVerified = true;
      profile!.trustScore += 20;
      profile!.verificationDetails = {
        documentType: 'Passport',
        documentNumber: 'PP-12345',
        verifiedAt: new Date(),
      };
      await profile!.save();

      await Verification.create({
        user: travelerId,
        status: 'VERIFIED',
        documentType: 'Passport',
        documentNumber: 'PP-12345',
        verifiedAt: new Date(),
      });

      await TrustScoreLog.create({
        traveler: travelerId,
        score: profile!.trustScore,
        delta: 20,
        reason: 'Verification completed',
      });

      const updatedProfile = await TravelerProfile.findOne({ user: travelerId });
      expect(updatedProfile!.isVerified).toBe(true);
      expect(updatedProfile!.trustScore).toBe(70);

      const logs = await TrustScoreLog.find({ traveler: travelerId });
      expect(logs.length).toBe(1);
      expect(logs[0].delta).toBe(20);
      expect(logs[0].score).toBe(70);
    });
  });

  describe('2. Matching Engine & Distance/Detour Calculations', () => {
    it('should match a package with a compatible traveler journey based on routes and capacity', async () => {
      // Create traveler journey Yaba -> Ikeja
      // Coordinates: Yaba [3.3792, 6.5095], Ikeja [3.3505, 6.6018]
      const journey = await Journey.create({
        user: verifiedTravelerId,
        origin: { name: 'Yaba', coordinates: [3.3792, 6.5095] },
        destination: { name: 'Ikeja', coordinates: [3.3505, 6.6018] },
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        availableCapacity: 10,
        status: 'CREATED',
      });

      // Create matching package Yaba -> Ikeja (Weight: 2kg)
      const matchingPkg = await Package.create({
        user: senderId,
        pickupLocation: { name: 'Yaba', coordinates: [3.3792, 6.5095] },
        destination: { name: 'Ikeja', coordinates: [3.3505, 6.6018] },
        description: 'Test Box',
        category: 'OTHERS',
        weight: 2,
        declaredValue: 5000,
        recipient: { name: 'Jane', phone: '+234800000000' },
        status: 'CREATED',
      });

      // Create package with weight exceeding traveler capacity (Weight: 15kg)
      const heavyPkg = await Package.create({
        user: senderId,
        pickupLocation: { name: 'Yaba', coordinates: [3.3792, 6.5095] },
        destination: { name: 'Ikeja', coordinates: [3.3505, 6.6018] },
        description: 'Heavy Box',
        category: 'OTHERS',
        weight: 15,
        declaredValue: 5000,
        recipient: { name: 'Jane', phone: '+234800000000' },
        status: 'CREATED',
      });

      // Find matches for matching package
      const matches = await findMatchesForPackage(matchingPkg);
      expect(matches.length).toBe(1);
      expect(matches[0].journey.toString()).toBe(journey._id.toString());
      expect(matches[0].estimatedDetour).toBeCloseTo(0, 1);
      expect(matches[0].matchScore).toBeGreaterThan(80); // High score due to exact match

      // Find matches for heavy package (should be empty due to capacity filter)
      const heavyMatches = await findMatchesForPackage(heavyPkg);
      expect(heavyMatches.length).toBe(0);
    });

    it('should accurately calculate distance and detour routing', () => {
      // Yaba to Ikeja distance is approx 10.7 km
      const dist = calculateDistance([3.3792, 6.5095], [3.3505, 6.6018]);
      expect(dist).toBeGreaterThan(9);
      expect(dist).toBeLessThan(12);
    });
  });

  describe('3. Delivery State Machine & OTP Flow & Earnings Payout', () => {
    it('should execute delivery lifecycle from assignment, pickup, transit, and OTP verification completion', async () => {
      // 1. Create Journey and Package
      const journey = await Journey.create({
        user: verifiedTravelerId,
        origin: { name: 'Yaba', coordinates: [3.3792, 6.5095] },
        destination: { name: 'Ikeja', coordinates: [3.3505, 6.6018] },
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        availableCapacity: 10,
        status: 'CREATED',
      });

      const pkg = await Package.create({
        user: senderId,
        pickupLocation: { name: 'Yaba', coordinates: [3.3792, 6.5095] },
        destination: { name: 'Ikeja', coordinates: [3.3505, 6.6018] },
        description: 'Mock Package',
        category: 'CLOTHING',
        weight: 1,
        declaredValue: 2000,
        recipient: { name: 'Bob', phone: '+234800000001' },
        status: 'CREATED',
      });

      // 2. Accept Match -> Delivery created in ASSIGNED state
      const otp = '987654';
      const delivery = await Delivery.create({
        package: pkg._id,
        journey: journey._id,
        traveler: verifiedTravelerId,
        sender: senderId,
        status: 'ASSIGNED',
        otp,
        otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        otpFailedAttempts: 0,
      });

      pkg.status = 'MATCHED';
      await pkg.save();

      journey.status = 'MATCHED';
      await journey.save();

      expect(delivery.status).toBe('ASSIGNED');

      // 3. Submit Pickup Evidence -> Transition to PICKED_UP
      delivery.status = 'PICKED_UP';
      delivery.pickupEvidence = {
        photoUrl: 'https://mock.com/evidence.jpg',
        timestamp: new Date(),
        gps: { coordinates: [3.3792, 6.5095] },
        note: 'Picked up box',
      };
      await delivery.save();

      await Evidence.create({
        delivery: delivery._id,
        photoUrl: 'https://mock.com/evidence.jpg',
        timestamp: new Date(),
        gps: { coordinates: [3.3792, 6.5095] },
        note: 'Picked up box',
      });

      pkg.status = 'PICKED_UP';
      await pkg.save();

      const pickupDelivery = await Delivery.findById(delivery._id);
      expect(pickupDelivery!.status).toBe('PICKED_UP');
      expect(pickupDelivery!.pickupEvidence!.note).toBe('Picked up box');

      // 4. Transition to IN_TRANSIT
      delivery.status = 'IN_TRANSIT';
      await delivery.save();
      pkg.status = 'IN_TRANSIT';
      await pkg.save();

      const transitDelivery = await Delivery.findById(delivery._id);
      expect(transitDelivery!.status).toBe('IN_TRANSIT');

      // 5. Transition to OUT_FOR_DELIVERY
      delivery.status = 'OUT_FOR_DELIVERY';
      await delivery.save();
      pkg.status = 'OUT_FOR_DELIVERY';
      await pkg.save();

      const outDelivery = await Delivery.findById(delivery._id);
      expect(outDelivery!.status).toBe('OUT_FOR_DELIVERY');

      // 6. Verify OTP
      // Wrong OTP fails and increments attempts
      const wrongOtp = '000000';
      expect(delivery.otp).not.toBe(wrongOtp);
      delivery.otpFailedAttempts += 1;
      await delivery.save();

      const failedAttemptDelivery = await Delivery.findById(delivery._id);
      expect(failedAttemptDelivery!.otpFailedAttempts).toBe(1);

      // Correct OTP succeeds -> Transition to COMPLETED
      expect(delivery.otp).toBe(otp);
      delivery.status = 'COMPLETED';
      await delivery.save();

      pkg.status = 'COMPLETED';
      await pkg.save();

      journey.status = 'COMPLETED';
      await journey.save();

      // Assert complete states
      const completedDelivery = await Delivery.findById(delivery._id);
      const completedPkg = await Package.findById(pkg._id);
      const completedJourney = await Journey.findById(journey._id);

      expect(completedDelivery!.status).toBe('COMPLETED');
      expect(completedPkg!.status).toBe('COMPLETED');
      expect(completedJourney!.status).toBe('COMPLETED');

      // 7. Calculate and assert traveler earnings
      // Base: 1000, Distance: ~10.7km * 100 = 1070, Weight: 1 * 200 = 200. Total = 2270 NGN.
      // Payout (80%) = 1816 NGN
      const pricingAmount = 1000 + (10.7 * 100) + (1 * 200);
      const platformFee = pricingAmount * 0.2;
      const payoutAmount = pricingAmount * 0.8;

      const earning = await Earning.create({
        traveler: verifiedTravelerId,
        delivery: delivery._id,
        amount: pricingAmount,
        platformFee,
        payoutAmount,
        status: 'PAID',
      });

      expect(earning.payoutAmount).toBeGreaterThan(1600);
      expect(earning.status).toBe('PAID');

      // 8. Update trust score for successful delivery: +10
      const travelerProfile = await TravelerProfile.findOne({ user: verifiedTravelerId });
      expect(travelerProfile).toBeDefined();
      const oldScore = travelerProfile!.trustScore; // 70
      travelerProfile!.trustScore = Math.min(100, oldScore + 10);
      travelerProfile!.completedDeliveries += 1;
      await travelerProfile!.save();

      await TrustScoreLog.create({
        traveler: verifiedTravelerId,
        score: travelerProfile!.trustScore,
        delta: 10,
        reason: 'Successful delivery completion',
      });

      const finalProfile = await TravelerProfile.findOne({ user: verifiedTravelerId });
      expect(finalProfile!.trustScore).toBe(80);
      expect(finalProfile!.completedDeliveries).toBe(1);

      const trustLogs = await TrustScoreLog.find({ traveler: verifiedTravelerId });
      // Initially 1 log for seed (score 70), then 1 log for successful delivery (+10, score 80)
      expect(trustLogs.length).toBe(2);
    });
  });
});
