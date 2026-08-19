"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Journey = void 0;
const model_1 = require("../../db/model");
exports.Journey = (0, model_1.createModel)({
    name: 'Journey',
    table: 'journeys',
    dates: ['createdAt', 'updatedAt', 'departureTime'],
    populate: {
        user: { modelName: 'User', key: 'user' },
    },
});
