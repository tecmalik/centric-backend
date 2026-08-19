"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJourneySchema = void 0;
const zod_1 = require("zod");
exports.createJourneySchema = zod_1.z.object({
    body: zod_1.z.object({
        origin: zod_1.z.object({
            name: zod_1.z.string().min(1, 'Origin name is required'),
            coordinates: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()]).describe('Longitude, Latitude coordinates'),
        }),
        destination: zod_1.z.object({
            name: zod_1.z.string().min(1, 'Destination name is required'),
            coordinates: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()]).describe('Longitude, Latitude coordinates'),
        }),
        departureTime: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid departure time format',
        }),
        availableCapacity: zod_1.z.number().positive('Available capacity must be greater than zero'),
    }),
});
