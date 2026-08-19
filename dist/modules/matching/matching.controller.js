"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptMatch = exports.getMatchesByJourney = exports.getMatchesByPackage = exports.getOnDemandMatches = void 0;
const match_model_1 = require("./match.model");
const package_model_1 = require("../packages/package.model");
const journey_model_1 = require("../journeys/journey.model");
const delivery_model_1 = require("../deliveries/delivery.model");
const matching_service_1 = require("./matching.service");
const socket_1 = require("../../config/socket");
const getOnDemandMatches = async (req, res, next) => {
    try {
        const pkg = await package_model_1.Package.findById(req.params.packageId);
        if (!pkg) {
            const error = new Error('Package not found');
            error.statusCode = 404;
            return next(error);
        }
        const matches = await (0, matching_service_1.findMatchesForPackage)(pkg);
        res.status(200).json({
            success: true,
            data: {
                matches,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOnDemandMatches = getOnDemandMatches;
const getMatchesByPackage = async (req, res, next) => {
    try {
        const matches = await match_model_1.Match.find({ package: req.params.packageId })
            .populate({
            path: 'journey',
            populate: { path: 'user', select: 'name email phone' },
        })
            .sort({ matchScore: -1 });
        res.status(200).json({
            success: true,
            data: {
                matches,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMatchesByPackage = getMatchesByPackage;
const getMatchesByJourney = async (req, res, next) => {
    try {
        const matches = await match_model_1.Match.find({ journey: req.params.journeyId })
            .populate('package')
            .sort({ matchScore: -1 });
        res.status(200).json({
            success: true,
            data: {
                matches,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMatchesByJourney = getMatchesByJourney;
const acceptMatch = async (req, res, next) => {
    try {
        if (!req.user) {
            const error = new Error('Authentication required');
            error.statusCode = 401;
            return next(error);
        }
        const match = await match_model_1.Match.findById(req.params.id)
            .populate('package')
            .populate('journey');
        if (!match) {
            const error = new Error('Match record not found');
            error.statusCode = 404;
            return next(error);
        }
        if (match.status !== 'PENDING') {
            const error = new Error(`Match has already been ${match.status.toLowerCase()}`);
            error.statusCode = 400;
            return next(error);
        }
        // Retrieve full models to update status
        const pkg = await package_model_1.Package.findById(match.package._id);
        const journey = await journey_model_1.Journey.findById(match.journey._id);
        if (!pkg || !journey) {
            const error = new Error('Package or journey associated with this match was not found');
            error.statusCode = 404;
            return next(error);
        }
        // Ensure the user accepting is the traveler who owns the journey
        if (journey.user.toString() !== req.user._id.toString()) {
            const error = new Error('You do not have permission to accept this match (not your journey)');
            error.statusCode = 403;
            return next(error);
        }
        // PREVENT multiple travelers accepting the same package
        if (pkg.status !== 'CREATED') {
            const error = new Error('This package has already been matched/accepted by another traveler');
            error.statusCode = 400;
            return next(error);
        }
        // 1. Update Match status to ACCEPTED
        match.status = 'ACCEPTED';
        await match.save();
        // 2. Update Package status to MATCHED
        pkg.status = 'MATCHED';
        await pkg.save();
        // 3. Update Journey status to MATCHED
        journey.status = 'MATCHED';
        await journey.save();
        // 4. Generate random 6-digit OTP (e.g. 123456)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiration
        // 5. Create Delivery in ASSIGNED state
        const delivery = await delivery_model_1.Delivery.create({
            package: pkg._id,
            journey: journey._id,
            traveler: journey.user,
            sender: pkg.user,
            status: 'ASSIGNED',
            otp,
            otpExpiresAt,
            otpFailedAttempts: 0,
        });
        // 6. Set other matches for this package to EXPIRED
        await match_model_1.Match.updateMany({ package: pkg._id, _id: { $ne: match._id } }, { status: 'EXPIRED' });
        // 7. Emit Socket.IO events
        (0, socket_1.emitDeliveryEvent)('delivery:matched', delivery._id.toString(), {
            packageId: pkg._id,
            journeyId: journey._id,
        });
        (0, socket_1.emitDeliveryEvent)('delivery:accepted', delivery._id.toString(), {
            deliveryId: delivery._id,
            travelerId: journey.user,
        });
        res.status(200).json({
            success: true,
            message: 'Match accepted and delivery assigned successfully',
            data: {
                match,
                packageStatus: pkg.status,
                journeyStatus: journey.status,
                delivery: {
                    _id: delivery._id,
                    status: delivery.status,
                    otp: delivery.otp, // Expose for MVP testing/demonstration purposes
                    otpExpiresAt: delivery.otpExpiresAt,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.acceptMatch = acceptMatch;
