import request from 'supertest';
import app from './app';
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

const runDemoFlow = async () => {
  console.log('\n=== Starting Centric MVP End-to-End Demo Flow Simulation ===\n');

  try {
    // Clean tables first for a fresh demo run
    await Delivery.deleteMany({});
    await Match.deleteMany({});
    await Package.deleteMany({});
    await Journey.deleteMany({});
    await Earning.deleteMany({});
    await Evidence.deleteMany({});
    await Verification.deleteMany({});
    await TrustScoreLog.deleteMany({});
    await TravelerProfile.deleteMany({});
    await User.deleteMany({});
    console.log(`[Database] Cleaned tables for fresh demo run.\n`);

    const timestamp = Date.now();

    // ----------------------------------------------------
    // STEP 1: Sender Registers
    // ----------------------------------------------------
    console.log('Step 1: Registering Sender...');
    const senderRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Adeola Sender',
        email: `sender_${timestamp}@centric.com`,
        password: 'password123',
        role: 'SENDER',
        phone: '+2348011111111',
      });

    if (!senderRes.body.success) {
      throw new Error(`Sender registration failed: ${JSON.stringify(senderRes.body)}`);
    }
    const senderToken = senderRes.body.token;
    console.log(`✅ Sender registered! Token: ${senderToken.substring(0, 15)}...`);

    // ----------------------------------------------------
    // STEP 2: Traveler Registers
    // ----------------------------------------------------
    console.log('\nStep 2: Registering Traveler...');
    const travelerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Tunde Traveler',
        email: `traveler_${timestamp}@centric.com`,
        password: 'password123',
        role: 'TRAVELER',
        phone: '+2348022222222',
      });

    if (!travelerRes.body.success) {
      throw new Error(`Traveler registration failed: ${JSON.stringify(travelerRes.body)}`);
    }
    const travelerToken = travelerRes.body.token;
    console.log(`✅ Traveler registered! Token: ${travelerToken.substring(0, 15)}...`);

    // Check initial Traveler profile
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${travelerToken}`);
    console.log(`ℹ️ Traveler Initial Verified Status: ${meRes.body.data.travelerProfile.isVerified}`);
    console.log(`ℹ️ Traveler Initial Trust Score: ${meRes.body.data.travelerProfile.trustScore}`);

    // ----------------------------------------------------
    // STEP 3: Traveler Gets Mock Verified
    // ----------------------------------------------------
    console.log('\nStep 3: Mock verifying Traveler...');
    const verifyRes = await request(app)
      .post('/api/v1/verification/verify')
      .set('Authorization', `Bearer ${travelerToken}`)
      .send({
        documentType: 'NIN',
        documentNumber: 'NIN-123456789',
      });

    if (!verifyRes.body.success) {
      throw new Error(`Traveler verification failed: ${JSON.stringify(verifyRes.body)}`);
    }
    console.log(`✅ Traveler mock verified successfully!`);
    console.log(`ℹ️ Trust Score updated: ${verifyRes.body.data.profile.trustScore} (expected: 70)`);

    // ----------------------------------------------------
    // STEP 4: Traveler Creates Yaba -> Ikeja Journey
    // ----------------------------------------------------
    console.log('\nStep 4: Traveler creating journey (Yaba -> Ikeja)...');
    // Coordinates: Yaba [3.3792, 6.5095], Ikeja [3.3505, 6.6018]
    const departureTime = new Date();
    departureTime.setDate(departureTime.getDate() + 2); // 2 days later

    const journeyRes = await request(app)
      .post('/api/v1/journeys')
      .set('Authorization', `Bearer ${travelerToken}`)
      .send({
        origin: { name: 'Yaba, Lagos', coordinates: [3.3792, 6.5095] },
        destination: { name: 'Ikeja, Lagos', coordinates: [3.3505, 6.6018] },
        departureTime: departureTime.toISOString(),
        availableCapacity: 15,
      });

    if (!journeyRes.body.success) {
      throw new Error(`Journey creation failed: ${JSON.stringify(journeyRes.body)}`);
    }
    const journeyId = journeyRes.body.data.journey._id;
    console.log(`✅ Journey created! ID: ${journeyId}`);

    // ----------------------------------------------------
    // STEP 5: Sender Creates Yaba -> Ikeja Package
    // ----------------------------------------------------
    console.log('\nStep 5: Sender creating package (Yaba -> Ikeja)...');
    const packageRes = await request(app)
      .post('/api/v1/packages')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        pickupLocation: { name: 'Yaba, Lagos', coordinates: [3.3792, 6.5095] },
        destination: { name: 'Ikeja, Lagos', coordinates: [3.3505, 6.6018] },
        description: 'A sealed box containing a pair of shoes',
        category: 'CLOTHING',
        weight: 2.5,
        declaredValue: 20000,
        recipient: { name: 'Jane Doe', phone: '+2348039999999' },
      });

    if (!packageRes.body.success) {
      throw new Error(`Package creation failed: ${JSON.stringify(packageRes.body)}`);
    }
    const packageId = packageRes.body.data.package._id;
    const matches = packageRes.body.data.matches;
    console.log(`✅ Package created! ID: ${packageId}`);
    console.log(`🔍 Matching engine auto-triggered! Found ${matches.length} compatible journeys.`);

    if (matches.length === 0) {
      throw new Error('No matches found. Check coordinates and capacity constraints.');
    }

    const match = matches[0];
    console.log(`   - Candidate Traveler ID: ${match.journey}`);
    console.log(`   - Match Score: ${match.matchScore}/100`);
    console.log(`   - Estimated Detour: ${match.estimatedDetour} km`);

    // ----------------------------------------------------
    // STEP 6: Traveler Accepts Package
    // ----------------------------------------------------
    console.log('\nStep 6: Traveler accepting the package match...');
    const acceptRes = await request(app)
      .post(`/api/v1/matches/${match._id}/accept`)
      .set('Authorization', `Bearer ${travelerToken}`);

    if (!acceptRes.body.success) {
      throw new Error(`Match acceptance failed: ${JSON.stringify(acceptRes.body)}`);
    }
    const deliveryId = acceptRes.body.data.delivery._id;
    const deliveryOtp = acceptRes.body.data.delivery.otp;
    console.log(`✅ Match accepted! Delivery created.`);
    console.log(`ℹ️ Package Status: ${acceptRes.body.data.packageStatus}`);
    console.log(`ℹ️ Journey Status: ${acceptRes.body.data.journeyStatus}`);
    console.log(`ℹ️ Assigned Delivery ID: ${deliveryId}`);
    console.log(`🔑 Generated Delivery OTP: ${deliveryOtp}`);

    // ----------------------------------------------------
    // STEP 7: Sender Sees the Match Details
    // ----------------------------------------------------
    console.log('\nStep 7: Sender inspecting assigned delivery details...');
    const deliveryDetailsRes = await request(app)
      .get(`/api/v1/deliveries/${deliveryId}`)
      .set('Authorization', `Bearer ${senderToken}`);

    if (!deliveryDetailsRes.body.success) {
      throw new Error(`Sender viewing delivery failed: ${JSON.stringify(deliveryDetailsRes.body)}`);
    }
    console.log(`✅ Sender confirmed match! Delivery Status in Sender view: ${deliveryDetailsRes.body.data.delivery.status}`);

    // ----------------------------------------------------
    // STEP 8: Traveler Records Pickup Evidence
    // ----------------------------------------------------
    console.log('\nStep 8: Traveler submitting pickup evidence...');
    const pickupRes = await request(app)
      .post(`/api/v1/deliveries/${deliveryId}/pickup`)
      .set('Authorization', `Bearer ${travelerToken}`)
      .send({
        photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
        coordinates: [3.3792, 6.5095],
        note: 'Package picked up from sender Adeola at Yaba, clean and sealed.',
      });

    if (!pickupRes.body.success) {
      throw new Error(`Recording pickup failed: ${JSON.stringify(pickupRes.body)}`);
    }
    console.log(`✅ Pickup evidence recorded!`);
    console.log(`ℹ️ Delivery Status updated: ${pickupRes.body.data.delivery.status}`);

    // ----------------------------------------------------
    // STEP 9: Traveler Starts Transit
    // ----------------------------------------------------
    console.log('\nStep 9: Traveler setting delivery to IN_TRANSIT...');
    const transitRes = await request(app)
      .post(`/api/v1/deliveries/${deliveryId}/transit`)
      .set('Authorization', `Bearer ${travelerToken}`);

    if (!transitRes.body.success) {
      throw new Error(`Starting transit failed: ${JSON.stringify(transitRes.body)}`);
    }
    console.log(`✅ Transit started!`);
    console.log(`ℹ️ Delivery Status updated: ${transitRes.body.data.delivery.status}`);

    // ----------------------------------------------------
    // STEP 10: Traveler Sets Out for Delivery
    // ----------------------------------------------------
    console.log('\nStep 10: Traveler marking delivery OUT_FOR_DELIVERY at destination...');
    const outForDeliveryRes = await request(app)
      .post(`/api/v1/deliveries/${deliveryId}/out-for-delivery`)
      .set('Authorization', `Bearer ${travelerToken}`);

    if (!outForDeliveryRes.body.success) {
      throw new Error(`Marking out for delivery failed: ${JSON.stringify(outForDeliveryRes.body)}`);
    }
    console.log(`✅ Out for delivery!`);
    console.log(`ℹ️ Delivery Status updated: ${outForDeliveryRes.body.data.delivery.status}`);

    // ----------------------------------------------------
    // STEP 11: Recipient Provides OTP -> Verification
    // ----------------------------------------------------
    console.log('\nStep 11: Recipient providing OTP to Traveler to complete delivery...');
    console.log(`   - Inputting OTP code: ${deliveryOtp}`);

    const verifyOtpRes = await request(app)
      .post(`/api/v1/deliveries/${deliveryId}/verify-otp`)
      .set('Authorization', `Bearer ${travelerToken}`)
      .send({
        otp: deliveryOtp,
      });

    if (!verifyOtpRes.body.success) {
      throw new Error(`OTP verification failed: ${JSON.stringify(verifyOtpRes.body)}`);
    }
    console.log(`✅ OTP Verification Succeeded! Delivery Completed.`);
    console.log(`ℹ️ Delivery Status updated: ${verifyOtpRes.body.data.delivery.status}`);

    // ----------------------------------------------------
    // STEP 12: Verify Traveler Payout and Trust Updates
    // ----------------------------------------------------
    console.log('\nStep 12: Inspecting traveler payout earnings and updated trust score...');

    const earningsRes = await request(app)
      .get('/api/v1/earnings')
      .set('Authorization', `Bearer ${travelerToken}`);

    console.log(`✅ Traveler total earnings logged: ${earningsRes.body.data.totalEarnings} NGN`);
    console.log(`✅ Traveler completed deliveries count: ${earningsRes.body.data.completedDeliveriesCount}`);

    const trustRes = await request(app)
      .get('/api/v1/trust/history')
      .set('Authorization', `Bearer ${travelerToken}`);

    console.log(`✅ Traveler final trust score: ${trustRes.body.data.currentTrustScore} (expected: 80)`);
    console.log('   Audit Logs:');
    trustRes.body.data.logs.forEach((log: any) => {
      console.log(`     - [Score: ${log.score}] [Delta: ${log.delta}] Reason: ${log.reason}`);
    });

    console.log('\n============================================================');
    console.log('🎉 DEMO SIMULATION SUCCESS: ALL STEPS EXECUTED CORRECTLY! 🎉');
    console.log('============================================================\n');

  } catch (error: any) {
    console.error('\n❌ DEMO SIMULATION FAILED AT STEP:');
    console.error(error.message || error);
    console.log('');
  }
};

runDemoFlow();
