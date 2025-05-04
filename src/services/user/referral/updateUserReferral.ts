import { userRepository } from '../../../database/repositories/userRepository';

export class SelfReferralError extends Error {}
export class MutualReferralError extends Error {}
export class AlreadyReferredError extends Error {}
export class UserNotFoundError extends Error {}

export const UserService = {
  async updateUserReferral(userId: string, referredById: string) {
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

    if (user.referred_by) {
      throw new AlreadyReferredError('User already has a referrer');
    }

    if (isMutualReferral(user, referrer)) {
      throw new MutualReferralError('Mutual referral is not allowed');
    }

    user.referred_by = referrer;
    return await userRepository.save(user);
  },
};

// 🧠 Вынесено для читаемости
function isMutualReferral(user: any, referrer: any): boolean {
  return referrer.referred_by?.id === user.id;
}
