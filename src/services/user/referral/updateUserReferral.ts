import { userRepository } from '../../../database/repositories/userRepository';

export class SelfReferralError extends Error {}
export class MutualReferralError extends Error {}
export class AlreadyReferredError extends Error {}
export class UserNotFoundError extends Error {}

export async function updateUserReferral(userId: string, referredById: string) {
  if (userId === referredById) {
    throw new SelfReferralError('User cannot refer themselves');
  }

  const [user, referrer] = await Promise.all([
    userRepository.findOne({
      where: { id: userId },
      relations: ['referred_by'],
    }),
    userRepository.findOne({
      where: { id: referredById },
      relations: ['referred_by'],
    }),
  ]);

  if (!user || !referrer) {
    throw new UserNotFoundError('User or referrer not found');
  }

  console.log('👀 Current referred_by of user:', user.referred_by?.id ?? null);
  console.log(
    '👀 Referrer is referred_by of:',
    referrer.referred_by?.id ?? null,
  );

  if (user.referred_by) {
    throw new AlreadyReferredError('User already has a referrer');
  }

  if (referrer.referred_by?.id === user.id) {
    throw new MutualReferralError('Mutual referral is not allowed');
  }

  user.referred_by = referrer;
  await userRepository.save(user);

  const fullUser = await userRepository.findOne({
    where: { id: userId },
    relations: ['referred_by', 'referred_users'],
  });

  if (!fullUser) {
    throw new UserNotFoundError('User not found after referral update');
  }

  return fullUser;
}
