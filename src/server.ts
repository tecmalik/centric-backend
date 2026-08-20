import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { initializeSocket } from './config/socket';

const PORT = process.env.PORT || 3000;

// Setup uncaught exception handlers to prevent app from dropping silently
process.on('uncaughtException', (err: Error) => {
  console.error('[UNCAUGHT EXCEPTION] Shutting down server...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Create HTTP Server
  const server = http.createServer(app);

  // Initialize Socket.io
  initializeSocket(server);
  console.log(`Socket.IO server initialized successfully.`);

  // Listen
  server.listen(PORT, () => {
    const publicUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    console.log(`=========================================`);
    console.log(`  Centric Backend MVP Server Running     `);
    console.log(`  Local URL: http://localhost:${PORT}     `);
    console.log(`  Swagger UI: ${publicUrl}/api-docs `);
    console.log(`  Environment: ${process.env.NODE_ENV}   `);
    console.log(`=========================================`);
  });

  process.on('unhandledRejection', (err: any) => {
    console.error('[UNHANDLED REJECTION] Shutting down server...');
    console.error(err?.name, err?.message);
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();
