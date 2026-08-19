"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Match = void 0;
const model_1 = require("../../db/model");
exports.Match = (0, model_1.createModel)({
    table: 'matches',
    dates: ['createdAt', 'updatedAt'],
});
