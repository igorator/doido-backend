import type { Request, Response } from 'express';
import { userRepository } from '../../database/repositories/userRepository';

export const updateUserReferral = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { referred_by } = req.body;

    console.log('➡️ Referral attempt:', { userId, referred_by });

    if (!userId || !referred_by) {
      return res.status(400).json({ error: 'Missing userId or referred_by' });
    }

    if (String(userId) === String(referred_by)) {
      return res.status(409).json({ error: 'User cannot refer themselves' });
    }

    const user = await userRepository.findOne({
      where: { id: String(userId) },
      relations: ['referred_by'],
    });

    const referrer = await userRepository.findOne({
      where: { id: String(referred_by) },
      relations: ['referred_by'],
    });

    if (!user || !referrer) {
      return res.status(404).json({ error: 'User or referrer not found' });
    }

    if (user.referred_by) {
      return res.status(409).json({ error: 'User already has a referrer' });
    }

    if (referrer.referred_by?.id === user.id) {
      return res.status(409).json({ error: 'Mutual referral is not allowed' });
    }

    user.referred_by = referrer;
    const updatedUser = await userRepository.save(user);

    return res.status(200).json(updatedUser);
  } catch (err) {
    console.error('❌ Failed to update user referral:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
