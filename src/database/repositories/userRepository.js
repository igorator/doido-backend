import { User } from '../../models/User';
import { AppDataSource } from '../db';

export const userRepository = AppDataSource.getRepository(User);
