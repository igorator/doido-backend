import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { beginCell, toNano } from '@ton/core';

import { DepositLog } from '../../models/ton/DepositLog';
import { AppDataSource } from '../../database/db';
import { User } from '../../models/User';
import { config } from '../../config';

const DEPOSIT_WALLET_ADDRESS = config.ton.depositWalletAddress;
const EXPIRATION_SECONDS = 300;
const MIN_TON_DEPOSIT_AMOUNT = config.limits.minDeposit;

async function buildTextPayload(payloadId: string): Promise<string> {
  const cell = beginCell()
    .storeUint(0, 32)
    .storeStringTail(payloadId)
    .endCell();
  const boc = cell.toBoc();
  return Buffer.from(boc).toString('base64');
}

export async function depositTon(req: Request, res: Response) {
  try {
    const { amountTon } = req.body;
    const telegramUser = (req as any).telegramUser;
    const parsedAmount = Number(amountTon);

    if (!telegramUser?.id) {
      res
        .status(401)
        .json({ message: 'Unauthorized: Telegram user not found' });
      return;
    }

    if (!amountTon) {
      res.status(400).json({ message: 'Deposit amount is required' });
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res
        .status(400)
        .json({ message: 'Deposit amount must be a valid positive number' });
      return;
    }

    if (parsedAmount < MIN_TON_DEPOSIT_AMOUNT) {
      res.status(400).json({
        message: `Minimum deposit amount is ${MIN_TON_DEPOSIT_AMOUNT} TON. Amount: ${amountTon}`,
      });
      return;
    }

    const userId = String(telegramUser.id);

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: telegramUser.id });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const amountNano = toNano(amountTon).toString();
    const payloadId = uuidv4();
    const expiresAt = timestamp + EXPIRATION_SECONDS;

    await AppDataSource.getRepository(DepositLog).insert({
      userId,
      payload: payloadId,
      amountNano,
      timestamp,
      expiresAt,
      status: 'pending',
    });

    const payload = await buildTextPayload(payloadId);

    const transaction = {
      validUntil: expiresAt,
      messages: [
        {
          address: DEPOSIT_WALLET_ADDRESS,
          amount: amountNano,
          payload,
        },
      ],
    };

    res.json({ transaction });
  } catch (err) {
    console.error('❌ depositTon error:', err);
    res.status(500).json({ message: 'Internal error' });
  }
}
