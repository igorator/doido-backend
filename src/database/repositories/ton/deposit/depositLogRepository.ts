import { DepositLog } from '../../../../models/ton/deposit/DepositLog';
import { AppDataSource } from '../../../db';

export const depositLogRepository = AppDataSource.getRepository(DepositLog);
