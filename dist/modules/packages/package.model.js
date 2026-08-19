"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Package = void 0;
const model_1 = require("../../db/model");
exports.Package = (0, model_1.createModel)({
    name: 'Package',
    table: 'packages',
    dates: ['createdAt', 'updatedAt'],
    populate: {
        user: { modelName: 'User', key: 'user' },
    },
});
