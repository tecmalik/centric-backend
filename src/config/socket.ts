import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export const initializeSocket = (server: HttpServer): SocketServer => {
  io = new SocketServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join_delivery', (deliveryId: string) => {
      socket.join(deliveryId);
      console.log(`Socket ${socket.id} joined room: delivery:${deliveryId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet.');
  }
  return io;
};

export const emitDeliveryEvent = (event: string, deliveryId: string, data: any): void => {
  if (io) {
    // Emit to room of specific delivery and also globally for simple updates
    io.to(deliveryId).emit(event, data);
    io.emit(event, { deliveryId, ...data });
    console.log(`[Socket] Emitted event: ${event} for delivery: ${deliveryId}`);
  }
};
