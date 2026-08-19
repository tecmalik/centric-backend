"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const routes_1 = __importDefault(require("./routes"));
const error_1 = require("./middleware/error");
const swagger_json_1 = __importDefault(require("./config/swagger.json"));
const app = (0, express_1.default)();
// Express Configuration
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health Check Endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
    });
});
// Swagger Documentation Route
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
// API Routers Mount
app.use('/api/v1', routes_1.default);
// Fallback Page Not Found Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `API Route not found: ${req.method} ${req.path}`,
    });
});
// Centralized Error Handler Middleware
app.use(error_1.errorHandler);
exports.default = app;
