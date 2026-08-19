"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required'),
        email: zod_1.z.string().email('Please enter a valid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
        role: zod_1.z.enum(['SENDER', 'TRAVELER'], {
            required_error: 'Role must be SENDER or TRAVELER',
        }),
        phone: zod_1.z.string().min(10, 'Phone number must be valid'),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Please enter a valid email address'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
