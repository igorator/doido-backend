import { Request, Response } from 'express';
import { tonClient } from '../../ton/tonClient';
import { Address, fromNano } from '@ton/core';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export async function getTonBalance(req: Request, res: Response): Promise<void> {
  const { address } = req.params;

  if (!Address.isFriendly(address)) {
    res.status(400).json({ error: 'Invalid TON address' });
    return;
  }

  try {
    const parsedAddress = Address.parse(address);
    const balance = await tonClient.getBalance(parsedAddress);
    res.json({ balance: fromNano(balance) });
  } catch (err) {
    handleHttpError(res, err, 'getTonBalance');
  }
}
