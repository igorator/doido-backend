import { Server } from 'socket.io';

let io: Server;

export const initSocketServer = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (!userId) return socket.disconnect();

    console.log(`🔌 Пользователь ${userId} подключился`);
    socket.join(`user_${userId}`);
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};
