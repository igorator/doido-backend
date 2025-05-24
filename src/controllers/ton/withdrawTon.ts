import Decimal from 'decimal.js';
import { Request, Response } from 'express';
import { minusUserBalance } from '../../services/user/updateUserBalance';
import { getUserById } from '../../services/user/getUserById';
// import { sendTon } from '../../services/ton/sendTon';

export async function withdrawTon(req: Request, res: Response) {
  const { userId, to, amountTon } = req.body;

  if (!userId || !to || !amountTon || amountTon <= 0) {
    res.status(400).json({ message: 'Invalid withdraw request' });
    return;
  }

  const user = await getUserById(userId);
  if (!user || user.ton_balance < amountTon) {
    res.status(403).json({ message: 'Insufficient balance' });
    return;
  }

  // await sendTon(to, amountTon);
  await minusUserBalance(userId, new Decimal(amountTon));

  res.json({ success: true });
}
