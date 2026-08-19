"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpSchema = exports.pickupEvidenceSchema = void 0;
const zod_1 = require("zod");
exports.pickupEvidenceSchema = zod_1.z.object({
    body: zod_1.z.object({
        photoUrl: zod_1.z.string().url('Please enter a valid photo URL'),
        coordinates: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()]).describe('Longitude, Latitude coordinates'),
        note: zod_1.z.string().optional(),
    }),
});
exports.verifyOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        otp: zod_1.z.string().min(4, 'OTP must be valid').max(8, 'OTP must be valid'),
    }),
});
