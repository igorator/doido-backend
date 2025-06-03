import { WithdrawBatch } from '../../../../models/ton/withdraw/WithdrawBatch';
import { AppDataSource } from '../../../db';

export const withdrawBatchRepository =
  AppDataSource.getRepository(WithdrawBatch);
