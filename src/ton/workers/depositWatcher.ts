import { Address, fromNano, Cell } from '@ton/core';

import Decimal from 'decimal.js';
import { Buffer } from 'buffer';
import { tonClient } from '../tonClient';
import { getUserById } from '../../services/user/getUserById';
import { plusUserBalance } from '../../services/user/updateUserBalance';
import { depositLogRepository } from '../../database/repositories/ton/deposit/depositLogRepository';

const DEPOSIT_WALLET = process.env.TON_DEPOSIT_WALLET!;

export async function depositWatcher() {
  const address = Address.parse(DEPOSIT_WALLET);
  const now = Math.floor(Date.now() / 1000);

  const transactions = await tonClient.getTransactions(address, { limit: 20 });

  for (const tx of transactions) {
    const txHash = Buffer.from(tx.hash()).toString('base64');

    const existing = await depositLogRepository.findOneBy({ txHash });
    if (existing) continue;

    const inMsg = tx.inMessage;
    if (!inMsg || inMsg.info.type !== 'internal' || !inMsg.body) continue;

    let comment = '';
    try {
      const bodyCell = inMsg.body as Cell;
      const parsed = bodyCell.beginParse();
      comment = parsed.loadStringTail();
    } catch {
      continue;
    }

    if (!comment.startsWith('deposit:')) continue;

    const [_, userId, timestampStr] = comment.split(':');
    const amount = fromNano(inMsg.info.value.coins);

    const user = await getUserById(userId);
    if (!user) continue;

    await plusUserBalance(userId, new Decimal(amount));

    const log = depositLogRepository.create({
      txHash,
      userId,
      amount,
      timestamp: parseInt(timestampStr) || now,
    });

    await depositLogRepository.save(log);

    console.log(`💰 Deposit received: +${amount} TON for user ${userId}`);
  }
}
