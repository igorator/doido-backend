import { Activity } from '../../models/Activity';
import { AppDataSource } from '../db';

export const activityRepository = AppDataSource.getRepository(Activity);
