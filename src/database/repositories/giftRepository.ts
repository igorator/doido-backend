import { Gift } from '../../models/Gift';
import { AppDataSource } from '../db';

export const giftRepository = AppDataSource.getRepository(Gift);
