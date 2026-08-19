"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("./ai.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Allow authenticated users to classify packages
router.post('/classify', auth_1.protect, ai_controller_1.classifyPackage);
exports.default = router;
