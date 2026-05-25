import { IsNull } from 'typeorm';
import { userRepository } from '../../database/repositories/userRepository';
import { User } from '../../models/User';
import { createHttpError } from '../../shared/lib/httpError';

export type UpdateReferralResult = { skipped: true } | { skipped: false; user: User };

export async function updateUserReferralService(
  userId: string,
  referredById: string,
): Promise<UpdateReferralResult> {
  if (userId === referredById) {
    return { skipped: true };
  }

  const referrer = await userRepository.findOne({
    where: { id: referredById },
    relations: ['referred_by'],
  });

  if (!referrer) {
    throw createHttpError('Referrer not found', 404);
  }

  if (referrer.referred_by?.id === userId) {
    return { skipped: true };
  }

  const result = await userRepository.update(
    { id: userId, referred_by: IsNull() },
    { referred_by: { id: referredById } },
  );

  if (result.affected === 0) {
    return { skipped: true };
  }

  const updatedUser = await userRepository.findOne({
    where: { id: userId },
    relations: ['referred_by', 'referred_users'],
  });

  if (!updatedUser) {
    throw new Error('User not found after referral update');
  }

  return { skipped: false, user: updatedUser };
}
