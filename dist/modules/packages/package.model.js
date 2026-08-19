"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Package = void 0;
const model_1 = require("../../db/model");
exports.Package = (0, model_1.createModel)({
    table: 'packages',
    dates: ['createdAt', 'updatedAt'],
});
