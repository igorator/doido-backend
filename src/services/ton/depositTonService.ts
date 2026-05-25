import { v4 as uuidv4 } from 'uuid';
import { beginCell, toNano } from '@ton/core';
import { AppDataSource } from '../../database/db';
import { userRepository } from '../../database/repositories/userRepository';
import { DepositLog } from '../../models/ton/DepositLog';
import { createHttpError } from '../../shared/lib/httpError';
import { config } from '../../config';

const DEPOSIT_WALLET_ADDRESS = config.ton.depositWalletAddress;
const EXPIRATION_SECONDS = 300;
const MIN_TON_DEPOSIT_AMOUNT = config.limits.minDeposit;

export interface DepositTransaction {
  validUntil: number;
  messages: {
    address: string;
    amount: string;
    payload: string;
  }[];
}

function buildTextPayload(payloadId: string): string {
  const cell = beginCell().storeUint(0, 32).storeStringTail(payloadId).endCell();
  return Buffer.from(cell.toBoc()).toString('base64');
}

export async function depositTonService(
  userId: string,
  amountTon: number,
): Promise<DepositTransaction> {
  if (amountTon < MIN_TON_DEPOSIT_AMOUNT) {
    throw createHttpError(`Minimum deposit amount is ${MIN_TON_DEPOSIT_AMOUNT} TON`, 400);
  }

  const user = await userRepository.findOneBy({ id: userId });
  if (!user) {
    throw createHttpError('User not found', 404);
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

  return {
    validUntil: expiresAt,
    messages: [
      {
        address: DEPOSIT_WALLET_ADDRESS,
        amount: amountNano,
        payload: buildTextPayload(payloadId),
      },
    ],
  };
}
