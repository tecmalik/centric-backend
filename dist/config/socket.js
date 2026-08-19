"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitDeliveryEvent = exports.getIO = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
let io = null;
const initializeSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
        },
    });
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        socket.on('join_delivery', (deliveryId) => {
            socket.join(deliveryId);
            console.log(`Socket ${socket.id} joined room: delivery:${deliveryId}`);
        });
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized yet.');
    }
    return io;
};
exports.getIO = getIO;
const emitDeliveryEvent = (event, deliveryId, data) => {
    if (io) {
        // Emit to room of specific delivery and also globally for simple updates
        io.to(deliveryId).emit(event, data);
        io.emit(event, { deliveryId, ...data });
        console.log(`[Socket] Emitted event: ${event} for delivery: ${deliveryId}`);
    }
};
exports.emitDeliveryEvent = emitDeliveryEvent;
