import { WithdrawLog } from '../../../../models/ton/withdraw/WithdrawLog';
import { AppDataSource } from '../../../db';

export const withdrawLogRepository = AppDataSource.getRepository(WithdrawLog);
