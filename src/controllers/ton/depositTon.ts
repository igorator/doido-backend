import { Request, Response } from 'express';
import TonWeb from 'tonweb';
import { v4 as uuidv4 } from 'uuid';

import { DepositLog } from '../../models/ton/DepositLog';
import { AppDataSource } from '../../database/db';

const DEPOSIT_WALLET_ADDRESS = process.env.TON_DEPOSIT_WALLET!;

async function buildTextPayload(payloadId: string) {
  const cell = new TonWeb.boc.Cell();
  cell.bits.writeUint(0, 32); // text_comment opcode
  cell.bits.writeString(payloadId); // uuid как служебный идентификатор
  const boc = await cell.toBoc();
  return Buffer.from(boc).toString('base64');
}

export async function depositTon(req: Request, res: Response) {
  try {
    const { userId, amountTon } = req.body;
    if (!userId || amountTon <= 0) {
      return res.status(400).json({ message: 'userId and amountTon required' });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const amountNano = TonWeb.utils.toNano(amountTon).toString();

    // Генерируем уникальный ID для депозита, он же пойдет в payload
    const payloadId = uuidv4();

    // Логируем именно payloadId (UUID) — для трекинга
    await AppDataSource.getRepository(DepositLog).insert({
      userId,
      payload: payloadId,
      amountNano,
      timestamp,
      status: 'pending',
    });

    // Формируем base64 payload для TonConnect
    const payload = await buildTextPayload(payloadId);

    const transaction = {
      validUntil: timestamp + 600,
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
