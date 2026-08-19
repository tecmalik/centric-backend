"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Journey = void 0;
const model_1 = require("../../db/model");
exports.Journey = (0, model_1.createModel)({
    table: 'journeys',
    dates: ['departureTime', 'createdAt', 'updatedAt'],
});
