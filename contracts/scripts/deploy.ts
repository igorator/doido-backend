import { mnemonicToWalletKey } from '@ton/crypto';
import { TonClient, WalletContractV4 } from '@ton/ton';
import { WalletContract } from '../wrappers/WalletContract';
import { fromNano } from '@ton/core';

async function main() {
  const mnemonic = process.env.TON_MNEMONIC!;
  const key = await mnemonicToWalletKey(mnemonic.split(' '));

  const client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  });

  const wallet = WalletContractV4.create({
    publicKey: key.publicKey,
    workchain: 0,
  });
  const walletContract = client.open(wallet);

  const walletBalance = await walletContract.getBalance();
  console.log('Wallet balance:', fromNano(walletBalance), 'TON');

  const contract = WalletContract.create();
  const opened = client.open(contract);

  await opened.sendDeploy(walletContract.sender(key.secretKey));
  console.log('Contract deployed at:', contract.address.toString());
}

main();
