"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Evidence = void 0;
const model_1 = require("../../db/model");
exports.Evidence = (0, model_1.createModel)({
    name: 'Evidence',
    table: 'evidence',
    dates: ['createdAt', 'updatedAt', 'timestamp'],
    populate: {
        delivery: { modelName: 'Delivery', key: 'delivery' },
    },
});
