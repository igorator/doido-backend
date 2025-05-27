import { DepositLog } from '../../models/DepositLog';
import { AppDataSource } from '../db';

export const depositLogRepository = AppDataSource.getRepository(DepositLog);
