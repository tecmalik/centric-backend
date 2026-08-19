"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const verification_routes_1 = __importDefault(require("../modules/verification/verification.routes"));
const journey_routes_1 = __importDefault(require("../modules/journeys/journey.routes"));
const package_routes_1 = __importDefault(require("../modules/packages/package.routes"));
const matching_routes_1 = __importDefault(require("../modules/matching/matching.routes"));
const delivery_routes_1 = __importDefault(require("../modules/deliveries/delivery.routes"));
const earnings_routes_1 = __importDefault(require("../modules/earnings/earnings.routes"));
const trust_routes_1 = __importDefault(require("../modules/trust/trust.routes"));
const ai_routes_1 = __importDefault(require("../modules/ai/ai.routes"));
const evidence_model_1 = require("../modules/evidence/evidence.model");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Mount all modules
router.use('/auth', auth_routes_1.default);
router.use('/verification', verification_routes_1.default);
router.use('/journeys', journey_routes_1.default);
router.use('/packages', package_routes_1.default);
router.use('/matching', matching_routes_1.default);
router.use('/matches', matching_routes_1.default); // Handles matches operations like accept
router.use('/deliveries', delivery_routes_1.default);
router.use('/earnings', earnings_routes_1.default);
router.use('/trust', trust_routes_1.default);
router.use('/ai', ai_routes_1.default);
// Basic evidence endpoint to fetch evidence records for a delivery
router.get('/evidence/:deliveryId', auth_1.protect, async (req, res, next) => {
    try {
        const evidence = await evidence_model_1.Evidence.findOne({ delivery: req.params.deliveryId });
        if (!evidence) {
            res.status(404).json({
                success: false,
                message: 'No evidence found for this delivery ID',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: evidence,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
