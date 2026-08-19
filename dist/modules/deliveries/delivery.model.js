"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delivery = void 0;
const model_1 = require("../../db/model");
exports.Delivery = (0, model_1.createModel)({
    name: 'Delivery',
    table: 'deliveries',
    dates: ['createdAt', 'updatedAt', 'otpExpiresAt'],
    populate: {
        package: { modelName: 'Package', key: 'package' },
        journey: { modelName: 'Journey', key: 'journey' },
        traveler: { modelName: 'User', key: 'traveler' },
        sender: { modelName: 'User', key: 'sender' },
    },
});
