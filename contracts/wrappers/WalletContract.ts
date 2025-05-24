import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
} from '@ton/core';

export class WalletContract implements Contract {
  static create(): WalletContract {
    const code = beginCell().endCell();
    const data = beginCell().endCell();
    const address = contractAddress(0, { code, data });
    return new WalletContract(address, code, data);
  }

  constructor(
    readonly address: Address,
    readonly initCode: Cell,
    readonly initData: Cell,
  ) {}

  async sendDeploy(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: '0.05',
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: new Cell(),
    });
  }
}
