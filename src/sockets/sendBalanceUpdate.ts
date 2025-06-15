import { getIO } from './initSocketServer';

export const sendBalanceUpdate = (userId: string) => {
  const io = getIO();
  io.to(`user_${userId}`).emit('balance_updated');
};
