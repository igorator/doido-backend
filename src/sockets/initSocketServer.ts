import http from 'http';
import { Server } from 'socket.io';

let io: Server;

export function setupSockets(app: Express.Application): http.Server {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (!userId) return socket.disconnect();

    socket.join(`user_${userId}`);
  });

  return server;
}

export const getIO = () => {
  if (!io) throw new Error('Socket.IO не инициализирован');
  return io;
};
