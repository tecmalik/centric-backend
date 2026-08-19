"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrustHistory = void 0;
const trust_model_1 = require("./trust.model");
const traveler_model_1 = require("../users/traveler.model");
const getTrustHistory = async (req, res, next) => {
    try {
        if (!req.user) {
            const error = new Error('Authentication required');
            error.statusCode = 401;
            return next(error);
        }
        if (req.user.role !== 'TRAVELER') {
            const error = new Error('Only travelers can view trust score logs');
            error.statusCode = 403;
            return next(error);
        }
        const logs = await trust_model_1.TrustScoreLog.find({ traveler: req.user._id }).sort({ createdAt: -1 });
        const profile = await traveler_model_1.TravelerProfile.findOne({ user: req.user._id });
        res.status(200).json({
            success: true,
            data: {
                currentTrustScore: profile ? profile.trustScore : 50,
                logs,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTrustHistory = getTrustHistory;
