"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trust_controller_1 = require("./trust.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.get('/history', auth_1.protect, (0, auth_1.restrictTo)('TRAVELER'), trust_controller_1.getTrustHistory);
exports.default = router;
