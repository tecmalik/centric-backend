"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const model_1 = require("../../db/model");
exports.User = (0, model_1.createModel)({
    name: 'User',
    table: 'users',
    dates: ['createdAt', 'updatedAt'],
    hidden: ['password'],
    beforeCreate: async (data) => {
        if (data.password) {
            data.password = await bcryptjs_1.default.hash(data.password, 10);
        }
    },
    methods: {
        async comparePassword(password) {
            const hashed = this._hidden?.password;
            if (!hashed)
                return false;
            return bcryptjs_1.default.compare(password, hashed);
        },
    },
});
