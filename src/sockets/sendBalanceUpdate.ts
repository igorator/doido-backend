import { getIO } from './initSocketServer';

export const sendBalanceUpdate = (userId: string, balance?: number) => {
  const io = getIO();
  io.to(`user_${userId}`).emit('balance_updated', { balance });
};
