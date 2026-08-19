"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Verification = void 0;
const model_1 = require("../../db/model");
exports.Verification = (0, model_1.createModel)({
    table: 'verifications',
    dates: ['verifiedAt', 'createdAt', 'updatedAt'],
});
