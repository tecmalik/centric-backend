"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTravelerEarnings = void 0;
const earning_model_1 = require("./earning.model");
const traveler_model_1 = require("../users/traveler.model");
const getTravelerEarnings = async (req, res, next) => {
    try {
        if (!req.user) {
            const error = new Error('Authentication required');
            error.statusCode = 401;
            return next(error);
        }
        if (req.user.role !== 'TRAVELER') {
            const error = new Error('Only travelers can view earnings information');
            error.statusCode = 403;
            return next(error);
        }
        const earnings = await earning_model_1.Earning.find({ traveler: req.user._id }).sort({ createdAt: -1 });
        const totalPayout = earnings.reduce((acc, curr) => acc + curr.payoutAmount, 0);
        const travelerProfile = await traveler_model_1.TravelerProfile.findOne({ user: req.user._id });
        const completedCount = travelerProfile ? travelerProfile.completedDeliveries : earnings.length;
        res.status(200).json({
            success: true,
            data: {
                totalEarnings: parseFloat(totalPayout.toFixed(2)),
                completedDeliveriesCount: completedCount,
                earnings,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTravelerEarnings = getTravelerEarnings;
