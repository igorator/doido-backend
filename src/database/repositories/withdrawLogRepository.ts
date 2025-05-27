import { WithdrawLog } from '../../models/WithdrawLog';
import { AppDataSource } from '../db';

export const withdrawLogLogRepository =
  AppDataSource.getRepository(WithdrawLog);
