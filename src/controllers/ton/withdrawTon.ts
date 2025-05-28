import { Request, Response } from 'express';
import { Address, toNano } from '@ton/core';
import { WalletContractV5R1, internal, SendMode } from '@ton/ton';
import { getUserById } from '../../services/user/getUserById';
import { minusUserBalance } from '../../services/user/updateUserBalance';
import Decimal from 'decimal.js';
import { tonClient } from '../../ton/tonClient';
import nacl from 'tweetnacl';

const SECRET_KEY = process.env.TON_WALLET_SECRET_KEY!;
const WITHDRAW_SUBWALLET_NUMBER =
  process.env.TON_WITHDRAW_SUBWALLET_NUMBER || 2;

export async function withdrawTon(req: Request, res: Response) {
  try {
    const { userId, amountTon, to } = req.body;

    if (!userId || !to || typeof amountTon !== 'number' || amountTon <= 0) {
      res.status(400).json({ message: 'Invalid withdraw request' });
    }

    const user = await getUserById(userId);
    if (!user) res.status(404).json({ message: 'User not found' });

    if (new Decimal(user.ton_balance).lt(amountTon)) {
      res.status(403).json({ message: 'Insufficient balance' });
    }

    const amountNano = toNano(amountTon.toString());
    const recipient = Address.parse(to);

    const secretKey = Buffer.from(SECRET_KEY, 'hex');
    const keyPair = nacl.sign.keyPair.fromSecretKey(secretKey);
    const publicKey = Buffer.from(keyPair.publicKey);

    const wallet = WalletContractV5R1.create({
      publicKey,
      walletId: {
        networkGlobalId: -1,
        context: {
          walletVersion: 'v5r1',
          subwalletNumber: Number(WITHDRAW_SUBWALLET_NUMBER),
          workchain: 0,
        },
      },
    });

    const contract = tonClient.open(wallet);

    const isDeployed = await tonClient.isContractDeployed(wallet.address);
    if (!isDeployed) {
      res.status(400).json({ message: 'Wallet contract is not deployed' });
    }

    const seqno = await contract.getSeqno();

    await contract.sendTransfer({
      seqno,
      secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
      messages: [
        internal({
          to: recipient,
          value: amountNano,
          bounce: true,
        }),
      ],
    });

    await minusUserBalance(userId, new Decimal(amountTon));

    res.json({ success: true });
  } catch (err) {
    console.error('❌ withdrawTon error:', err);
    res.status(500).json({ message: 'Internal error' });
  }
}
