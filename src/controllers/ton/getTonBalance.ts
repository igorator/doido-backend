import { Request, Response } from 'express';
import { tonClient } from '../../ton/tonClient';
import { Address, fromNano } from '@ton/core';

export async function getTonBalance(req: Request, res: Response) {
  const { address } = req.params;

  try {
    if (!Address.isFriendly(address)) {
      res.status(400).json({ error: 'Invalid TON address' });
    }

    const parsed = Address.parse(address);
    const balance = await tonClient.getBalance(parsed);

    console.log(parsed);
    console.log(fromNano(balance));

    res.json({ balance: fromNano(balance) });
  } catch (err) {
    console.error('TON balance error:', err);
    res.status(500).json({ error: 'Failed to get balance' });
  }
}
