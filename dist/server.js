"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables first
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const socket_1 = require("./config/socket");
const PORT = process.env.PORT || 3000;
// Setup uncaught exception handlers to prevent app from dropping silently
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION] Shutting down server...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
});
const startServer = async () => {
    // Connect to Database
    await (0, db_1.connectDB)();
    // Create HTTP Server
    const server = http_1.default.createServer(app_1.default);
    // Initialize Socket.io
    (0, socket_1.initializeSocket)(server);
    console.log(`Socket.IO server initialized successfully.`);
    // Listen
    server.listen(PORT, () => {
        console.log(`=========================================`);
        console.log(`  Centric Backend MVP Server Running     `);
        console.log(`  Local URL: http://localhost:${PORT}     `);
        console.log(`  Swagger UI: http://localhost:${PORT}/api-docs `);
        console.log(`  Environment: ${process.env.NODE_ENV}   `);
        console.log(`=========================================`);
    });
    process.on('unhandledRejection', (err) => {
        console.error('[UNHANDLED REJECTION] Shutting down server...');
        console.error(err?.name, err?.message);
        server.close(() => {
            process.exit(1);
        });
    });
};
startServer();
