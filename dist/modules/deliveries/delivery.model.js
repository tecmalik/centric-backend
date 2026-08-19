"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delivery = void 0;
const model_1 = require("../../db/model");
exports.Delivery = (0, model_1.createModel)({
    table: 'deliveries',
    dates: ['otpExpiresAt', 'createdAt', 'updatedAt'],
});
