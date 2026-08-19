"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySchema = void 0;
const zod_1 = require("zod");
exports.verifySchema = zod_1.z.object({
    body: zod_1.z.object({
        documentType: zod_1.z.string().min(2, 'Document type is required'),
        documentNumber: zod_1.z.string().min(4, 'Document number must be valid'),
    }),
});
