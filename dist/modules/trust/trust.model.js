"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustScoreLog = void 0;
const model_1 = require("../../db/model");
exports.TrustScoreLog = (0, model_1.createModel)({
    name: 'TrustScoreLog',
    table: 'trust_score_logs',
    dates: ['createdAt', 'updatedAt'],
    populate: {
        traveler: { modelName: 'User', key: 'traveler' },
    },
});
