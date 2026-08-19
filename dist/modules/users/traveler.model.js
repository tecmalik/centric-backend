"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelerProfile = void 0;
const model_1 = require("../../db/model");
exports.TravelerProfile = (0, model_1.createModel)({
    name: 'TravelerProfile',
    table: 'traveler_profiles',
    dates: ['createdAt', 'updatedAt'],
    populate: {
        user: { modelName: 'User', key: 'user' },
    },
});
