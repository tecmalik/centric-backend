"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Earning = void 0;
const model_1 = require("../../db/model");
exports.Earning = (0, model_1.createModel)({
    table: 'earnings',
    dates: ['createdAt', 'updatedAt'],
});
