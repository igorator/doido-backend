import http from 'http';
import { Server } from 'socket.io';
import { checkTelegramInitData } from '../shared/lib/auth/checkTelegramInitData';
import { config } from '../config';

let io: Server;

const ALLOWED_ORIGINS = config.server.isDev
  ? true
  : ['https://doido-market.com', 'https://www.doido-market.com'];

export function setupSockets(app: Express.Application): http.Server {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: ALLOWED_ORIGINS,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const rawInitData = socket.handshake.auth?.initData as string | undefined;

    if (!rawInitData) {
      return next(new Error('Unauthorized: missing initData'));
    }

    const params: Record<string, string> = {};
    try {
      new URLSearchParams(rawInitData).forEach((value, key) => {
        params[key] = value;
      });
    } catch {
      return next(new Error('Unauthorized: malformed initData'));
    }

    const { valid, user } = checkTelegramInitData(params, config.telegram.botToken);

    if (!valid || !user?.id) {
      return next(new Error('Unauthorized: invalid initData'));
    }

    socket.data.verifiedUserId = String(user.id);
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.verifiedUserId as string;
    socket.join(`user_${userId}`);
  });

  return server;
}

export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialised');
  return io;
};
