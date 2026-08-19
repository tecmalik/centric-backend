"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const earnings_controller_1 = require("./earnings.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.protect, (0, auth_1.restrictTo)('TRAVELER'), earnings_controller_1.getTravelerEarnings);
exports.default = router;
