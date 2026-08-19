"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPackageSchema = void 0;
const zod_1 = require("zod");
exports.createPackageSchema = zod_1.z.object({
    body: zod_1.z.object({
        pickupLocation: zod_1.z.object({
            name: zod_1.z.string().min(1, 'Pickup location name is required'),
            coordinates: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()]).describe('Longitude, Latitude coordinates'),
        }),
        destination: zod_1.z.object({
            name: zod_1.z.string().min(1, 'Destination name is required'),
            coordinates: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()]).describe('Longitude, Latitude coordinates'),
        }),
        description: zod_1.z.string().min(1, 'Description is required'),
        category: zod_1.z.string().min(1, 'Category is required'),
        weight: zod_1.z.number().positive('Weight must be greater than zero'),
        declaredValue: zod_1.z.number().positive('Declared value must be greater than zero'),
        recipient: zod_1.z.object({
            name: zod_1.z.string().min(1, 'Recipient name is required'),
            phone: zod_1.z.string().min(10, 'Recipient phone must be valid'),
        }),
    }),
});
