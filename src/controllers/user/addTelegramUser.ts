import type { Request, Response } from 'express';
import { userRepository } from '../../database/repositories/userRepository';

export const addTelegramUser = async (req: Request, res: Response) => {
  try {
    const userData = req.body;

    if (!userData?.id) {
      return res.status(400).json({ error: 'Invalid user data' });
    }

    const existingUser = await userRepository.findOneBy({
      id: String(userData.id),
    });

    const savedUser = existingUser
      ? await userRepository.save({ ...existingUser, ...userData })
      : await userRepository.save(userRepository.create(userData));

    res.status(200).json(savedUser);
  } catch (err) {
    console.warn('❌ Failed to save Telegram user:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
