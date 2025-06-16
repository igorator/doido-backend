import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { beginCell, toNano } from '@ton/core';

import { DepositLog } from '../../models/ton/DepositLog';
import { AppDataSource } from '../../database/db';

const DEPOSIT_WALLET_ADDRESS = process.env.TON_DEPOSIT_WALLET_ADDRESS!;
const EXPIRATION_SECONDS = 300; // 10 минут

async function buildTextPayload(payloadId: string): Promise<string> {
  const cell = beginCell()
    .storeUint(0, 32) // text_comment opcode
    .storeStringTail(payloadId)
    .endCell();
  const boc = cell.toBoc();
  return Buffer.from(boc).toString('base64');
}

export async function depositTon(req: Request, res: Response) {
  try {
    const { userId, amountTon } = req.body;

    if (!userId || !amountTon || Number(amountTon) <= 0) {
      return res
        .status(400)
        .json({ message: 'userId and valid amountTon required' });
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
