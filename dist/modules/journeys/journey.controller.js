"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllJourneys = exports.getMyJourneys = exports.createJourney = void 0;
const journey_model_1 = require("./journey.model");
const traveler_model_1 = require("../users/traveler.model");
const createJourney = async (req, res, next) => {
    try {
        if (!req.user) {
            const error = new Error('Authentication required');
            error.statusCode = 401;
            return next(error);
        }
        // Check verification status
        const profile = await traveler_model_1.TravelerProfile.findOne({ user: req.user._id });
        if (!profile || !profile.isVerified) {
            const error = new Error('Your profile must be verified before you can create journeys.');
            error.statusCode = 403;
            return next(error);
        }
        const { origin, destination, departureTime, availableCapacity } = req.body;
        const journey = await journey_model_1.Journey.create({
            user: req.user._id,
            origin,
            destination,
            departureTime: new Date(departureTime),
            availableCapacity,
            status: 'CREATED',
        });
        res.status(201).json({
            success: true,
            data: {
                journey,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createJourney = createJourney;
const getMyJourneys = async (req, res, next) => {
    try {
        if (!req.user) {
            const error = new Error('Authentication required');
            error.statusCode = 401;
            return next(error);
        }
        const journeys = await journey_model_1.Journey.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: {
                journeys,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyJourneys = getMyJourneys;
const getAllJourneys = async (_req, res, next) => {
    try {
        const journeys = await journey_model_1.Journey.find().populate('user', 'name email phone').sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: {
                journeys,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllJourneys = getAllJourneys;
