"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const user_model_1 = require("./modules/users/user.model");
const traveler_model_1 = require("./modules/users/traveler.model");
const journey_model_1 = require("./modules/journeys/journey.model");
const package_model_1 = require("./modules/packages/package.model");
const match_model_1 = require("./modules/matching/match.model");
const delivery_model_1 = require("./modules/deliveries/delivery.model");
const earning_model_1 = require("./modules/earnings/earning.model");
const evidence_model_1 = require("./modules/evidence/evidence.model");
const verification_model_1 = require("./modules/verification/verification.model");
const trust_model_1 = require("./modules/trust/trust.model");
const seedDatabase = async () => {
    try {
        console.log('Connecting to Supabase for seeding...');
        console.log('Clearing database table data...');
        await user_model_1.User.deleteMany({});
        await traveler_model_1.TravelerProfile.deleteMany({});
        await journey_model_1.Journey.deleteMany({});
        await package_model_1.Package.deleteMany({});
        await match_model_1.Match.deleteMany({});
        await delivery_model_1.Delivery.deleteMany({});
        await earning_model_1.Earning.deleteMany({});
        await evidence_model_1.Evidence.deleteMany({});
        await verification_model_1.Verification.deleteMany({});
        await trust_model_1.TrustScoreLog.deleteMany({});
        console.log('Seeding initial data...');
        // 1. Create Sender
        const sender = await user_model_1.User.create({
            name: 'Adeola Sender',
            email: 'sender@centric.com',
            password: 'password123',
            role: 'SENDER',
            phone: '+2348011111111',
        });
        console.log(`Sender seeded: ${sender.email}`);
        // 2. Create Traveler
        const traveler = await user_model_1.User.create({
            name: 'Tunde Traveler',
            email: 'traveler@centric.com',
            password: 'password123',
            role: 'TRAVELER',
            phone: '+2348022222222',
        });
        console.log(`Traveler seeded: ${traveler.email}`);
        // 3. Setup Traveler profile and mock verify
        await traveler_model_1.TravelerProfile.create({
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
        await verification_model_1.Verification.create({
            user: traveler._id,
            status: 'VERIFIED',
            documentType: 'NIN',
            documentNumber: 'NIN-999888777',
            verifiedAt: new Date(),
        });
        await trust_model_1.TrustScoreLog.create({
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
        const journey = await journey_model_1.Journey.create({
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
        const testPackage = await package_model_1.Package.create({
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
    }
    catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};
seedDatabase();
