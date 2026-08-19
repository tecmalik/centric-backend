"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const model_1 = require("../../db/model");
exports.User = (0, model_1.createModel)({
    table: 'users',
    dates: ['createdAt', 'updatedAt'],
    hidden: ['password'],
    beforeCreate: async (doc) => {
        if (doc.password) {
            doc.password = await bcryptjs_1.default.hash(doc.password, 10);
        }
        return doc;
    },
    methods: {
        async comparePassword(password) {
            if (!this.password)
                return false;
            return bcryptjs_1.default.compare(password, this.password);
        },
    },
});
