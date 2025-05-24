import { Request, Response } from 'express';
import { tonClient } from '../../ton/tonClient';
import { Address } from '@ton/core';

export async function getTonBalance(req: Request, res: Response) {
  const { address } = req.params;

  try {
    const parsed = Address.parse(address);
    const balance = await tonClient.getBalance(parsed);

    res.json({ balance: Number(balance) / 1e9 });
  } catch (err) {
    console.error('TON balance error:', err);
    res.status(500).json({ error: 'Failed to get balance' });
  }
}
